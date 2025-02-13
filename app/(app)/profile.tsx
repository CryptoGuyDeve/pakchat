import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, TextInput, Avatar, Text } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { router } from 'expo-router';

export default function Profile() {
  const { session, profile, signOut } = useAuth();
  const [username, setUsername] = useState(profile?.username || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    if (!session?.user.id) return;

    try {
      setUploading(true);

      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop();
      const fileName = `${session.user.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', session.user.id);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setUploading(false);
    }
  };

  const updateProfile = async () => {
    if (!session?.user.id || !username.trim()) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({ username: username.trim() })
        .eq('id', session.user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <Avatar.Image
          size={100}
          source={
            profile?.avatar_url
              ? { uri: profile.avatar_url }
              : require('../../assets/default-avatar.png')
          }
        />
        <Button
          mode="outlined"
          onPress={pickImage}
          loading={uploading}
          style={styles.uploadButton}
        >
          Upload Photo
        </Button>
      </View>

      <TextInput
        label="Username"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={updateProfile}
        loading={saving}
        style={styles.button}
      >
        Save Profile
      </Button>

      <Button
        mode="outlined"
        onPress={handleSignOut}
        style={styles.button}
      >
        Sign Out
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadButton: {
    marginTop: 10,
  },
  input: {
    marginBottom: 20,
  },
  button: {
    marginBottom: 10,
  },
}); 