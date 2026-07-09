# ClinicOS Frontend

React staff dashboard, public booking flow, and patient intake UIs for ClinicOS. Pairs with the [`clinic-os-be`](../clinic-os-be) NestJS backend.

> Note: `package.json` says `vite_react_shadcn_ts` — that's a leftover from the Lovable scaffold. The project name is ClinicOS.

## Tech stack

- **Build**: Vite (port `8080`, HMR overlay disabled)
- **Framework**: React 18 + TypeScript
- **Routing**: react-router-dom v6
- **UI**: shadcn/ui (Radix primitives) + Tailwind CSS + lucide-react icons
- **Server state**: @tanstack/react-query
- **Forms**: Formik + Yup
- **HTTP**: axios
- **Toasts**: sonner + shadcn `useToast`
- **Tests**: Vitest (jsdom) + Playwright (e2e)

## Getting started

```bash
yarn install

# Frontend reads VITE_API_URL — defaults to http://localhost:4002 if unset.
echo "VITE_API_URL=http://localhost:4002" > .env

yarn dev    # http://localhost:8080
```

The backend must be running. See [`../clinic-os-be/README.md`](../clinic-os-be/README.md).

## Commands

| Command | What it does |
|---|---|
| `yarn dev` | Vite dev server (port 8080) |
| `yarn build` | Production bundle |
| `yarn build:dev` | Production build with development mode flags |
| `yarn preview` | Preview the built bundle |
| `yarn lint` | ESLint |
| `yarn test` | Vitest run-once |
| `yarn test:watch` | Vitest watch |
| `yarn e2e` | Playwright tests |
| `yarn e2e:ui` | Playwright UI mode |
| `yarn e2e:headed` | Playwright with visible browser |
| `yarn e2e:debug` | Playwright debug mode |
| `yarn e2e:report` | Open the last HTML report |

Single test: `yarn test src/path/to/file.test.tsx`, `yarn e2e e2e/path.spec.ts`.

## Source layout

```
src/
  components/
    intake/          # Decomposed pieces of the intake dialog (search panel, visit-type fields, form fields, consent box)
    ui/              # shadcn/ui primitives (don't refactor the variants pattern)
    DataTableHead.tsx, RescheduleDialog.tsx, etc.
  pages/             # Route components — Dashboard, Appointments, Patients, IntakeForms, BookingPage, Login, etc.
  hooks/
    useApi.ts        # All TanStack Query hooks wrapping lib/*Api.ts functions
    useAuth.ts       # JWT + /auth/me validation
    use-toast.ts, use-mobile.tsx
  lib/
    api.ts           # axios instance, JWT interceptor (reads localStorage.clinicos_token)
    *Api.ts          # Per-domain API wrappers (appointmentApi, patientsApi, intakeApi, ...)
    *Validation.ts   # Yup schemas for forms
  types/             # Per-domain types + barrel index.ts. Always import from @/types
  test/              # Vitest setup
e2e/                 # Playwright tests + fixtures
```

Path alias: `@/` → `src/`.

## Data layer

- **Single axios instance** in `src/lib/api.ts`. Reads JWT from `localStorage.clinicos_token` on every request.
- **All server state via react-query**. Hooks in `src/hooks/useApi.ts` wrap functions from `lib/*Api.ts`. Query keys are domain-scoped — invalidate them on mutation success.
- **Backend `_id` → frontend `id` mapping** lives in each `lib/*Api.ts` file (`mapApt`, `mapPatient`, etc.). Backend responses go through these mappers before reaching components. When adding fields, update both the `Backend*` interface and the mapper.
- **Auth**: `useAuth` validates the token by hitting `/auth/me` — `isLoggedIn` is server-verified, not just "token exists." On 401/network error the token is cleared.

## Forms

Formik + Yup. Validation schemas in `src/lib/*Validation.ts`. The intake dialog (`NewIntakeFormDialog`) is decomposed into `src/components/intake/`:

- `PatientSearchPanel` — debounced search to find existing patients
- `VisitTypeFields` — appointment-vs-walk-in toggle + corresponding selectors
- `PatientFormFields` — personal/insurance/medical/emergency/reason
- `ConsentBox` — the styled consent checkbox card
- `primitives.tsx` — `TextField` and `SectionHeader`, the small reusable bits

Follow this pattern when adding sections to large dialogs instead of growing the orchestrator.

## UI conventions

- **Reusable table head**: use [`DataTableHead`](src/components/DataTableHead.tsx) instead of inlining `<th className="text-left text-xs ...">` rows when the visual style matches the appointments tables.
- **shadcn Select can't have empty `value=""`** — use a sentinel like `__none__` and translate at the boundary (`val === '__none__' ? '' : val`).
- **shadcn UI files** (`src/components/ui/*`) export component variants alongside the component. The `react-refresh/only-export-components` lint warnings on these files are by-design — don't refactor them away.

## Common gotchas

- **Appointment patient fields are populated server-side virtuals** (`patientName`, `patientPhone`, `serviceName`). They come through the API as flat fields, but the source of truth is the linked Patient. Don't try to PATCH them on an appointment — update the Patient.
- **`@/lib/types` is dead** — types moved to `src/types/`. Always import from `@/types`.
- **Stale Vite HMR after big refactors** — module URLs include `?t=<timestamp>` so a stale chunk can render briefly. Hard-refresh (Cmd-Shift-R) when the dev server shows ghost errors for renamed/deleted symbols.

## Environment

| Variable | Default | Notes |
|---|---|---|
| `VITE_API_URL` | `http://localhost:4002` | Backend base URL — `/api/v1` is appended automatically |

## Deeper guidance

- [CLAUDE.md](CLAUDE.md) — project-specific guidance for Claude Code
- [../CLAUDE.md](../CLAUDE.md) — repo-wide architecture (multi-tenancy, patient identity, SMS routing)
