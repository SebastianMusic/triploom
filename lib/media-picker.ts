import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

type PickSingleImageOptions = {
  aspect?: [number, number];
};

export async function pickSingleImageFromLibrary(
  _options: PickSingleImageOptions = {},
): Promise<string | null> {
  const result = await pickImagesFromLibrary({ selectionLimit: 1 });

  if (!result[0]?.uri) {
    return null;
  }

  return result[0].uri;
}

export async function pickImagesFromLibrary({
  selectionLimit = 1,
}: {
  selectionLimit?: number;
} = {}): Promise<ImagePicker.ImagePickerAsset[]> {
  try {
    const existingPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
    const permission =
      existingPermission.granted || existingPermission.accessPrivileges === 'limited'
        ? existingPermission
        : existingPermission.canAskAgain
          ? await ImagePicker.requestMediaLibraryPermissionsAsync()
          : existingPermission;

    if (!permission.granted && permission.accessPrivileges !== 'limited') {
      Alert.alert(
        'Photo access needed',
        'Open settings and allow photo library access for Expo Go to choose images.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => { void Linking.openSettings(); } },
        ],
      );
      return [];
    }

    const allowsMultipleSelection = selectionLimit > 1;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      ...(allowsMultipleSelection ? { allowsMultipleSelection, selectionLimit } : {}),
      quality: 0.8,
    });

    if (result.canceled) return [];
    return result.assets.filter((asset) => !!asset.uri);
  } catch (error) {
    Alert.alert(
      'Could not open photos',
      error instanceof Error ? error.message : 'Photo library is unavailable on this device.',
    );
    return [];
  }
}
