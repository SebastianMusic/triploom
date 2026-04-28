import { ScrollView, Pressable, View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { ImagePickerAsset } from 'expo-image-picker';
import { useAppTheme } from '@/components/ui/theme-provider';

interface Props {
  assets: ImagePickerAsset[];
  onRemove: (index: number) => void;
  disabled?: boolean;
}

export function ImageThumbnailStrip({ assets, onRemove, disabled }: Props) {
  const { theme: { colors } } = useAppTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {assets.map((asset, index) => (
        <View key={`${asset.uri}-${index}`} style={styles.thumbnail}>
          <Image
            source={{ uri: asset.uri }}
            style={styles.image}
            contentFit="cover"
          />
          {!disabled && (
            <Pressable
              style={[styles.removeButton, { backgroundColor: colors.background }]}
              onPress={() => onRemove(index)}
              hitSlop={8}
            >
              <Ionicons name="close" size={12} color={colors.text} />
            </Pressable>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 8,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 6,
    overflow: 'hidden',
  },
  image: {
    width: 64,
    height: 64,
  },
  removeButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9,
  },
});
