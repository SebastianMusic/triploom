import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

type PickSingleImageOptions = {
  aspect?: [number, number];
};

export async function pickSingleImageFromLibrary(
  options: PickSingleImageOptions = {},
): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: options.aspect,
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]?.uri) {
    return null;
  }

  const selectedUri = result.assets[0].uri;

  if (selectedUri.startsWith('content://')) {
    const normalized = await manipulateAsync(
      selectedUri,
      [],
      { compress: 0.8, format: SaveFormat.JPEG },
    );
    return normalized.uri;
  }

  return selectedUri;
}
