# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

For repo-wide architecture (multi-tenancy, patient identity model, SMS routing, frontend ↔ backend contract), see [../CLAUDE.md](../CLAUDE.md). This file covers backend-specific details only.

## Project overview

NestJS backend for ClinicOS — a multi-tenant clinic platform. MongoDB via Mongoose. JWT (access + refresh) auth with permission-based authorization.

Node `>25.x` (set in `engines`).

## Commands

- `yarn install`
- `yarn start:dev` — watch mode, reads `.env.dev`, port 4002 by default
- `yarn start:dev:clean` — kills any process on PORT first, then `start:dev`
- `yarn start:debug` — `--inspect` on
- `yarn start:prod` — reads `.env.prod`, expects `dist/` from `yarn build`
- `yarn build` — `nest build`
- `yarn lint` — ESLint with `--fix`
- `yarn test` / `yarn test:watch` / `yarn test:cov`
- `yarn test -- --testPathPattern=<pattern>` — single test
- `yarn test:e2e` — uses `test/jest-e2e.json`
- **Seeds** (`src/seeds/`):
  - `yarn seed:superadmin` — bootstrap a superadmin + their org
  - `yarn backfill:permissions` — assign permissions to existing users
  - `yarn backfill:departments` — populate the Departments collection
  - `yarn import:external-users` — bulk import from external source

API docs: Swagger UI at `/api-docs` (bearer auth).

## Module layout

Each module under `src/modules/<name>/` follows the same shape:
- `<name>.module.ts`, `<name>.controller.ts`, `<name>.service.ts`
- `schemas/` (Mongoose), `dto/` (class-validator), sometimes `constants/` and `types/`
- `*.spec.ts` colocated for unit tests

`src/common/` holds cross-cutting code: guards (`JwtAuthGuard`, `PermissionsGuard`), decorators (`@Permissions()`, `@OrgId()`), the permission catalog, response constants, validation utilities.

### Authentication & infra modules
`auth`, `users`, `organizations`, `departments`, `chat` (socket.io + REST), `media` (S3), `notifications` (SSE), `onesignal`, `email` (Resend / SES / SendGrid / Brevo).

### Clinic modules
- `clinic-settings` — clinic name, working hours, slot duration, blocked slots, SMS templates
- `services` — booking services CRUD (org-scoped uniqueness)
- `providers` — doctors/providers, optionally linked to a service
- `insurance` — insurance provider list
- `patients` — Patient collection (MRN, phoneHistory) + Counter for atomic per-org MRN generation
- `appointments` — appointment CRUD, status state-machine, reschedule, audit history
- `booking` — public unauthenticated booking (org slug)
- `intake` — public + staff intake form submission, walk-in flow
- `sms` — multi-provider SMS router (LifetimeSMS for `+92`, Telnyx elsewhere)
- `reminders` — reminder configs, scheduling via Telnyx `send_at`, hourly + 2 AM crons

## Patient identity invariants (do not regress)

- **`mrn` is the only unique identifier on `Patient`.** Indexed unique on `{orgId, mrn}`. Generated via per-org atomic counter. Immutable.
- **`phone` is NOT indexed and NOT unique.** Phones change. One phone can legitimately belong to multiple patients (a parent booking for several children with no phones of their own; couples; roommates). Storing phone as unique would force-merge unrelated patients onto a single record.
- **Public booking match-or-create** ([booking.service.ts](src/modules/booking/booking.service.ts)) uses `findByPhoneAndNameOrCreate` — both phone *and* name (case-insensitive, trimmed) must match an existing record, otherwise a new patient with a fresh MRN is created. Never reduce this to phone-only matching.
- If a stale unique index from earlier schema versions still exists in production Mongo, `PatientsService.dropObsoletePatientIndexes()` (run on `OnModuleInit`) drops it. Add new entries to the `obsoleteNames` allowlist whenever a unique constraint is removed from the schema — Mongoose creates new indexes but never drops obsolete ones.

## Workflow rules

- **Pre-arrival intake doesn't auto-arrive.** Submission only flips status to `Arrived` when `apt.date === today` (UTC). Otherwise just sets `intakeStatus: Submitted` and leaves the appointment status alone. Staff marks arrived manually when the patient physically walks in. Critical for the SMS-link "fill before your visit" UX — patients filling the form a few days early shouldn't make their appointment look done.
- **Read clinic config = `APPOINTMENTS_READ`. Write clinic config = `SETTINGS_MANAGE`.** Staff need to read services / providers / clinic-settings / insurance-providers to create appointments — they don't have `SETTINGS_MANAGE`. When adding new endpoints under those modules, mirror the split: `@Get` uses `APPOINTMENTS_READ`, mutations use `SETTINGS_MANAGE`.
- **Status terminal states**: `Arrived`, `Cancelled`, `NoShow` have empty arrays in `VALID_TRANSITIONS` — no transitions out. The frontend `StatusDropdown` mirrors this by disabling itself; if a future flow needs to allow a terminal-state transition (e.g. unmark no-show), update both layers.

## Patterns

- **Multi-tenant scoping**: every domain query filters by `orgId`. Pull `orgId` from the JWT context via the `@OrgId()` decorator — never trust client-supplied org IDs.
- **Validation**: global `ValidationPipe({ whitelist: true })` strips unknown DTO fields. Always declare DTOs with `class-validator` decorators.
- **Permission catalog**: `src/common/permissions/permission.constants.ts` (`APPOINTMENTS_READ`, `APPOINTMENTS_MANAGE`, `BOOKINGS_MANAGE`, `REMINDERS_MANAGE`, `INTAKE_VIEW`, `SETTINGS_MANAGE`, etc.). Wire endpoints with `@Permissions(PERMISSIONS.X)`.
- **Path aliases**: bare `src/` prefix (e.g. `import { X } from 'src/modules/foo/...'`). No `@/` alias.
- **Public endpoints** (booking, intake-by-bookingId): no auth, identified by `bookingId` (UUID) instead of `_id` (ObjectId). The `Booking` module is the public surface; `Appointments` is staff-facing — they operate on the same collection.
- **Status state machine**: `VALID_TRANSITIONS` in `appointments.service.ts` controls allowed status changes. Don't bypass it.

## Appointment schema (denormalized via virtuals — read this before touching reads)

`Appointment` stores **only FKs**: `patientId`, `serviceId`, `providerId`. Snapshot fields like `patientName`, `patientPhone`, `patientEmail`, `serviceName`, `provider` are **Mongoose virtuals** populated from refs. The schema declares:

- `toJSON: { virtuals: true }` and `toObject: { virtuals: true }` — virtuals serialize into API responses
- A `pre('find')` and `pre('findOne')` hook auto-populates `patientId` and `serviceId`
- **`providerId` is intentionally excluded from auto-populate** — legacy data may have invalid string IDs (e.g. `"p2"`) that crash the cast. `PatientsService.sanitizeLegacyRefs` runs on module init to null out invalid refs.

Implications for new code:
- Reading `apt.patientName` works on docs returned from `findOne()`/`find()`. **It does NOT work on freshly-created docs** — call `await apt.populate([{ path: 'patientId', select: 'name phone email' }, ...])` first.
- Writing `apt.patientName = "..."` is a no-op — virtuals are read-only. Update the linked `Patient` instead.
- The `AppointmentDocument` type extends `AppointmentVirtuals` so TypeScript exposes the virtual field names (typed as `string | undefined`).

## Patient identity (no silent upserts by phone)

- **MRN** (`P-000001`) is the canonical patient identifier — generated via per-org atomic counter (`Counter` collection, `findOneAndUpdate` with `$inc`). Stored on `Patient.mrn`, indexed unique with `orgId`.
- Phone is searchable but **not indexed unique** — phones change. The same phone can legitimately belong to two patients (couples, parent-child).
- `phoneHistory: [{phone, changedAt}]` on `Patient` — `updatePatient` automatically appends the old phone before overwriting.
- **Three explicit methods, not one upsert**:
  - `createPatient(input)` — generates MRN, creates row. Caller must have confirmed the patient is new.
  - `updatePatient(orgId, patientId, patch)` — for known existing patients. Empty fields don't blank existing values.
  - `findByPhoneOrCreate(input)` — only used in the public booking flow which has no UI for disambiguation.
- `PatientsService.search` matches MRN (exact), name, current phone, prior phones, and email — used by the staff frontend to populate a "find existing patient" dropdown before deciding create-vs-link.

Migrations exposed via `POST /patients/backfill` (admin-only): runs `sanitizeLegacyRefs` → `backfillFromAppointments` (creates Patient rows from legacy appointments lacking `patientId`) → `backfillMrns` (assigns MRNs to legacy patients).

## SMS & reminders

`SmsService` routes by destination prefix:
- `+92` → `LifetimeSmsService` (Pakistan, immediate only)
- everything else → `TelnyxService` (immediate + scheduled `send_at`, cancellable via `DELETE /v2/messages/{id}`)

`RemindersService` flow:
1. Appointment created → confirmation SMS sent immediately, 24h + 2h reminders pre-scheduled with Telnyx `send_at`
2. Appointment rescheduled → cancel old reminders, schedule new ones at the new time
3. Appointment cancelled → cancel pending reminders
4. **Hourly cron** sends due PK reminders that couldn't be Telnyx-scheduled
5. **Daily cron (2 AM)** promotes pending reminders entering Telnyx's 5-day scheduling window

`ReminderLog` rows track each send with status: `scheduled` | `pending` | `delivered` | `cancelled` | `failed`.

## Audit trail

`AppointmentHistory` collection records every status change, reschedule, and cancellation with `from*`/`to*` snapshots, `actor` (`patient` / `staff` / `system`), `changedBy` user ref, and `changedAt`. Used for:
- `GET /appointments/:id/history` — per-appointment timeline
- `GET /appointments/patient-history?phone=...` — per-patient stats (rescheduleCount, cancelCount)
- `GET /appointments/stats` — org-wide event counts over a period

Reschedule also increments `Appointment.rescheduleCount` and stamps `lastRescheduledAt`. Status transitions triggered by intake submission (auto-`arrived`) write history entries with `actor: 'patient'` and `reason: 'Intake form submitted'`.

## Conventions

- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`).
- **Branches**: `feature/be-<module>` for features, `cleanup/<scope>` for cleanup.
- **Tests**: colocated `*.spec.ts` for unit, `test/` for e2e. When adding a new model dependency to a service, update its spec to mock the new injected `@InjectModel(...)` token.
