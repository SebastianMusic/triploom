import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Platform } from 'react-native';

import { BottomActionSheet } from '@/components/ui/bottom-action-sheet';
import { ThemeProvider } from '@/components/ui/theme-provider';

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

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({
    top: 44,
    right: 0,
    bottom: 34,
    left: 0,
  }),
}));

describe('BottomActionSheet', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('runs iOS actions only after the modal has dismissed', () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'ios',
    });

    const onClose = jest.fn();
    const onPress = jest.fn();
    const { UNSAFE_getByType } = render(
      <ThemeProvider modeOverride="light">
        <BottomActionSheet
          visible
          title="Photo"
          onClose={onClose}
          items={[
            {
              key: 'library',
              label: 'Choose from library',
              icon: 'images-outline',
              onPress,
            },
          ]}
        />
      </ThemeProvider>
    );

    fireEvent.press(screen.getByText('Choose from library'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();

    const modal = UNSAFE_getByType(require('react-native').Modal);
    modal.props.onDismiss();

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
