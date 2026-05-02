import * as ImagePicker from 'expo-image-picker';

type PickSingleImageOptions = {
  aspect?: [number, number];
};

export async function pickSingleImageFromLibrary(
  _options: PickSingleImageOptions = {},
): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: false,
    selectionLimit: 1,
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]?.uri) {
    return null;
  }

  return result.assets[0].uri;
}
