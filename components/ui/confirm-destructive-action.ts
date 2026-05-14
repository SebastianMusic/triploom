import { Alert } from 'react-native';

type ConfirmDestructiveActionOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
};

export function confirmDestructiveAction({
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
}: ConfirmDestructiveActionOptions) {
  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    {
      text: confirmLabel,
      style: 'destructive',
      onPress: () => {
        void Promise.resolve(onConfirm()).catch((error) => {
          Alert.alert(
            'Action failed',
            error instanceof Error ? error.message : 'Please try again.',
          );
        });
      },
    },
  ]);
}
