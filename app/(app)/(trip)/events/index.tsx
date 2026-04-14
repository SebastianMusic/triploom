import { ImageBackground, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui';
import { useAppTheme } from '@/hooks/use-app-theme';

const categories = [
  { id: 'c1', icon: '🏠', label: 'Stay' },
  { id: 'c2', icon: '🎈', label: 'Experiences' },
  { id: 'c3', icon: '🧭', label: 'Adventures' },
  { id: 'c4', icon: '✈️', label: 'Flights' },
];

const experiences = [
  {
    id: 'e1',
    title: 'The Golden Circle, Iceland',
    meta: '5-7 days  •  20 km',
    image:
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'e2',
    title: 'Coastal Road Escape',
    meta: '11 days  •  44 km',
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  },
];

export default function EventsScreen() {
  const {
    theme: { colors, spacing, radius },
  } = useAppTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.s,
          paddingTop: spacing.s,
          paddingBottom: spacing.l,
        }}>
        <View
          style={{
            borderRadius: radius.l,
            backgroundColor: colors.bgLight,
            borderWidth: 1,
            borderColor: colors.borderMuted,
            padding: spacing.m,
            gap: spacing.m,
            shadowColor: colors.shadow,
            shadowOpacity: 0.14,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 6 },
            elevation: 6,
          }}>
          <View style={{ gap: spacing.s }}>
            <AppText variant="title" style={{ fontSize: 38, lineHeight: 42 }}>
              <AppText variant="title" tone="secondary" style={{ fontSize: 38, lineHeight: 42 }}>
                Hello,
              </AppText>{' '}
              what are you looking for?
            </AppText>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.s }}>
            {categories.map((item) => (
              <View
                key={item.id}
                style={{
                  alignItems: 'center',
                  gap: 6,
                  minWidth: 70,
                }}>
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 15,
                    backgroundColor: colors.bg,
                    borderWidth: 1,
                    borderColor: colors.borderMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <AppText style={{ fontSize: 20 }}>{item.icon}</AppText>
                </View>
                <AppText variant="caption" tone="muted">
                  {item.label}
                </AppText>
              </View>
            ))}
          </ScrollView>

          <View style={{ gap: spacing.s }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <AppText variant="subtitle">Best Experiences</AppText>
              <AppText tone="muted">•••</AppText>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.s }}>
              {experiences.map((item) => (
                <ImageBackground
                  key={item.id}
                  source={{ uri: item.image }}
                  style={{
                    width: 205,
                    height: 255,
                    borderRadius: radius.m,
                    overflow: 'hidden',
                    justifyContent: 'flex-end',
                  }}
                  imageStyle={{ borderRadius: radius.m }}>
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0,0,0,0.30)',
                    }}
                  />
                  <View style={{ padding: spacing.s, gap: 6 }}>
                    <AppText variant="subtitle" style={{ color: '#FFFFFF', lineHeight: 26 }}>
                      {item.title}
                    </AppText>
                    <AppText variant="caption" style={{ color: '#F1F5F9' }}>
                      {item.meta}
                    </AppText>
                  </View>
                </ImageBackground>
              ))}
            </ScrollView>
          </View>

          <ImageBackground
            source={{
              uri: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
            }}
            style={{
              height: 290,
              borderRadius: radius.l,
              overflow: 'hidden',
              justifyContent: 'flex-end',
            }}
            imageStyle={{ borderRadius: radius.l }}>
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.40)',
              }}
            />
            <View style={{ padding: spacing.m, gap: spacing.s }}>
              <AppText variant="title" style={{ color: '#FFFFFF' }}>
                Enjoy the world
              </AppText>
              <AppText style={{ color: '#E2E8F0' }}>
                We will help you to find the best experiences and adventures.
              </AppText>
            </View>
          </ImageBackground>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
