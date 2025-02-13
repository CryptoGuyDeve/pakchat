import { ScrollView, StyleSheet, View, Linking } from 'react-native';
import { Text, Card, Avatar, Button, useTheme, Divider } from 'react-native-paper';

type TeamMember = {
  name: string;
  role: string;
  avatar?: string;
  linkedin?: string;
};

const teamMembers: TeamMember[] = [
  {
    name: 'Faizurrehman',
    role: 'Founder',
  },
  {
    name: 'Shaaf',
    role: 'CEO',
  },
  {
    name: 'Azan Jutt',
    role: 'CEO',
  },
];

export default function AboutUs() {
  const theme = useTheme();

  const openLinkedIn = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Company Info Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineMedium" style={styles.companyName}>
            CodeAndMotion
          </Text>
          <Text variant="bodyLarge" style={styles.tagline}>
            Connecting People Through Innovation
          </Text>
          <Divider style={styles.divider} />
          <Text variant="bodyMedium" style={styles.description}>
            CodeAndMotion is a leading software development company specializing in creating 
            innovative mobile and web applications. Our mission is to transform ideas into 
            powerful digital solutions that connect people and enhance lives.
          </Text>
        </Card.Content>
      </Card>

      {/* Our Team Section */}
      <Text variant="titleLarge" style={styles.sectionTitle}>Our Team</Text>
      
      {teamMembers.map((member, index) => (
        <Card key={index} style={styles.memberCard}>
          <Card.Content style={styles.memberContent}>
            <Avatar.Text 
              size={60} 
              label={member.name.substring(0, 2).toUpperCase()} 
              style={{ backgroundColor: theme.colors.primary }}
            />
            <View style={styles.memberInfo}>
              <Text variant="titleMedium">{member.name}</Text>
              <Text variant="bodyMedium" style={styles.role}>{member.role}</Text>
              {member.linkedin && (
                <Button
                  mode="text"
                  icon="linkedin"
                  onPress={() => openLinkedIn(member.linkedin!)}
                  style={styles.linkedinButton}
                >
                  Connect
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>
      ))}

      {/* Contact Section */}
      <Card style={[styles.card, styles.contactCard]}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.contactTitle}>
            Get in Touch
          </Text>
          <Text variant="bodyMedium" style={styles.contactInfo}>
            Email: codeandmotion.business@gmail.com
          </Text>
          <Text variant="bodyMedium" style={styles.contactInfo}>
            Phone: +92 319 3240345
          </Text>
          <Text variant="bodyMedium" style={styles.contactInfo}>
            Location: Lahore, Pakistan
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  companyName: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagline: {
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.7,
  },
  divider: {
    marginVertical: 16,
  },
  description: {
    textAlign: 'center',
    lineHeight: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  memberCard: {
    marginBottom: 12,
  },
  memberContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberInfo: {
    marginLeft: 16,
    flex: 1,
  },
  role: {
    opacity: 0.7,
    marginTop: 4,
  },
  linkedinButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  contactCard: {
    backgroundColor: '#f5f5f5',
  },
  contactTitle: {
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  contactInfo: {
    textAlign: 'center',
    marginBottom: 8,
  },
}); 