<!--
SYNC IMPACT REPORT
==================
Version change   : (unfilled template) → 1.0.0
Bump rationale   : MINOR — initial ratification; all sections populated from scratch.

Modified principles  : none (initial ratification)
Added sections       : Core Principles (I–VI), Additional Constraints, Governance
Removed sections     : all template placeholder tokens

Templates reviewed:
  ✅ .specify/templates/plan-template.md
       "Constitution Check" gate already reads "Gates determined based on constitution file"
       — no hard-coded principle names to update.
  ✅ .specify/templates/spec-template.md
       Generic; no constitution-specific references. No changes needed.
  ✅ .specify/templates/tasks-template.md
       Generic path conventions (src/, tests/, etc.) are template-level placeholders
       that /speckit.tasks fills in per-feature. No changes needed.
  ✅ .specify/templates/constitution-template.md
       Source template — not modified (operating on memory/constitution.md only).
  ⚠  .specify/templates/tasks-template.md — "Mobile" path option lists ios/android/api/
       which does not match this project's Expo structure (app/, components/, services/,
       store/). Follow-up: update the Mobile path option to reflect Expo Router layout
       if /speckit.tasks is used for Triploom features.

Follow-up TODOs  : none — all fields resolved.
-->

# Triploom Constitution

## Core Principles

### I. Layered Architecture (NON-NEGOTIABLE)

Data flow MUST always follow: **Component → Zustand Store → Service → Supabase**.
No layer may be skipped.

- Components MUST NOT call services or Supabase directly.
- Services MUST NOT hold state or import from `store/`.
- Stores MUST NOT contain business logic; that belongs in `services/`.

**Rationale**: Strict layer boundaries keep components simple, centralise all API calls
for consistent error handling, and make each layer independently testable.

### II. Test-First Development (NON-NEGOTIABLE)

Integration tests against the real hosted Supabase database MUST pass before any UI
is written.

- RLS policy violations MUST be fixed by adding a policy via `apply_migration`.
  It is not permitted to change the test or the service to work around an RLS failure.
- The Red-Green cycle is mandatory: write test → confirm it fails → implement →
  confirm it passes.

**Rationale**: In an agentic multi-developer workflow, tests against the real database
are the only reliable proof that services and RLS policies are correct before the UI
is built on top of them.

### III. Naming Conventions

All file and identifier names MUST follow these rules:

- **Service/store verbs**: `create` / `getAll` (list) / `get` (single) / `update` /
  `delete`.
- **Store action names** MUST mirror service function names exactly.
- **Table names**: singular — `trip`, `event`, `task`, `message`, `profile`.
- **Component files**: `kebab-case.tsx`. **Component exports**: `PascalCase`.
- **Service files**: `domain.service.ts`. **Store files**: `domain.store.ts`.
  **Hook files**: `use-domain.ts`.
- **Prop callbacks**: `onPress` / `onChange` / `onSubmit` — never `handle*` or
  `onClick`.
- **Branch format**: `###-short-description` (e.g. `042-chat-realtime`).

### IV. Error Handling Contract

- Services MUST always throw on error. Silent failures are not permitted.
- Stores MUST catch thrown errors, reset `isLoading` to `false`, and re-throw.
- The UI layer is the ONLY catch boundary.

**Rationale**: Consistent throw-and-rethrow ensures errors surface to the user rather
than silently corrupting state, and keeps each layer focused on its own responsibility.

### V. Security Boundary

- `SUPABASE_SERVICE_ROLE_KEY` is for integration tests only. It MUST NOT be bundled
  in the app or imported outside of `__integration__/`.
- The app MUST use the anon key (`EXPO_PUBLIC_SUPABASE_KEY`) exclusively.
- RLS is the authoritative access-control layer. Every table MUST have policies before
  queries against it are considered correct.

**Rationale**: The service-role key bypasses RLS entirely. Leaking it into the app
bundle would grant unrestricted database access to anyone who inspects the binary.

### VI. Commit Discipline

- All local changes MUST be committed before starting an agent session (savepoint).
- Changes MUST be committed after every successful agent session.
- This rule is mandatory for multi-agent team workflows.

**Rationale**: Agents can produce good incremental work followed by regressions.
Frequent savepoints ensure progress is never lost and regressions can be reverted.

## Additional Constraints

These rules are not principles but are equally binding. Violations MUST be resolved
before any PR is merged to `main`.

- **No `any` in production code**: `any` is banned in `app/`, `components/`,
  `services/`, `store/`, `lib/`, and `hooks/`. It is permitted only in Jest mocks.
- **No hardcoded dev-toggle constants in PRs to `main`**: `IS_AUTHENTICATED` and
  `HAS_SELECTED_TRIP` MUST be replaced with real store/session state before a feature
  is considered complete. No PR to `main` may introduce a new hardcoded toggle of this
  kind.
- **Zod v4 error access**: Use `result.error.issues[0].message` — not `.errors`.
  Zod v4 renamed the array; `.errors` no longer exists.

## Governance

This constitution supersedes all other practices in the repository. When a conflict
exists between this document and any other guide, this document takes precedence.

**Amendment procedure**:
1. Propose the change and record the rationale.
2. Increment the version according to the semver rules below.
3. Update `Last Amended` to the date of change.
4. Team review required before merging to `main`.

**Versioning policy**:
- MAJOR: removal or backward-incompatible redefinition of a principle.
- MINOR: new principle or section added, or materially expanded guidance.
- PATCH: clarifications, wording fixes, or non-semantic refinements.

**Compliance**: All PRs MUST be verified against this constitution before merge.
The "Constitution Check" gate in `plan-template.md` reflects the NON-NEGOTIABLE
principles (I and II).

**Runtime guidance**: See `README.md` and `AGENTS.md` for implementation patterns,
code examples, FK chain details, RLS policy patterns, and test helpers. This
constitution defines the rules; those files show how to follow them.

**Version**: 2.0.0 | **Ratified**: 2026-04-14 | **Last Amended**: 2026-04-14
