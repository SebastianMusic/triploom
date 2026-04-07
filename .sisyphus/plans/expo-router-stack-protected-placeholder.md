# Expo Router Stack.Protected Minimal Placeholder Implementation

## TL;DR

Implement minimal Stack.Protected routing pattern for initial development. Team members can toggle `IS_AUTHENTICATED` constant to switch between auth/no-auth states to access their assigned screens.

**Deliverables**:
- Updated `app/_layout.tsx` with Stack.Protected guards
- Deleted legacy redirect files (`app/index.tsx`, `app/(app)/index.tsx`)
- Fixed tab screen names in `(app)/(trip)/_layout.tsx`

**Estimated Effort**: Quick (5-10 minutes)
**Parallel Execution**: NO - sequential file operations

---

## Context

### Current State
- Using legacy useEffect/Redirect pattern (fragile)
- Has `app/index.tsx` and `app/(app)/index.tsx` redirect files
- Tab screen names use `/index` suffix (incorrect)

### Goal
- Use modern Stack.Protected pattern (SDK 53+)
- Minimal placeholder - just a boolean constant to toggle
- No actual auth implementation yet
- Team can navigate to assigned screens by toggling the constant

### Stack.Protected Benefits
- Handles initial routing automatically
- No race conditions or timing issues
- When guard is false, automatically redirects to first available screen
- When guard changes, automatically redirects

---

## Work Objectives

### Core Objective
Replace legacy redirect-based routing with Stack.Protected minimal placeholder pattern.

### Concrete Deliverables
1. `app/_layout.tsx` - Stack.Protected with IS_AUTHENTICATED constant
2. Delete `app/index.tsx` 
3. Delete `app/(app)/index.tsx`
4. Verify `app/(app)/(trip)/_layout.tsx` has correct tab screen names

### Definition of Done
- [x] Toggling IS_AUTHENTICATED switches between (auth) and (app) routes
- [x] No unmatched route errors
- [x] Team can navigate to all screens

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: None
- **Agent-Executed QA**: YES - manually verify navigation

---

## Execution Strategy

### Sequential Tasks (must run in order)

#### Task 1: Update root layout with Stack.Protected
**What to do**:
Replace `app/_layout.tsx` with Stack.Protected implementation using minimal placeholder constant.

**File to create/modify**:
`app/_layout.tsx`:
```tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const IS_AUTHENTICATED = false;

export default function RootLayout() {
  return (
    <>
      <Stack>
        <Stack.Protected guard={IS_AUTHENTICATED}>
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={!IS_AUTHENTICATED}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
```

**Must NOT do**:
- Add actual auth logic
- Add providers or context
- Add splash screen handling

**Recommended Agent Profile**:
- **Category**: `quick`
- **Skills**: []

**Parallelization**:
- **Can Run In Parallel**: NO
- **Blocks**: Task 2, Task 3
- **Blocked By**: None

**Acceptance Criteria**:
- [x] File contains Stack.Protected with IS_AUTHENTICATED constant
- [x] Both (app) and (auth) groups are protected with opposite guards
- [x] headerShown: false on both screens

---

#### Task 2: Delete app/index.tsx
**What to do**:
Delete the legacy redirect file at `app/index.tsx`. Not needed with Stack.Protected.

**Must NOT do**:
- Keep the file
- Move it elsewhere

**Recommended Agent Profile**:
- **Category**: `quick`
- **Skills**: []

**Parallelization**:
- **Can Run In Parallel**: NO
- **Blocks**: Task 3
- **Blocked By**: Task 1

**Acceptance Criteria**:
- [x] `app/index.tsx` does not exist

---

#### Task 3: Delete app/(app)/index.tsx
**What to do**:
Delete the legacy redirect file at `app/(app)/index.tsx`. Not needed with Stack.Protected.

**Must NOT do**:
- Keep the file
- Move it elsewhere

**Recommended Agent Profile**:
- **Category**: `quick`
- **Skills**: []

**Parallelization**:
- **Can Run In Parallel**: NO
- **Blocks**: Task 4
- **Blocked By**: Task 2

**Acceptance Criteria**:
- [x] `app/(app)/index.tsx` does not exist

---

#### Task 4: Verify tab screen names
**What to do**:
Check `app/(app)/(trip)/_layout.tsx` has correct tab screen names without `/index` suffix.

Expected state:
```tsx
<Tabs screenOptions={{ headerShown: false }}>
  <Tabs.Screen name="home" options={{ title: 'Home' }} />
  <Tabs.Screen name="events" options={{ title: 'Events' }} />
  <Tabs.Screen name="tasks" options={{ title: 'Tasks' }} />
  <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
  <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
</Tabs>
```

**Must NOT do**:
- Change if already correct
- Add /index suffix back

**Recommended Agent Profile**:
- **Category**: `quick`
- **Skills**: []

**Parallelization**:
- **Can Run In Parallel**: NO
- **Blocks**: None
- **Blocked By**: Task 3

**Acceptance Criteria**:
- [x] Tab screen names do NOT have /index suffix
- [x] Names are: home, events, tasks, chat, profile

---

## Final Verification Wave

After all tasks complete:

**Manual QA (Developer)**:
1. Set `IS_AUTHENTICATED = false` in app/_layout.tsx
2. Start app: `npm start`
3. Verify app shows login screen
4. Set `IS_AUTHENTICATED = true`
5. Hot reload / restart
6. Verify app shows (app) routes (no-trip screen or trip tabs)
7. Navigate to all tab screens: home, events, tasks, chat, profile
8. No "unmatched route" errors

---

## Success Criteria

### Verification Commands
```bash
# Check files exist/don't exist
cat app/_layout.tsx | grep -q "Stack.Protected"
! test -f app/index.tsx
! test -f app/(app)/index.tsx
cat app/(app)/(trip)/_layout.tsx | grep -q 'name="home"'
```

### Final Checklist
- [x] Stack.Protected implementation in root layout
- [x] IS_AUTHENTICATED constant easy to toggle
- [x] No app/index.tsx file
- [x] No app/(app)/index.tsx file
- [x] Tab screen names correct (no /index suffix)
- [x] Toggling constant switches between auth states
- [x] All screens accessible when authenticated

---

## How to Use for Development

Team members can:
1. Open `app/_layout.tsx`
2. Change `const IS_AUTHENTICATED = false` to `true`
3. Save and hot reload
4. App now shows authenticated routes
5. Navigate to their assigned screen to work on
6. When done, change back to `false` to test auth flow

When real auth is implemented, replace the constant with actual auth state from context/store.