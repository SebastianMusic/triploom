# Trip/No-Trip Conditional Routing with Stack.Protected

## TL;DR

Add Stack.Protected to `app/(app)/_layout.tsx` to conditionally show either the (trip) group or (no-trip) group based on a `HAS_SELECTED_TRIP` placeholder constant.

**Deliverables**:
- Updated `app/(app)/_layout.tsx` with Stack.Protected guards for trip/no-trip
- Team can toggle `HAS_SELECTED_TRIP` to switch between trip tabs and no-trip screen

**Estimated Effort**: Quick (2-3 minutes)

---

## Context

### Current State
- `app/(app)/_layout.tsx` is just a simple Stack with no conditional logic
- No way to switch between (trip) and (no-trip) route groups
- Team needs to access both groups during development

### Goal
- Add Stack.Protected pattern to (app) layout
- Minimal placeholder - just a boolean constant to toggle
- When `HAS_SELECTED_TRIP = true` → show (trip) tabs
- When `HAS_SELECTED_TRIP = false` → show (no-trip) screen

---

## Work Objectives

### Core Objective
Add Stack.Protected conditional routing to app/(app)/_layout.tsx for trip/no-trip groups.

### Concrete Deliverables
1. `app/(app)/_layout.tsx` - Stack.Protected with HAS_SELECTED_TRIP constant

### Definition of Done
- [x] Toggling HAS_SELECTED_TRIP switches between (trip) and (no-trip) routes
- [x] When true: shows trip tabs (home, events, tasks, chat, profile)
- [x] When false: shows no-trip screen

---

## Execution Strategy

### Task: Update app/(app)/_layout.tsx with Stack.Protected

**What to do**:
Replace `app/(app)/_layout.tsx` with Stack.Protected implementation using HAS_SELECTED_TRIP placeholder constant.

**File to create/modify**:
`app/(app)/_layout.tsx`:
```tsx
import { Stack } from 'expo-router';

const HAS_SELECTED_TRIP = false;

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={HAS_SELECTED_TRIP}>
        <Stack.Screen name="(trip)" />
      </Stack.Protected>
      <Stack.Protected guard={!HAS_SELECTED_TRIP}>
        <Stack.Screen name="(no-trip)" />
      </Stack.Protected>
    </Stack>
  );
}
```

**Must NOT do**:
- Add actual trip selection logic
- Connect to trip store
- Add providers or context

**Recommended Agent Profile**:
- **Category**: `quick`
- **Skills**: []

**Acceptance Criteria**:
- [x] File contains Stack.Protected with HAS_SELECTED_TRIP constant
- [x] Both (trip) and (no-trip) groups are protected with opposite guards
- [x] headerShown: false on Stack

---

## How to Use for Development

Team members can:
1. Open `app/(app)/_layout.tsx`
2. Change `const HAS_SELECTED_TRIP = false` to `true`
3. Save and hot reload
4. App now shows trip tabs instead of no-trip screen
5. Navigate to their assigned tab to work on

**Full routing decision tree:**
```
Root layout (IS_AUTHENTICATED):
  false → (auth)/login
  true → (app)
    
    App layout (HAS_SELECTED_TRIP):
      false → (no-trip)/index
      true → (trip) with tabs
```

**Two constants to toggle:**
- `app/_layout.tsx` - `IS_AUTHENTICATED` (auth vs app)
- `app/(app)/_layout.tsx` - `HAS_SELECTED_TRIP` (no-trip vs trip)