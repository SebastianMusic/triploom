import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRef } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import type { MessageImage } from '@/types';

interface Props {
  images: MessageImage[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
}

export function ImageViewer({ images, initialIndex, visible, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const {
    theme: { colors, spacing },
  } = useAppTheme();
  const flatListRef = useRef<FlatList>(null);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.root, { backgroundColor: '#000' }]}>
        <FlatList
          ref={flatListRef}
          data={images}
          keyExtractor={(item) => item.path}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
          renderItem={({ item }) => (
            <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
              <Image
                source={{ uri: item.url }}
                style={{ width, height }}
                contentFit="contain"
              />
            </View>
          )}
        />

        <Pressable
          style={[styles.closeButton, { top: spacing.xxl, right: spacing.sm, backgroundColor: 'rgba(0,0,0,0.5)' }]}
          onPress={onClose}
          hitSlop={12}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </Pressable>

        {images.length > 1 && (
          <View style={styles.dots}>
            {images.map((img, i) => (
              <View
                key={img.path}
                style={[
                  styles.dot,
                  { backgroundColor: i === initialIndex ? '#fff' : 'rgba(255,255,255,0.4)' },
                ]}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    position: 'absolute',
    bottom: 32,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});
