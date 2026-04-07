# README Update Implementation

## TL;DR

Update README.md with clearer explanations, concrete code examples, and git workflow guidance for teammates using AI agents.

**Deliverables**:
- Updated README.md with all 7 sections improved
- Clearer Zustand/Zod explanations with with/without comparisons
- Git workflow section explaining why to commit regularly with AI
- Updated navigation section reflecting Stack.Protected constants

**Estimated Effort**: Quick (10-15 minutes)
**Parallel Execution**: NO - sequential edits to one file

---

## Context

### Current State
- README has technical explanations that assume knowledge ("React Context + useReducer")
- Git workflow only mentioned briefly at end
- Navigation section outdated (mentions useAuthStore driving redirects)
- Missing concrete examples showing benefits of patterns

### Goal
- Make README understandable for teammates without React background
- Explain WHY we use each pattern, not just WHAT
- Encourage regular git commits when using AI
- Update navigation to reflect current Stack.Protected implementation

---

## Work Objectives

### Core Objective
Rewrite README.md sections to be clearer, more practical, and beginner-friendly.

### Concrete Deliverables
1. Add Git Workflow section after Setup
2. Update Project Structure section (add layout files, note about constants)
3. Rewrite Zustand section (with/without examples)
4. Rewrite Zod section (clear why + concrete examples)
5. Rewrite Navigation section (Stack.Protected + constants)
6. Update Services section (add "why" paragraph)
7. Update Code Review Checklist (add git reminder)

### Definition of Done
- [ ] All 7 sections updated per plan
- [ ] Code examples compile and match project structure
- [ ] Tone is simple and practical
- [ ] No technical jargon without explanation

---

## Execution Strategy

### Sequential Tasks

#### Task 1: Add Git Workflow Section
**What to do**:
Insert new section "## Git Workflow" after Setup section (before Project Structure).

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

**Must NOT do**:
- Change existing Setup section content
- Remove the note at end of file (keep as reminder)

**Acceptance Criteria**:
- [ ] Git Workflow section appears after Setup
- [ ] Section explains why commit with AI
- [ ] Shows concrete git commands
- [ ] Mentions can squash later

---

#### Task 2: Update Project Structure Section
**What to do**:
Update the project structure tree to include layout files and note about constants.

**Current tree shows**:
```
app/
  _layout.tsx
  (auth)/
    login/
    signup/
```

**Update to**:
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

**Add note after tree**:
```markdown
**Note:** `IS_AUTHENTICATED` and `HAS_SELECTED_TRIP` in layout files are temporary placeholders for early development. They let you access any screen before real auth/trip selection is built.
```

**Acceptance Criteria**:
- [ ] Layout files (_layout.tsx) shown in tree
- [ ] Constants mentioned in comments
- [ ] Note added explaining constants are temporary
- [ ] Structure matches actual project

---

#### Task 3: Rewrite Zustand Section
**What to do**:
Replace current Zustand explanation with concrete with/without comparison.

**Current** (to replace):
```
### Zustand

**Zustand** is our global state manager. Think of it as a simpler alternative to React Context + useReducer...
```

**New content**:
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

**Acceptance Criteria**:
- [ ] Shows "without" example with prop drilling
- [ ] Shows "with" example accessing store directly
- [ ] Includes reading state example
- [ ] Includes calling actions example
- [ ] Mentions store folder location

---

#### Task 4: Rewrite Zod Section
**What to do**:
Replace current Zod explanation with clearer why and concrete examples.

**Current** (to replace):
```
### Zod

**Zod** is a TypeScript-first validation library. Use it to define schemas...
```

**New content**:
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

**Acceptance Criteria**:
- [ ] Explains "TypeScript checks code, Zod checks data"
- [ ] Form validation example with error handling
- [ ] API validation example
- [ ] Shows how to get TypeScript type from schema

---

#### Task 5: Rewrite Navigation Section
**What to do**:
Update Navigation section to reflect Stack.Protected with constants.

**Current** (lines 220-237, to replace):
- Remove mention of "useAuthStore driving redirects"
- Replace with Stack.Protected constants explanation

**New content**:
```markdown
### Navigation (Expo Router)

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

**Acceptance Criteria**:
- [ ] Route groups table kept but clearer
- [ ] Shows both constants (IS_AUTHENTICATED, HAS_SELECTED_TRIP)
- [ ] Explains constants are temporary placeholders
- [ ] No mention of useAuthStore driving redirects
- [ ] File structure = routes rule kept

---

#### Task 6: Update Services Section
**What to do**:
Add "why" paragraph after services list.

**Current** (lines 155-167):
Shows folder structure and code example.

**Add after service list** (before code example):
```markdown
**Why:**
- All API calls in one place — easy to find and update
- Consistent error handling everywhere
- Components stay simple (no API logic)
- Easy to mock for testing
```

**Acceptance Criteria**:
- [ ] "Why" paragraph added with bullet points
- [ ] Existing code example kept

---

#### Task 7: Update Code Review Checklist
**What to do**:
Add git commit reminder to checklist.

**Current checklist** (lines 280-288):
```markdown
- [ ] Components are in the correct folder
- [ ] No Supabase calls outside of `services/`
- [ ] No auth redirect logic outside of `app/_layout.tsx`
- [ ] `npm audit` reports no high-severity vulnerabilities
- [ ] If the schema changed, `types/database.types.ts` has been regenerated
```

**Update last item**:
```markdown
- [ ] Components are in the correct folder
- [ ] No Supabase calls outside of `services/`
- [ ] No auth redirect logic outside of `app/_layout.tsx`
- [ ] `npm audit` reports no high-severity vulnerabilities
- [ ] If the schema changed, `types/database.types.ts` has been regenerated
- [ ] **Commits made regularly (before/after agent work)**
```

**Acceptance Criteria**:
- [ ] Git commit reminder added as last item
- [ ] All other checklist items preserved

---

## Final Verification Wave

After all tasks complete:

1. Read entire README.md to ensure flow is logical
2. Check all code examples are valid TypeScript/TSX
3. Verify all internal links work
4. Ensure tone is consistent throughout
5. Keep existing note at end ("MAKE COMMITS...") as extra reminder

## Success Criteria

### Verification Commands
```bash
# Check sections exist
grep -q "## Git Workflow" README.md
grep -q "IS_AUTHENTICATED" README.md
grep -q "HAS_SELECTED_TRIP" README.md
grep -q "Without Zustand" README.md
grep -q "With Zustand" README.md

# Check examples are valid
grep -q "useTripStore((state) => state.currentTrip)" README.md
grep -q "TripSchema.safeParse" README.md
```

### Final Checklist
- [ ] Git Workflow section added after Setup
- [ ] Project Structure shows layout files and constants
- [ ] Zustand has with/without examples
- [ ] Zod explains why with form/API examples
- [ ] Navigation updated to Stack.Protected constants
- [ ] Services has "why" paragraph
- [ ] Checklist includes git reminder
- [ ] Tone is simple and practical throughout