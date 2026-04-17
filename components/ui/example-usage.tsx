import { Ionicons } from '@expo/vector-icons';
import { ScrollView, View } from 'react-native';

import { useTripChromeInsets } from '@/components/layout';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { IconButton } from '@/components/ui/icon-button';
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
  const { headerContentOffset, bottomOverlayOffset } = useTripChromeInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: headerContentOffset,
        paddingBottom: Math.max(spacing.xxxl, bottomOverlayOffset),
      }}
      showsVerticalScrollIndicator={false}>
      <Container>
        <Stack space="lg">
          <Stack space="sm">
            <Badge label={`Theme: ${mode}`} />
            <AppText variant="title">Design System Playground</AppText>
            <AppText tone="muted">
              Dette er levende dokumentasjon for nye skjermer. Bygg med theme-tokens, bruk primitive komponenter
              først, og legg delt app-chrome i layout-laget i stedet for å style hver side på nytt.
            </AppText>
          </Stack>

          <Card variant="elevated">
            <Stack space="sm">
              <AppText variant="subtitle">Hvordan theme fungerer</AppText>
              <AppText>
                1. Start alltid med <AppText tone="primary">theme.colors</AppText>,{' '}
                <AppText tone="primary">theme.spacing</AppText>, <AppText tone="primary">theme.radius</AppText> og{' '}
                <AppText tone="primary">theme.typography</AppText>.
              </AppText>
              <AppText>
                2. Hvis samme visuelle rolle dukker opp flere steder, legg til en ny token. Ikke legg inn en ny tilfeldig
                hex-verdi i én skjerm.
              </AppText>
              <AppText>
                3. Bruk <AppText tone="primary">components/ui</AppText> for primitives og{' '}
                <AppText tone="primary">components/layout</AppText> for delt navigasjon og skjerm-chrome som trip-header
                og bottom pill-nav.
              </AppText>
              <AppText tone="muted">
                Tommelfingerregel: utvid først når samme mønster dukker opp igjen. Konsistens er viktigere enn flest mulig
                komponenter.
              </AppText>
            </Stack>
          </Card>

          <Stack space="sm">
            <AppText variant="subtitle">Palette and hierarchy</AppText>
            <AppText tone="muted">
              Systemet er bevisst smalt: rolige hvite/svarte nøytraler, blå hierarki for handling og navigasjon, og gul
              kun som sparsom accent.
            </AppText>
            <Row align="stretch">
              <ColorSwatch label="Background" value={colors.background} backgroundColor={colors.background} />
              <ColorSwatch label="Surface" value={colors.surface} backgroundColor={colors.surface} />
            </Row>
            <Row align="stretch">
              <ColorSwatch label="Primary" value={colors.primary} backgroundColor={colors.primary} />
              <ColorSwatch label="Primary soft" value={colors.primarySoft} backgroundColor={colors.primarySoft} />
              <ColorSwatch label="Secondary soft" value={colors.secondarySoft} backgroundColor={colors.secondarySoft} />
            </Row>
          </Stack>

          <Stack space="sm">
            <AppText variant="subtitle">Layout primitives</AppText>
            <AppText tone="muted">
              Whitespace styres med <AppText tone="primary">Container</AppText>, <AppText tone="primary">Stack</AppText>{' '}
              og <AppText tone="primary">Row</AppText>. Trip-layouten bruker de samme tokenene for header og flytende
              navigasjon.
            </AppText>
            <Card>
              <Stack>
                <Row justify="space-between">
                  <AppText>Screen padding</AppText>
                  <AppText tone="muted">{layout.screenPadding}px</AppText>
                </Row>
                <Row justify="space-between">
                  <AppText>Card radius</AppText>
                  <AppText tone="muted">{radius.lg}px</AppText>
                </Row>
                <Row justify="space-between">
                  <AppText>Floating nav width</AppText>
                  <AppText tone="muted">{layout.floatingBarWidth}</AppText>
                </Row>
              </Stack>
            </Card>
          </Stack>

          <Stack space="sm">
            <AppText variant="subtitle">Trip chrome</AppText>
            <Card>
              <Stack space="sm">
                <AppText>
                  Dette er laget som alle trip-sider arver gjennom layouten: transparent topp med tilbakeknapp og profil,
                  floating bottom pill-nav og fade-lag over scroll-innhold.
                </AppText>
                <AppText tone="muted">
                  Hvis du bygger nye trip-sider videre, skal de bruke samme chrome automatisk via layouten, ikke lage egne
                  navbars eller egne top/bottom offsets.
                </AppText>
                <Row justify="space-between">
                  <AppText>Top content inset</AppText>
                  <AppText tone="muted">{headerContentOffset}px</AppText>
                </Row>
                <Row justify="space-between">
                  <AppText>Bottom content inset</AppText>
                  <AppText tone="muted">{bottomOverlayOffset}px</AppText>
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
                  Caption brukes til sekundær informasjon, hint og små labels.
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
                <Row>
                  <IconButton
                    accessibilityLabel="Go back"
                    icon={<Ionicons name="arrow-back" size={20} color={colors.text} />}
                  />
                  <IconButton
                    accessibilityLabel="Open profile"
                    active
                    icon={<Ionicons name="person-outline" size={20} color={colors.primary} />}
                  />
                </Row>
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
                    Flat surface for grouped content.
                  </AppText>
                </Stack>
              </Card>
              <Card variant="elevated">
                <Stack space="xs">
                  <AppText>Elevated card</AppText>
                  <AppText variant="caption" tone="muted">
                    Uses shared shadow tokens for depth instead of local effects.
                  </AppText>
                </Stack>
              </Card>
              <Card variant="interactive">
                <Stack space="xs">
                  <AppText>Interactive card</AppText>
                  <AppText variant="caption" tone="muted">
                    For tappable blocks where motion and pressed state should be consistent.
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
                  error="Use the built-in error state instead of styling ad hoc validation text on each screen."
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
                Lag en ny token når en ny <AppText tone="primary">rolle</AppText> mangler. Lag en ny komponent når samme
                UI-mønster faktisk brukes på flere skjermer.
              </AppText>
              <AppText>
                Hvis du bygger ny trip-side senere, start med disse primitives, og komponer videre med samme layout-lag og
                navigasjonsmønster som trip-shellen bruker nå.
              </AppText>
              <AppText tone="muted">
                Målet er et lite system som tåler vekst, ikke et stort bibliotek ingen tør å bruke.
              </AppText>
            </Stack>
          </Card>

          <Card variant="elevated">
            <Stack space="sm">
              <AppText variant="subtitle">What is ready now</AppText>
              <AppText>
                Basen er klar for å bygge <AppText tone="primary">home</AppText>, <AppText tone="primary">create event</AppText>,{' '}
                <AppText tone="primary">create trip</AppText>, <AppText tone="primary">trip landing page</AppText>,{' '}
                <AppText tone="primary">profile</AppText> og <AppText tone="primary">chat</AppText> videre med samme språk.
              </AppText>
              <AppText tone="muted">
                Det som skal gjenbrukes er tokens i <AppText tone="primary">constants/theme.ts</AppText>, primitives i{' '}
                <AppText tone="primary">components/ui</AppText> og shared chrome i <AppText tone="primary">components/layout</AppText>.
              </AppText>
            </Stack>
          </Card>
        </Stack>
      </Container>
    </ScrollView>
  );
}
