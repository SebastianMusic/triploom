import * as ImagePicker from 'expo-image-picker';

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

  return result.assets[0].uri;
}
