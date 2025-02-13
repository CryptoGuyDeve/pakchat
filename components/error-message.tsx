import { Snackbar } from 'react-native-paper';

type ErrorMessageProps = {
  message: string;
  onDismiss: () => void;
};

export function ErrorMessage({ message, onDismiss }: ErrorMessageProps) {
  return (
    <Snackbar
      visible={!!message}
      onDismiss={onDismiss}
      action={{
        label: 'Dismiss',
        onPress: onDismiss,
      }}
    >
      {message}
    </Snackbar>
  );
} 