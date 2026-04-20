# Design System

Dette er dokumentasjon for UI-systemet i Triploom. Bygg med theme-tokens, bruk primitive komponenter først, og legg delt app-chrome i layout-laget i stedet for å style hver side på nytt.

---

## Hvordan theme fungerer

1. Start alltid med `theme.colors`, `theme.spacing`, `theme.radius` og `theme.typography`.
2. Hvis samme visuelle rolle dukker opp flere steder, legg til en ny token. Ikke legg inn en ny tilfeldig hex-verdi i én skjerm.
3. Bruk `components/ui` for primitives og `components/layout` for delt navigasjon og skjerm-chrome som trip-header og bottom pill-nav.

> Tommelfingerregel: utvid først når samme mønster dukker opp igjen. Konsistens er viktigere enn flest mulig komponenter.

Tilgang til theme i en komponent:
```tsx
import { useAppTheme } from '@/components/ui/theme-provider';

const { theme: { colors, spacing, radius, typography } } = useAppTheme();
```

---

## Fargepalett

Systemet er bevisst smalt: rolige hvite/svarte nøytraler, blå hierarki for handling og navigasjon, og gul kun som sparsom accent.

| Token | Lys | Beskrivelse |
|---|---|---|
| `background` | `#F6F8FC` | Sidebakgrunn |
| `surface` | `#FFFFFF` | Kort, input-bakgrunn |
| `surfaceMuted` | `#EEF3F9` | ListItem-bakgrunn, dempede flater |
| `text` | `#14202B` | Primær tekst |
| `textMuted` | `#647487` | Sekundær tekst, hint |
| `textOnPrimary` | `#FFFFFF` | Tekst på primærknapper |
| `primary` | `#4D78D7` | Primær handling, aktiv navigasjon |
| `primarySoft` | `#E8F0FF` | Bakgrunn for aktive/valgte elementer |
| `secondary` | `#7A91B8` | Sekundær handling |
| `secondarySoft` | `#E4EAF4` | Dempet sekundær bakgrunn |
| `accent` | `#E4C86E` | Sparsom gul accent |
| `border` | `#E1E9F2` | Kantlinjer |
| `focusRing` | `#6D93E4` | Fokus-ring på inputs |
| `success` | `#2F8B5E` | Suksess-tilstand |
| `warning` | `#B98634` | Advarsel |
| `error` | `#C85A54` | Feil-tilstand |

---

## Spacing

```
xs:   8px
sm:  16px
md:  24px
lg:  32px
xl:  40px
xxl: 48px
xxxl: 64px
```

---

## Border radius

```
sm:   14px
md:   20px
lg:   28px
xl:   36px
full: 999px
```

---

## Typografi

| Variant | Størrelse | Vekt | Bruk |
|---|---|---|---|
| `title` | 36px | 700 | Sidetitler |
| `subtitle` | 24px | 600 | Seksjonstitler |
| `body` | 16px | 400 | Vanlig innhold (default) |
| `caption` | 13px | 500 | Labels, hint, sekundær info |
| `label` | 15px | 600 | Knapptekst |

```tsx
<AppText variant="subtitle" tone="muted">Seksjonstittel</AppText>
```

Tilgjengelige `tone`-verdier: `default` · `muted` · `primary` · `secondary` · `accent` · `error` · `success` · `warning`

---

## Layout-primitiver

### Container
Legger til konsistent horisontal padding (`screenPadding: 24px`) på skjerminnhold.
```tsx
<Container>
  {/* innhold */}
</Container>
```

### Stack
Vertikal layout med gap mellom barn.
```tsx
<Stack space="md">
  <AppText>Første</AppText>
  <AppText>Andre</AppText>
</Stack>
```

### Row
Horisontal layout med gap og alignment.
```tsx
<Row gap="sm" justify="space-between" align="center">
  <AppText>Venstre</AppText>
  <Badge label="Info" />
</Row>
```

---

## Trip chrome

Alle trip-sider arver gjennom layouten:
- Transparent topp med tilbakeknapp og profil (`TripHeader`)
- Floating bottom pill-nav (`TripTabBar`)
- Fade-lag over scroll-innhold (`TripFadeOverlays`)

Nye trip-sider skal bruke `useTripChromeInsets()` for riktig padding:

```tsx
import { useTripChromeInsets } from '@/components/layout';

const { headerContentOffset, bottomOverlayOffset } = useTripChromeInsets();

<ScrollView
  contentContainerStyle={{
    paddingTop: headerContentOffset,
    paddingBottom: Math.max(spacing.xxxl, bottomOverlayOffset),
  }}>
  <Container>
    {/* innhold */}
  </Container>
</ScrollView>
```

---

## Komponenter

### AppText
```tsx
<AppText variant="subtitle" tone="primary">Tittel</AppText>
```

### Button
```tsx
<Button label="Lagre" />
<Button label="Avbryt" variant="ghost" />
<Button label="Sekundær" variant="secondary" size="sm" />
<Button label="Laster..." loading />
<Button label="Full bredde" fullWidth />
```
Varianter: `primary` · `secondary` · `ghost`  
Størrelser: `sm` · `md` · `lg`

### IconButton
```tsx
<IconButton
  icon={<Ionicons name="arrow-back" size={20} color={colors.text} />}
  accessibilityLabel="Tilbake"
/>
<IconButton
  icon={<Ionicons name="person-outline" size={20} color={colors.primary} />}
  active
/>
```
Varianter: `surface` (default) · `ghost`

### Card
```tsx
<Card>...</Card>
<Card variant="elevated">...</Card>
<Card variant="interactive" onPress={handlePress}>...</Card>
```
- `default` — flat hvit flate
- `elevated` — med skygge
- `interactive` — tappbar med press-animasjon

### Input
```tsx
<Input label="Tittel" placeholder="Skriv her..." />
<Input label="Beskrivelse" multiline hint="Valgfri" />
<Input label="Navn" error="Påkrevd felt" />
```

### Badge
```tsx
<Badge label="Info" />
<Badge label="Klar" variant="success" />
<Badge label="Advarsel" variant="warning" />
```

### Avatar
```tsx
<Avatar name="Ola Nordmann" size="md" />
<Avatar name="Ola" source={{ uri: 'https://...' }} size="lg" />
```
Størrelser: `sm` (36px) · `md` (48px) · `lg` (64px)

### ListItem
```tsx
<ListItem
  title="Neste event"
  subtitle="Lørdag kl. 18:00"
  leading={<Avatar name="Kveldsturen" />}
  trailing={<Badge label="Info" />}
  onPress={handlePress}
/>
```

---

## Når skal du utvide systemet?

- **Ny token**: Når en ny *rolle* mangler — ikke for å gjøre én skjerm unik.
- **Ny komponent**: Når samme UI-mønster faktisk brukes på to eller flere skjermer.

Målet er et lite system som tåler vekst, ikke et stort bibliotek ingen tør å bruke.
