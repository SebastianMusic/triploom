import { render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/components/ui/theme-provider';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DesignSystemExample } from '@/components/ui/example-usage';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { ListItem } from '@/components/ui/list-item';

jest.mock('@expo/vector-icons', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text: MockText } = require('react-native');

  return {
    Ionicons: ({ name, accessibilityLabel }: { name: string; accessibilityLabel?: string }) =>
      React.createElement(MockText, { accessibilityLabel }, name),
  };
});

jest.mock('react-native-safe-area-context', () => {
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    useSafeAreaInsets: () => ({
      top: 44,
      right: 0,
      bottom: 34,
      left: 0,
    }),
  };
});

describe('design system primitives', () => {
  it('renders the core components inside ThemeProvider', () => {
    render(
      <ThemeProvider modeOverride="light">
        <Button label="Book now" />
        <Card>
          <Badge label="Info" />
        </Card>
        <Input label="Destination" placeholder="Oslo" />
        <Avatar name="Trip Loom" />
        <ListItem title="Events" subtitle="See upcoming plans" />
        <IconButton accessibilityLabel="Open profile" icon={<Avatar name="Trip Loom" size="sm" />} />
      </ThemeProvider>
    );

    expect(screen.getByText('Book now')).toBeOnTheScreen();
    expect(screen.getByText('Info')).toBeOnTheScreen();
    expect(screen.getByText('Destination')).toBeOnTheScreen();
    expect(screen.getAllByText('TL')).toHaveLength(2);
    expect(screen.getByText('Events')).toBeOnTheScreen();
    expect(screen.getByLabelText('Open profile')).toBeOnTheScreen();
  });

  it('renders the example usage component', () => {
    render(
      <ThemeProvider modeOverride="dark">
        <DesignSystemExample />
      </ThemeProvider>
    );

    expect(screen.getByText('Design System Playground')).toBeOnTheScreen();
    expect(screen.getByText('Hvordan theme fungerer')).toBeOnTheScreen();
    expect(screen.getByText('Travel group')).toBeOnTheScreen();
    expect(screen.getByText('Theme: dark')).toBeOnTheScreen();
  });
});
