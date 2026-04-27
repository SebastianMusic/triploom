# UI System Notes

Denne mappen er single source of truth for design tokens og theme i appen.
All ny UI skal starte herfra, ikke med lokale hex-verdier eller tilfeldige margins.

## Core file

- `theme.ts`
  - eksporterer alle design tokens: `spacing`, `radius`, `stroke`, `opacity`, `motion`, `sizes`, `layout`, `typography`
  - eksporterer også light/dark theme via `getTheme(mode)`

## Working rules

1. Bruk alltid `theme.colors`, `theme.spacing`, `theme.radius`, `theme.typography` før du lager nye verdier.
2. Ikke hardkod farger i komponenter eller skjermer.
3. Hvis et nytt visuelt mønster brukes flere steder, legg inn en ny semantisk token i `theme.ts`.
4. Hvis behovet bare gjelder layout på én skjerm, komponer med eksisterende primitives i `components/ui`.
5. Hvis samme chrome eller navigasjon brukes på flere screens, legg det i `components/layout`.
6. Skjermer skal ikke eie egen horisontal spacing. Bruk `Container` for sidepadding og `Stack`/`Row` for rytme mellom søsken.
7. Standard edge padding skal matche standard `Card`-padding. Ikke legg inn ekstra `paddingHorizontal` på skjermen rundt cards i tillegg.
8. Hvis du ser `contentContainerStyle` med både egen `paddingHorizontal` og lokal `gap`, er det som regel et tegn på at skjermen burde komponeres med `Container` og `Stack` i stedet.
9. Standard `Card` skal ha nok innvendig luft til at tekst, metadata og actions ikke ligger klistret mot kantene. Ikke komprimer card-padding lokalt uten en tydelig list/separator-grunn.
10. Hvis en skjerm føles trang, løs det først i primitives som `Card`, `Container`, `Stack` eller typografi-rytme, ikke med tilfeldige ekstra margins på enkeltskjermer.

## Color model

Systemet er bevisst smalt:

- Primary / dominant: `background`, `surface`, `surfaceMuted`, store bilde- og innholdsflater
- Secondary / supporting: `secondary`, `secondarySoft`, borders, muted text, metadata og struktur
- Accent / action: `primary`, `primarySoft`, `accent`, aktive states og viktige handlinger
- Semantic feedback: `success`, `warning`, `error`

Målet er rolig, premium UI med streng 60-30-10-tankegang:

- 60% primary/dominant: store rolige bakgrunner, bilder, cards og hovedflater
- 30% secondary/supporting: struktur, seksjonsskiller, muted surfaces, metadata og sekundære kontroller
- 10% accent/action: CTA-er, active states, badges, highlights og destruktive/semantiske signaler

Ikke la aksentfarger dominere en skjerm. Hvis en skjerm føles "fargerik", er det som regel fordi 10%-laget brukes som dekor i stedet for handling/status. Bruk `primary`, `accent`, `success`, `warning` og `error` med klar hensikt.

## Visual composition

Triploom skal føles visuelt rikt uten å bli rotete. Bruk store flater og tydelig hierarki før du legger til flere små elementer.

- Bruk store bildeflater når skjermen handler om en trip, destination, event eller et annet visuelt objekt.
- La bilder og hovedkort være primære blikkfang; ikke pakk alle seksjoner inn i mange like små cards.
- Bruk whitespace, store touch targets og få tydelige grupper fremfor mange tette knapper.
- Hold sekundær informasjon som datoer, rolle, deltakerantall og metadata visuelt lavere enn navn/tittel og primær handling.
- Destruktive handlinger som delete og leave skal ikke være primære synlige handlinger på oversiktsskjermer. Legg dem bak en options-meny og bekreftelse.
- FAB kan brukes for globale "create/add"-handlinger på en skjerm, men skal ikke konkurrere med hovedinnholdet. Den er del av 10%-laget.
- Swipe/carousel kan brukes for visuelt utvalgte eller aktive elementer, men må støttes av tydelig tekst, snap-punkter eller en enkel liste for mindre intuitive flows.

## Layout contract

Trip-opplevelsen bygger på egne layout-komponenter i `components/layout`:

- `TripHeader`
- `TripTabBar`
- `TripFadeOverlays`
- `useTripChromeInsets`

Hvis du bygger nye trip-sider som `home`, `create event`, `create trip`, `chat`, `profile` eller `trip landing page`, skal de bruke samme layout-kontrakt i stedet for å lage egne navbars eller offsets.

## Extending safely

Legg til en ny token når:

- samme type spacing, radius eller color-role trengs flere steder
- en state eller surface mangler i theme

Lag en ny komponent når:

- samme UI-mønster går igjen på flere skjermer
- primitive komponenter ikke lenger dekker 80-90% av behovet uten gjentakelse

Ikke legg til nye tokens eller komponenter bare fordi én skjerm har et spesielt tilfelle.

## For future agents

- Les `constants/theme.ts` før du designer nye skjermer.
- Les `components/ui/example-usage.tsx` før du lager nye reusable components.
- Hold nye endringer kompatible med både light og dark mode.
- Bevar layout-hierarkiet: content nederst, fade overlays over content, navigation over fade.
