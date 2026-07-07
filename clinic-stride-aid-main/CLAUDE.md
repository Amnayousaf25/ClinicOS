# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

For repo-wide architecture and the backend ↔ frontend contract, see [../CLAUDE.md](../CLAUDE.md). This file covers frontend-specific details only.

## Frontend Development Standards (STRICT — read first)

These rules are mandatory. Violations are bugs.

### Tech stack — only these libraries

- **React** + **TypeScript**
- **Formik** for form state
- **Yup** for validation
- **dayjs** for dates (no native `Date` arithmetic in components)
- **@tanstack/react-query** for data fetching + caching
- **axios** for HTTP

Do not introduce alternative libraries (no `react-hook-form`, no `zod`, no `date-fns`, no `swr`, no `fetch` directly) without explicit approval. **`react-hook-form` and `zod` were intentionally removed from this project — do not re-add them.**

### Code structure

- **Files ≤ 200 lines.** If a file is growing past that, split by domain — see `components/intake/` for the canonical decomposition pattern.
- **Functions / components ≤ 150 lines.**
- **Shared types live in `@/types/`** (per-domain `*.types.ts` files + barrel `index.ts`). No inline shared interfaces. Component-local prop types stay colocated.
- **Reusable utilities live in `@/lib/utils.ts`** (or domain-specific `@/lib/*Util.ts`). No business-logic duplication inside components.

### Component reusability

Before creating a new component, search for an existing one. If something close exists, **extend or compose it** — don't fork. The canonical examples in this repo:

- **`Spinner` / `PageSpinner`** ([components/Spinner.tsx](src/components/Spinner.tsx)) — never inline `<Loader2 ... animate-spin />` directly. Always use `<Spinner size="sm|md|lg" />`.
- **`getInitials(name)`** in [lib/utils.ts](src/lib/utils.ts) — never inline `name.split(' ').map(...)`.
- **`DataTableHead`** ([components/DataTableHead.tsx](src/components/DataTableHead.tsx)) — never re-create appointment-table `<thead>` rows by hand.
- **shadcn/ui primitives** in `components/ui/` — these are the lowest-level building blocks. Compose, don't replace.
- **Decomposed dialogs** — `components/intake/` shows how to split a long dialog into focused sub-components (`PatientSearchPanel`, `VisitTypeFields`, `PatientFormFields`, `ConsentBox`, `primitives.tsx`). Follow this pattern when a dialog grows.

### DRY (strict)

- No repeated logic across components. Extract into a hook, util, or shared component.
- No copy-pasted JSX blocks beyond ~3 lines. Componentize.
- Backend response → frontend type mapping happens **once** in each `lib/*Api.ts` file (`mapApt`, `mapPatient`). Components consume the mapped type, never the raw backend shape.

### API handling

- All HTTP via the single axios instance in `src/lib/api.ts` (token interceptor + base URL live there).
- All server state via react-query hooks in `src/hooks/useApi.ts`. **Components never call axios or `fetch` directly.**
- Mutations invalidate the right query keys on success — `['appointments']`, `['patients']`, `['clinic-settings']`, etc.
- Backend `_id` → frontend `id` mapping happens in `lib/*Api.ts`. Never let raw `BackendApt` / `BackendPatient` shapes reach components.

### Forms

- **Formik for state, Yup for validation.** Validation schemas live in `src/lib/*Validation.ts`. No custom form state-machines.
- For repeated `Label + Field + ErrorMessage` triples, use the `TextField` primitive in `components/intake/primitives.tsx` (or extract a similar one in your domain folder).
- Empty `value=""` on shadcn `Select` crashes — use a sentinel like `__none__` and translate at the boundary.

### Dates

- **Always `dayjs(...)`.** Never `new Date()` arithmetic. Format with `dayjs().format(...)`.
- For "today as YYYY-MM-DD", use `dayjs().format('YYYY-MM-DD')`.

### Lint & types

- **Zero lint errors. Zero TypeScript errors.** Both `yarn lint` and `yarn tsc --noEmit` must pass before commit.
- No `any` (`unknown` is fine when you genuinely don't know the shape and immediately narrow).
- No unused imports / variables / dead code.
- No commented-out code blocks.

### Folder layout

```
src/
  components/   App-level components + intake/, ui/ (shadcn)
  pages/        Route components
  hooks/        TanStack Query wrappers + auth + UI hooks
  lib/          api.ts (axios) + per-domain *Api.ts + *Validation.ts + utils.ts
  types/        Per-domain *.types.ts + barrel index.ts
  test/         Vitest setup
```

### Absolute restrictions

- ❌ No new libraries outside the stack above
- ❌ No duplicate components (search before creating)
- ❌ No inline `<Loader2 />`, no inline `name.split(' ')`, no inline `<thead>` blocks for appointment-style tables
- ❌ No skipping Yup validation
- ❌ No `any`, no `// @ts-ignore`, no `eslint-disable` without a `Reason:` comment

### Workflow when adding a feature

1. Search `@/types`, `@/lib`, `@/components` for existing pieces.
2. Reuse / extend.
3. If you must create a new shared piece (component, util, type), put it in the right folder per the layout above.
4. Run `yarn tsc --noEmit && yarn lint && yarn test` before reporting done.

## Project overview

Vite + React 18 + TypeScript + Tailwind + shadcn/ui. The staff dashboard, public booking, and intake-form-by-link UIs for ClinicOS. Talks to the backend at `${VITE_API_URL}/api/v1` (default `http://localhost:4002`).

The package name `vite_react_shadcn_ts` and the README banner are leftovers from the Lovable scaffold — ignore them.

## Commands

- `yarn dev` — Vite dev server on `:8080` (HMR overlay disabled in `vite.config.ts`)
- `yarn build` / `yarn build:dev` (dev-mode prod build)
- `yarn preview` — preview the production bundle
- `yarn lint` — ESLint
- `yarn test` — Vitest (jsdom, run-once)
- `yarn test:watch` — Vitest watch
- `yarn e2e` — Playwright tests (`yarn e2e:ui`, `:headed`, `:debug`, `:report`)

Single test patterns: `yarn test src/path/to/file.test.tsx`, `yarn e2e e2e/path.spec.ts`.

## Source layout

```
src/
  components/       # App components (top-level) + components/intake/ (decomposed dialog) + components/ui/ (shadcn)
  pages/            # Route components (Dashboard, Appointments, Patients, IntakeForms, etc.)
  hooks/            # useApi (TanStack Query wrappers), useAuth, use-toast, use-mobile
  lib/              # api.ts (axios) + per-domain *Api.ts files + validation schemas
  types/            # Per-domain type files + barrel index.ts — all imports use @/types
  test/             # Vitest setup
e2e/                # Playwright tests + fixtures
```

Path alias: `@/` → `src/`.

## Data layer

- **HTTP**: single axios instance in `src/lib/api.ts`. Reads JWT from `localStorage.clinicos_token` (key matters; `useAuth` checks the same key). Base URL is `${VITE_API_URL}/api/v1`.
- **Server state**: `@tanstack/react-query`. Hooks in `src/hooks/useApi.ts` wrap functions from `src/lib/*Api.ts`. Query keys are domain-scoped (`['appointments']`, `['patients', 'search', q]`, `['clinic-settings']`, etc.) — invalidate them on mutation success.
- **Auth**: `useAuth` validates the token by hitting `/auth/me`; clears the token on 401/network error. `isLoggedIn` is server-verified, not just "token exists."
- **Backend → frontend type mapping** lives in each `lib/*Api.ts` file (`mapApt`, `mapPatient`, etc.). Backend returns `_id` → frontend uses `id`. **Always run responses through these mappers** — don't return raw `BackendApt` from API functions. New fields on the backend need to be added to both the `Backend*` interface and the mapper.

## Forms

Formik + Yup. Validation schemas in `src/lib/*Validation.ts` (e.g. `intakeValidation.ts`, `patientValidation.ts`). The `NewIntakeFormDialog` is decomposed into `src/components/intake/` (search panel, visit-type fields, patient form fields, consent box, primitives) — when adding sections to that dialog, follow the same pattern instead of growing the orchestrator.

## Types

All shared types in `src/types/` as per-domain files (`appointment.types.ts`, `patient.types.ts`, etc.) re-exported via `index.ts`. Always import from `@/types`, not from a specific file. Component-local types (`interface FooDialogProps`) and shadcn UI variant types stay colocated with the component — only **shared** domain types belong in `@/types`.

## UI conventions

- shadcn/ui components live in `src/components/ui/` — these follow shadcn convention (variants exported alongside component). Lint warnings about `react-refresh/only-export-components` in these files are expected and shouldn't be "fixed" by refactoring.
- App components (top-level `components/`) use Tailwind directly. Patterns to reuse:
  - **`DataTableHead`** ([components/DataTableHead.tsx](src/components/DataTableHead.tsx)) — standard `<thead>` wrapping for appointment-style tables. Use this instead of inlining repeated `<th className="text-left text-xs ...">` rows when the visual style matches.
  - **Empty/None values in `Select`**: shadcn's Select can't have an empty `value=""` SelectItem. Use a sentinel like `__none__` and translate at the boundary (`val === '__none__' ? '' : val`).
- Toasts: prefer `import { toast } from 'sonner'` for simple notifications, `useToast` from `@/hooks/use-toast` for the richer shadcn variant (used in dialogs).

## Workflow rules baked into UI

- **`StatusDropdown` and `QuickActions` lock when the appointment is finalized.** Both treat `arrived | cancelled | no-show` plus `intakeStatus === 'submitted'` as "no further actions." Backend's `VALID_TRANSITIONS` already forbids transitions out of terminal states; the frontend disables interaction so users don't try and get a 400.
- **Logout must `navigate('/login', { replace: true })`.** Just clearing the token + invalidating react-query isn't enough — `useAuth` reads `localStorage` non-reactively, so the protected routes won't re-evaluate until next refresh. See [`AppSidebar.tsx` logout](src/components/AppSidebar.tsx).
- **Intake submission for a future-dated appointment doesn't change the status.** Backend rule: auto-`arrived` only fires same-day. Frontend cache update in `intakeApi.writeAppointmentIntakeCache` should match — only flip to `arrived` if appropriate (currently flips unconditionally; if you change the backend rule further, also update the cache writer).

## Defensive helpers

- **`getInitials(name)`** in [`@/lib/utils`](src/lib/utils.ts) — returns "JS" from "John Smith", "?" (or a custom fallback) from null/undefined/empty. Never inline `.split(' ').map(n => n[0]).join('')` directly on a name string — patient names can come back as `''` or `undefined` from unmigrated/unpopulated rows and that crashes the page in production. Always use `getInitials`.
- **`mapApt` coerces all string-virtual fields to `''`** before they reach components. If you add a new virtual-derived field to the `Appointment` type, mirror this in `mapApt` — never let `undefined` reach a renderer that does `.split` / `.toLowerCase()` / etc.

## Common gotchas

- **Status virtuals**: appointments come from the backend with `patientName`, `patientPhone`, etc. as **populated virtuals** server-side. They're not editable — the source of truth is the linked Patient. Don't try to PATCH `patientName` on an appointment; update the Patient instead.
- **Empty `value` on Radix Select** crashes. Always provide a non-empty fallback (see sentinel pattern above).
- **`from '@/lib/types'` and `from './types'`** are dead — types moved to `src/types/`. If you see broken imports during a refactor, sed them to `@/types`.
- **Stale Vite HMR after big refactors**: when the dev server shows ghost errors for renamed/deleted symbols, hard-refresh (Cmd-Shift-R) — module URLs include `?t=<timestamp>` and a stale chunk can render old code briefly.
