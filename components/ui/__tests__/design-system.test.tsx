import { render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/components/ui/theme-provider';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DesignSystemExample } from '@/components/ui/example-usage';
import { Input } from '@/components/ui/input';
import { ListItem } from '@/components/ui/list-item';

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
      </ThemeProvider>
    );

    expect(screen.getByText('Book now')).toBeOnTheScreen();
    expect(screen.getByText('Info')).toBeOnTheScreen();
    expect(screen.getByText('Destination')).toBeOnTheScreen();
    expect(screen.getByText('TL')).toBeOnTheScreen();
    expect(screen.getByText('Events')).toBeOnTheScreen();
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
  });
});
