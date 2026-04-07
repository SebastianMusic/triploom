# README Update Plan - Final

## Proposed Changes to README.md

### 1. ADD: Git Workflow Section (After Setup)

**Placement**: After Setup section, before Project Structure

**Content**:
```markdown
## Git Workflow

**Commit regularly when using AI agents.**

AI can do something good, then suddenly break everything. Commit often so you don't lose progress:

```bash
# Good: Commit before running agent
git add .
git commit -m "before: adding event creation form"
# Run your agent...
# If it breaks something: git checkout . or git reset --hard HEAD

# Also good: Commit after agent finishes successfully
git add .
git commit -m "feat: add event creation form with validation"
```

**Rules:**
- Commit BEFORE running an agent on new work (savepoint)
- Commit AFTER agent finishes successfully (keep the good)
- Push to GitHub regularly so teammates see progress
- Write clear messages: `feat: add trip creation` not `update`

You can clean up/squash commits later. Don't lose work now.
```

---

### 2. UPDATE: Project Structure

**Changes**:
- Keep current structure but add layout files
- Add comment about constants being temporary

```markdown
## Project structure

```
app/                              # Expo Router — file-based routing
  _layout.tsx                     # Root layout with IS_AUTHENTICATED constant
  (auth)/                         # Login, signup, forgot-password
    _layout.tsx                   # Auth stack layout
    login/
      index.tsx
    signup/
      index.tsx
    forgot-password/
      index.tsx
  (app)/                          # Screens for logged-in users
    _layout.tsx                   # App layout with HAS_SELECTED_TRIP constant
    (no-trip)/                    # Shown when no trip selected
      _layout.tsx
      index.tsx                   # Trip picker screen
    (trip)/                       # Tab bar when trip is active
      _layout.tsx                 # Tabs layout with 5 screens
      home/
        index.tsx
      events/
        index.tsx
      tasks/
        index.tsx
      chat/
        index.tsx
      profile/
        index.tsx
```

**Note:** `IS_AUTHENTICATED` and `HAS_SELECTED_TRIP` in layout files are temporary placeholders for early development. They let you access any screen before real auth/trip selection is built.
```

---

### 3. REWRITE: Zustand Section

**Current**: Compares to React Context + useReducer
**New**: Show concrete with/without examples

```markdown
### Zustand

**Zustand** shares data between screens without passing props through every component.

**Without Zustand (the problem):**
```tsx
// Trip data needed on HomeScreen
function HomeScreen({ trip }) {
  return <Text>{trip.name}</Text>;
}

// Also needed on EventsScreen
function EventsScreen({ trip }) {
  return <Text>{trip.name} Events</Text>;
}

// Must pass through TripStack even though it doesn't use it
function TripStack({ trip }) {
  return (
    <Stack>
      <HomeScreen trip={trip} />     // pass down
      <EventsScreen trip={trip} />   // pass down
    </Stack>
  );
}
```

**With Zustand (the solution):**
```tsx
// Any screen can access trip directly
function HomeScreen() {
  const trip = useTripStore((state) => state.currentTrip);
  return <Text>{trip.name}</Text>;
}

function EventsScreen() {
  const trip = useTripStore((state) => state.currentTrip);
  return <Text>{trip.name} Events</Text>;
}

// No need to pass props through TripStack
function TripStack() {
  return (
    <Stack>
      <HomeScreen />     // no props needed
      <EventsScreen />   // no props needed
    </Stack>
  );
}
```

**Reading state:**
```ts
const trip = useTripStore((state) => state.currentTrip);
const messages = useChatStore((state) => state.messages);
```

**Calling actions:**
```ts
const { fetchTrips } = useTripStore();
await fetchTrips(); // Calls service and updates state
```

**Stores live in `store/` folder** — one file per domain (auth, trips, chat, etc.)
```

---

### 4. REWRITE: Zod Section

**Current**: Brief description
**New**: Clear why and concrete examples

```markdown
### Zod

**Zod** checks data at runtime. TypeScript checks your code, Zod checks actual data.

**Why:**
- User types in form → might type garbage
- API returns data → might be missing fields
- You can't trust external input

**Example — Form validation:**
```ts
const TripSchema = z.object({
  name: z.string().min(1, "Trip name is required"),
  destination: z.string(),
  start_date: z.string().datetime(),
});

// Validate what user typed
const result = TripSchema.safeParse(formData);
if (!result.success) {
  // Show specific error
  alert(result.error.errors[0].message);
  return;
}

// Now safe to use
createTrip(result.data);
```

**Example — API response validation:**
```ts
// API might return wrong shape
const response = await fetch('/api/trips');
const data = await response.json();

// Validate before using
const trips = TripArraySchema.parse(data);
// If data is wrong, Zod throws immediately
```

**Get TypeScript type from schema:**
```ts
type Trip = z.infer<typeof TripSchema>;
// Same as: { name: string, destination: string, start_date: string }
```
```

---

### 5. REWRITE: Navigation Conventions Section

**Current**: Mentions useAuthStore driving redirects (outdated)
**New**: Explain Stack.Protected with constants

```markdown
## Navigation (Expo Router)

Expo Router uses **file-based routing**. The folder structure IS the navigation.

### Route Groups

Folders in `(parentheses)` are route groups. They don't appear in the URL but control layout:

| Group | When shown |
|-------|------------|
| `(auth)/` | Login, signup, forgot-password screens |
| `(app)/` | All screens after logging in |
| `(app)/(no-trip)/` | Trip picker (no active trip) |
| `(app)/(trip)/` | Tab bar (has active trip selected) |

### Development Mode — Toggle Constants

While building features, change these constants to access different screens:

```tsx
// app/_layout.tsx — controls auth vs app
const IS_AUTHENTICATED = true;  // true = show (app), false = show login

// app/(app)/_layout.tsx — controls trip vs no-trip  
const HAS_SELECTED_TRIP = true; // true = show tabs, false = show trip picker
```

Change the value → Save file → App automatically reloads to the new route.

**These are temporary placeholders** for early development sessions. When real auth and trip selection are built, these will be replaced with actual state from stores.

### Navigation Rules

- **File structure = Routes**: `app/(app)/(trip)/events/index.tsx` → route `/(app)/(trip)/events`
- **Every screen**: Lives in its own folder as `index.tsx`
- **_layout.tsx**: Wraps all screens in that folder (adds stack, tabs, etc.)
- **Navigate with**: `router.push('/(app)/(trip)/events')` or `<Link href="...">`
- **Never**: Use `createStackNavigator` manually
```

---

### 6. UPDATE: Services Section

**Add brief explanation of why:**

```markdown
### `services/`

Services are the **only** place that talks to Supabase.

**Why:**
- All API calls in one place — easy to find and update
- Consistent error handling everywhere
- Components stay simple (no API logic)
- Easy to mock for testing

```

---

### 7. UPDATE: Code Review Checklist

**Add git reminder:**

```markdown
## Code review checklist

Before merging, verify:

- [ ] Components are in the correct folder
- [ ] No Supabase calls outside of `services/`
- [ ] No auth logic outside of layout files
- [ ] `npm audit` reports no high-severity vulnerabilities
- [ ] If schema changed, `types/database.types.ts` is regenerated
- [ ] **Commits made regularly (before/after agent work)**
```

---

## Summary of Changes

| Section | Change |
|---------|--------|
| **NEW: Git Workflow** | Add after Setup — explain why commit regularly with AI |
| **Project Structure** | Show layout files, note constants are temporary |
| **Zustand** | Rewrite with concrete with/without examples |
| **Zod** | Clearer why + form and API examples |
| **Navigation** | Update to Stack.Protected + constants explanation |
| **Services** | Add "why" paragraph |
| **Checklist** | Add git commit reminder |

## Tone Guidelines
- Use simple words everyone understands
- Show code examples for everything
- Explain WHY, not just WHAT
- Keep it practical and scannable
