import type { ViewStyle } from 'react-native';

export type ShadowLevel = 'sm' | 'md' | 'lg' | 'none';

export function getShadow(level: ShadowLevel, shadowColor: string): ViewStyle {
  if (level === 'none') return {};
  if (level === 'sm') {
    return {
      shadowColor,
      shadowOpacity: 0.14,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 0 },
      elevation: 3,
    };
  }
  if (level === 'lg') {
    return {
      shadowColor,
      shadowOpacity: 0.2,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 1 },
      elevation: 7,
    };
  }
  return {
    shadowColor,
    shadowOpacity: 0.17,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  };
}
