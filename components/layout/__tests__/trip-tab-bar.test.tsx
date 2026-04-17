import { render } from '@testing-library/react-native';

import { ThemeProvider } from '@/components/ui/theme-provider';
import { TripTabBar } from '@/components/layout/trip-tab-bar';
import { TRIP_TAB_ITEMS } from '@/components/layout/trip-navigation';

jest.mock('@expo/vector-icons', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name }: { name: string }) => React.createElement(Text, null, name),
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, right: 0, bottom: 34, left: 0 }),
}));

function makeTabBarProps(activeRouteName: string) {
  const routes = [
    ...TRIP_TAB_ITEMS.map((item, idx) => ({ key: `r${idx}`, name: item.routeName })),
    { key: 'r-room', name: 'chat/[roomId]' },
  ];
  const activeIndex = routes.findIndex((r) => r.name === activeRouteName);
  const descriptors = Object.fromEntries(
    routes.map((r) => [
      r.key,
      { options: { tabBarAccessibilityLabel: r.name }, navigation: {} as never, render: () => null, route: r },
    ])
  );
  return {
    state: {
      index: activeIndex >= 0 ? activeIndex : 0,
      routes,
      key: 'tab-nav',
      type: 'tab' as const,
      history: [] as never[],
      routeNames: routes.map((r) => r.name),
      stale: false as const,
    },
    descriptors,
    navigation: { emit: jest.fn(() => ({ defaultPrevented: false })), navigate: jest.fn() } as never,
  };
}

function renderTabBar(activeRouteName: string) {
  return render(
    <ThemeProvider modeOverride="light">
      <TripTabBar {...(makeTabBarProps(activeRouteName) as never)} />
    </ThemeProvider>
  );
}

describe('TripTabBar', () => {
  it('renders nothing when inside a chat room', () => {
    const { toJSON } = renderTabBar('chat/[roomId]');
    expect(toJSON()).toBeNull();
  });

  it('renders tab buttons on primary tab routes', () => {
    const { getByLabelText } = renderTabBar('chat/index');
    expect(getByLabelText('chat/index')).toBeTruthy();
    expect(getByLabelText('home/index')).toBeTruthy();
  });
});
