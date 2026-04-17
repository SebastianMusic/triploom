import { ScrollView, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Input } from '@/components/ui/input';
import { ListItem } from '@/components/ui/list-item';
import { Row } from '@/components/ui/row';
import { Stack } from '@/components/ui/stack';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';

function ColorSwatch({
  label,
  value,
  backgroundColor,
}: {
  label: string;
  value: string;
  backgroundColor: string;
}) {
  const {
    theme: { colors, radius, spacing },
  } = useAppTheme();

  return (
    <Card
      style={{
        flex: 1,
        padding: spacing.sm,
      }}>
      <Stack space="xs">
        <View
          style={{
            height: spacing.xxl,
            borderRadius: radius.md,
            backgroundColor,
            borderWidth: backgroundColor === colors.background ? 1 : 0,
            borderColor: colors.border,
          }}
        />
        <AppText variant="caption">{label}</AppText>
        <AppText variant="caption" tone="muted">
          {value}
        </AppText>
      </Stack>
    </Card>
  );
}

export function DesignSystemExample() {
  const {
    mode,
    theme: { colors, layout, radius, spacing },
  } = useAppTheme();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: spacing.md,
        paddingBottom: spacing.xxxl,
      }}
      showsVerticalScrollIndicator={false}>
      <Container>
        <Stack space="lg">
          <Stack space="sm">
            <Badge label={`Theme: ${mode}`} />
            <AppText variant="title">Design System Playground</AppText>
            <AppText tone="muted">
              Denne skjermen er levende dokumentasjon. Hvis noen skal bygge nye sider senere, skal de starte her:
              bruk tokens fra theme, bygg med primitive komponenter, og unngå hardkodede verdier.
            </AppText>
          </Stack>

          <Card variant="elevated">
            <Stack space="sm">
              <AppText variant="subtitle">Hvordan theme fungerer</AppText>
              <AppText>
                1. Bruk alltid <AppText tone="primary">theme.colors</AppText>, <AppText tone="primary">theme.spacing</AppText>,{' '}
                <AppText tone="primary">theme.radius</AppText> og <AppText tone="primary">theme.typography</AppText> som førstevalg.
              </AppText>
              <AppText>
                2. Hvis en skjerm trenger et nytt visuelt mønster flere steder, utvider man theme med en ny{' '}
                <AppText tone="primary">semantisk token</AppText>, ikke en ny tilfeldig hex-verdi.
              </AppText>
              <AppText>
                3. Hvis behovet bare er layout, komponer med <AppText tone="primary">Container</AppText>,{' '}
                <AppText tone="primary">Stack</AppText> og <AppText tone="primary">Row</AppText> før du lager nye komponenter.
              </AppText>
              <AppText tone="muted">
                Tommelfingerregel: bruk det som er hvis det dekker 80-90% av behovet. Utvid først når samme mønster dukker opp igjen.
              </AppText>
            </Stack>
          </Card>

          <Stack space="sm">
            <AppText variant="subtitle">Palette and hierarchy</AppText>
            <AppText tone="muted">
              60-30-10 her betyr rolige nøytrale bakgrunner, blå som handlingsfarge, og varm sand/gul veldig sparsomt.
            </AppText>
            <Row align="stretch">
              <ColorSwatch label="Background" value={colors.background} backgroundColor={colors.background} />
              <ColorSwatch label="Surface" value={colors.surface} backgroundColor={colors.surface} />
            </Row>
            <Row align="stretch">
              <ColorSwatch label="Primary" value={colors.primary} backgroundColor={colors.primary} />
              <ColorSwatch label="Secondary" value={colors.secondarySoft} backgroundColor={colors.secondarySoft} />
              <ColorSwatch label="Accent" value={colors.accentSoft} backgroundColor={colors.accentSoft} />
            </Row>
          </Stack>

          <Stack space="sm">
            <AppText variant="subtitle">Layout primitives</AppText>
            <AppText tone="muted">
              Denne seksjonen er bygd med <AppText tone="primary">Container</AppText>, <AppText tone="primary">Stack</AppText> og{' '}
              <AppText tone="primary">Row</AppText>. Det er meningen at de skal styre whitespace på tvers av appen.
            </AppText>
            <Card>
              <Stack>
                <Row justify="space-between">
                  <AppText>Screen padding</AppText>
                  <AppText tone="muted">{layout.screenPadding}px</AppText>
                </Row>
                <Row justify="space-between">
                  <AppText>Content gap</AppText>
                  <AppText tone="muted">{layout.contentGap}px</AppText>
                </Row>
                <Row justify="space-between">
                  <AppText>Card radius</AppText>
                  <AppText tone="muted">{radius.lg}px</AppText>
                </Row>
              </Stack>
            </Card>
          </Stack>

          <Stack space="sm">
            <AppText variant="subtitle">Text</AppText>
            <Card>
              <Stack space="xs">
                <AppText variant="title">Title text</AppText>
                <AppText variant="subtitle">Subtitle text</AppText>
                <AppText>Body text brukes til vanlig innhold og beskrivelser.</AppText>
                <AppText variant="caption" tone="muted">
                  Caption brukes til sekundær informasjon, hint og labels.
                </AppText>
              </Stack>
            </Card>
          </Stack>

          <Stack space="sm">
            <AppText variant="subtitle">Buttons</AppText>
            <Card>
              <Stack space="sm">
                <Row>
                  <Button label="Primary" />
                  <Button label="Secondary" variant="secondary" />
                </Row>
                <Row>
                  <Button label="Ghost" variant="ghost" />
                  <Button label="Disabled" disabled />
                </Row>
                <Button label="Full width action" fullWidth />
              </Stack>
            </Card>
          </Stack>

          <Stack space="sm">
            <AppText variant="subtitle">Cards</AppText>
            <Stack space="sm">
              <Card>
                <Stack space="xs">
                  <AppText>Default card</AppText>
                  <AppText variant="caption" tone="muted">
                    Flat content surface with subtle border.
                  </AppText>
                </Stack>
              </Card>
              <Card variant="elevated">
                <Stack space="xs">
                  <AppText>Elevated card</AppText>
                  <AppText variant="caption" tone="muted">
                    Uses the shared shadow token, not a local shadow.
                  </AppText>
                </Stack>
              </Card>
              <Card variant="interactive">
                <Stack space="xs">
                  <AppText>Interactive card</AppText>
                  <AppText variant="caption" tone="muted">
                    Has pressed/hover feedback and is meant for tappable content.
                  </AppText>
                </Stack>
              </Card>
            </Stack>
          </Stack>

          <Stack space="sm">
            <AppText variant="subtitle">Inputs</AppText>
            <Card>
              <Stack space="sm">
                <Input label="Default" placeholder="Trip title" hint="Use for normal form input." />
                <Input
                  label="Error state"
                  placeholder="Organizer name"
                  value=" "
                  error="Use error state for validation feedback, not custom red text outside the component."
                />
                <Input
                  label="Multiline"
                  placeholder="Short event description"
                  multiline
                  hint="The same component covers larger text areas."
                />
              </Stack>
            </Card>
          </Stack>

          <Stack space="sm">
            <AppText variant="subtitle">Badges and avatar</AppText>
            <Card>
              <Stack space="sm">
                <Row>
                  <Badge label="Info" />
                  <Badge label="Success" variant="success" />
                  <Badge label="Warning" variant="warning" />
                </Row>
                <Row>
                  <Avatar name="Trip Loom" size="sm" />
                  <Avatar name="Trip Loom" size="md" />
                  <Avatar name="Trip Loom" size="lg" />
                </Row>
              </Stack>
            </Card>
          </Stack>

          <Stack space="sm">
            <AppText variant="subtitle">List items</AppText>
            <Card>
              <Stack space="sm">
                <ListItem
                  title="Next event"
                  subtitle="Saturday at 18:00"
                  leading={<Avatar name="Evening walk" />}
                  trailing={<Badge label="Info" />}
                />
                <ListItem
                  title="Travel group"
                  subtitle="4 participants active"
                  leading={<Avatar name="Trip Loom" />}
                  trailing={<Badge label="Ready" variant="success" />}
                />
              </Stack>
            </Card>
          </Stack>

          <Card variant="elevated" style={{ backgroundColor: colors.surfaceMuted }}>
            <Stack space="sm">
              <AppText variant="subtitle">When to extend the system</AppText>
              <AppText>
                Utvid theme når en ny <AppText tone="primary">rolle</AppText> mangler, for eksempel en ny semantisk state eller et nytt
                gjenbrukbart surface-mønster.
              </AppText>
              <AppText>
                Lag en ny komponent når samme UI-mønster dukker opp på flere sider. Hvis det bare er én enkel layout på én side, komponer med
                primitive komponenter først.
              </AppText>
              <AppText tone="muted">
                Målet er ikke flest mulig komponenter. Målet er færrest mulig primitives som gir mest mulig consistency.
              </AppText>
            </Stack>
          </Card>
        </Stack>
      </Container>
    </ScrollView>
  );
}
