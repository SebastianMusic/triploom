import { RefreshControl, type RefreshControlProps } from 'react-native';

import { useAppTheme } from '@/components/ui/theme-provider';

type AppRefreshControlProps = Omit<RefreshControlProps, 'colors' | 'tintColor'>;

export function AppRefreshControl(props: AppRefreshControlProps) {
  const {
    theme: { colors },
  } = useAppTheme();

  return <RefreshControl tintColor={colors.primary} colors={[colors.primary]} {...props} />;
}
