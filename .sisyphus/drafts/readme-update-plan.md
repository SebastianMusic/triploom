# README Update Plan

## Overview
Update README.md to better reflect current project state, improve explanations for teammates, and encourage good git practices.

## Proposed Changes

### 1. ADD: Git Workflow Section (Early in README)
**Current**: Brief mention at end (line 292)
**Proposed**: Dedicated section after Setup

```markdown
## Git Workflow

**Commit often. You can always squash later.**

AI agents (and humans) make mistakes. Don't lose progress:
- Make a commit after every feature/bugfix
- Write descriptive messages: `feat: add trip creation form` not `update`
- Push regularly to share progress with team
- Use branches for major features

```bash
# Good commit workflow
git add .
git commit -m "feat: add event creation form with validation"
git push
```

Before running your agent on new work, always commit current state so you can rollback if needed.
```

### 2. UPDATE: Project Structure Section
**Current**: Shows folder structure but doesn't reflect Stack.Protected routing
**Proposed**: Update to show actual routing hierarchy with layout files

```markdown
## Project structure

```
app/                              # Expo Router — file-based routing
  _layout.tsx                     # Root layout: IS_AUTHENTICATED controls auth/app
  (auth)/                         # Screens for non-logged-in users
    _layout.tsx                   # Auth group layout
    login/
      index.tsx
    signup/
      index.tsx
    forgot-password/
      index.tsx
  (app)/                          # Screens for logged-in users  
    _layout.tsx                   # App layout: HAS_SELECTED_TRIP controls trip/no-trip
    (no-trip)/                    # No active trip selected
      _layout.tsx
      index.tsx                   # Trip picker screen
    (trip)/                       # Trip tabs (when trip is active)
      _layout.tsx                 # Tab layout with 5 tabs
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

components/                       # UI components
  auth/                           # Login, signup forms
  trip/                           # Trip cards, headers
  chat/                           # Chat bubbles, inputs
  events/                         # Event cards, forms
  tasks/                          # Task items, lists
  layout/                         # Headers, tab bars
  ui/                             # Generic components

services/                         # Supabase calls only
store/                            # Zustand global state
lib/                              # Utilities, supabase client
types/                            # TypeScript types
hooks/                            # Custom React hooks
```

### 3. UPDATE: Zustand Explanation
**Current**: "Think of it as a simpler alternative to React Context + useReducer"
**Problem**: Team hasn't heard of reducer
**Proposed**: Clear explanation without comparisons

```markdown
### Zustand

**Zustand** is our global state manager. It lets any screen access shared data without passing props through every component.

**Why we use it:**
- Trip data needed on multiple screens (home, events, chat)
- Chat messages needed in chat screen AND trip header
- User session needed everywhere

**How it works:**
Each domain has a store file in `store/`. Stores hold data and provide actions to update it.

```ts
// Reading state in any component
const trip = useTripStore((state) => state.currentTrip);
const messages = useChatStore((state) => state.messages);

// Calling an action
const { fetchTrips } = useTripStore();
await fetchTrips(); // This calls the service and updates state
```

**Key rule:** Components never call services directly. They call store actions, which call services.
```

### 4. UPDATE: Zod Explanation
**Current**: Basic description
**Proposed**: Clearer why we use it with examples

```markdown
### Zod

**Zod** validates data at runtime. TypeScript checks code at compile-time, but Zod checks actual data when the app runs.

**Why we use it:**
- User types in form → might enter invalid data
- API returns data → might be missing fields
- Can't trust external input

**Example:**
```ts
const TripSchema = z.object({
  name: z.string().min(1, "Trip name is required"),
  destination: z.string(),
  start_date: z.string().datetime(),
});

// Validate form input
const result = TripSchema.safeParse(formData);
if (!result.success) {
  // Show error to user
  console.log(result.error.errors);
}

// TypeScript type from schema
type Trip = z.infer<typeof TripSchema>;
```
```

### 5. UPDATE: Navigation Conventions Section
**Current**: Mentions auth redirect logic in app/_layout.tsx driven by useAuthStore
**Problem**: We changed to Stack.Protected with constants
**Proposed**: Update to reflect actual implementation

```markdown
### Navigation (Expo Router)

We use **expo-router** file-based routing. The folder structure IS the navigation.

**Route Groups (folders in parentheses):**
- `(auth)/` — Login, signup, forgot-password
- `(app)/` — All screens after login
- `(app)/(no-trip)/` — Trip picker (no active trip)
- `(app)/(trip)/` — Tab bar (has active trip)

**Development Mode — Toggle Constants:**

While building features, toggle these constants to access different screens:

```tsx
// app/_layout.tsx — controls auth vs app
const IS_AUTHENTICATED = true;  // true = show (app), false = show (auth)

// app/(app)/_layout.tsx — controls trip vs no-trip  
const HAS_SELECTED_TRIP = true; // true = show tabs, false = show trip picker
```

Change the value → Save → App reloads to new route automatically.

**Production Mode:**
Replace these constants with real auth/trip state from stores when implementing actual auth.

**Navigation Rules:**
- Navigate using `router.push('/(app)/(trip)/events')` or `<Link href="...">`
- Never use `createStackNavigator` manually
- Every screen is `folder/index.tsx` (not `folder.tsx`)
```

### 6. UPDATE: Services Section
**Current**: Good, but add note about why
**Proposed**: Add brief explanation

```markdown
### `services/`

Services are the **only** place that talks to Supabase. This keeps all API calls in one place.

**Why:**
- Easier to find and update API calls
- Consistent error handling
- Can mock for testing
- Components stay simple

```

### 7. UPDATE: Data Flow Section
**Current**: Good diagram
**Proposed**: Keep as-is, it's clear

### 8. UPDATE: Code Review Checklist
**Current**: Good list
**Proposed**: Add git commit reminder

```markdown
## Code review checklist

Before merging, verify:

- [ ] Components are in the correct folder
- [ ] No Supabase calls outside of `services/`
- [ ] No auth redirect logic outside of layouts (use constants in `_layout.tsx`)
- [ ] `npm audit` reports no high-severity vulnerabilities
- [ ] If the schema changed, `types/database.types.ts` has been regenerated
- [ ] **You made commits with descriptive messages**
```

## Questions for You

1. **Git workflow**: Should this be a separate "Workflow" section or part of Setup?

2. **Navigation**: Do you want to keep the route groups table (lines 232-237) or replace entirely with the new explanation?

3. **Zustand**: Should I add a more complex example showing how actions call services?

4. **Development constants**: Should I add a screenshot or keep it text-only?

5. **Any other sections** you want updated or added?

## Implementation Notes

- Keep existing tone (direct, practical)
- Maintain code examples that actually work
- Ensure all file paths match actual project
- Keep it scannable (bullet points, short paragraphs)
