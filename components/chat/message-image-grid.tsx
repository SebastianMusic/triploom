import { useState } from 'react';
import { View, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { AppText } from '@/components/ui/text';
import type { MessageImage } from '@/types';

interface Props {
  images: MessageImage[];
  onImagePress: (index: number) => void;
}

const GRID_GAP = 2;

function ImageTile({
  image,
  style,
  onPress,
  overlay,
}: {
  image: MessageImage;
  style: object;
  onPress: () => void;
  overlay?: string;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.tile, style]}>
      <Image
        source={{ uri: image.url }}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
      />
      {overlay && (
        <View style={styles.overlay}>
          <AppText style={styles.overlayText}>{overlay}</AppText>
        </View>
      )}
    </Pressable>
  );
}

export function MessageImageGrid({ images, onImagePress }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const bubbleWidth = Math.max(140, Math.min(screenWidth * 0.43, 240));
  const [aspectRatios, setAspectRatios] = useState<Record<string, number>>({});

  if (images.length === 0) return null;

  if (images.length === 1) {
    const image = images[0];
    const aspectRatio = aspectRatios[image.path] ?? 4 / 3;

    return (
      <Pressable
        onPress={() => onImagePress(0)}
        style={[styles.single, { width: bubbleWidth, aspectRatio }]}>
        <Image
          source={{ uri: image.url }}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          onLoad={(event) => {
            const width = event.source.width;
            const height = event.source.height;
            if (width > 0 && height > 0) {
              setAspectRatios((current) => ({ ...current, [image.path]: width / height }));
            }
          }}
        />
      </Pressable>
    );
  }

  const tileSize = (bubbleWidth - GRID_GAP) / 2;
  const visibleImages = images.length <= 4 ? images : images.slice(0, 4);
  const overflowCount = images.length > 4 ? images.length - 3 : 0;

  return (
    <View style={[styles.grid, { width: bubbleWidth }]}>
      {visibleImages.map((img, i) => {
        const isOverflowTile = overflowCount > 0 && i === 3;
        return (
          <ImageTile
            key={img.path}
            image={img}
            style={{ width: tileSize, height: tileSize, marginBottom: GRID_GAP, marginRight: i % 2 === 0 ? GRID_GAP : 0 }}
            onPress={() => onImagePress(i)}
            overlay={isOverflowTile ? `+${overflowCount}` : undefined}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  single: {
    borderRadius: 8,
    overflow: 'hidden',
    minHeight: 80,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
    borderRadius: 8,
  },
  tile: {
    overflow: 'hidden',
    backgroundColor: '#ccc',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
