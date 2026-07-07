# ClinicOS Backend

NestJS backend for ClinicOS — a multi-tenant clinic platform covering appointments, patient records, digital intake, walk-in flow, and SMS/email reminders. Pairs with the [`clinic-stride-aid`](../clinic-stride-aid) React frontend.

## Tech stack

- **Runtime**: Node.js `>=25` (set in `engines`)
- **Framework**: NestJS
- **Database**: MongoDB (Mongoose ODM)
- **Auth**: JWT + Passport (access + refresh tokens, OTP, social login, invite accept)
- **Storage**: AWS S3 (uploads + presigned URLs)
- **SMS**: LifetimeSMS (`+92` / Pakistan, immediate) + Telnyx (international, immediate + scheduled)
- **Email**: Multi-provider (Resend, SES, SendGrid, Brevo)
- **Scheduling**: `@nestjs/schedule` cron jobs

## Getting started

```bash
yarn install
cp .env.example .env.dev    # configure (see below)
yarn seed:superadmin        # bootstrap an org + admin user
yarn start:dev              # watch mode, port 4002
```

## Commands

| Command | What it does |
|---|---|
| `yarn start:dev` | Watch mode, reads `.env.dev` |
| `yarn start:dev:clean` | Kill any process on PORT, then start:dev |
| `yarn start:debug` | Watch + `--inspect` |
| `yarn start:prod` | Reads `.env.prod`, expects `dist/` from `yarn build` |
| `yarn build` | `nest build` |
| `yarn lint` | ESLint with `--fix` |
| `yarn test` / `:watch` / `:cov` | Jest |
| `yarn test -- --testPathPattern=<pat>` | Single test |
| `yarn test:e2e` | E2E (`test/jest-e2e.json`) |
| `yarn seed:superadmin` | Bootstrap superadmin + their org |
| `yarn backfill:permissions` | Assign permissions to existing users |
| `yarn backfill:departments` | Populate Departments collection |
| `yarn import:external-users` | Bulk import from external source |

API docs: Swagger UI at `/api-docs` (bearer auth).

## Environment

```env
# Core
NODE_ENV=dev
PORT=4002
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# AWS (S3 uploads)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=

# Email (Resend)
Email_API_KEY=re_...
Email_FROM=support@clinicos.com

# SMS — Pakistan (LifetimeSMS)
LIFE_TIME_API_TOKEN=
LIFE_TIME_API_SECRET=

# SMS — International (Telnyx)
TELYNX_API_KEY=
TELNYX_MESSAGING_PROFILE_ID=     # optional

# CORS
ALLOWED_ORIGINS=http://localhost:8080

# Frontend URL (used in SMS intake links)
FRONTEND_URL=https://your-frontend.com
```

The app reads `.env.${NODE_ENV}` — so `.env.dev` and `.env.prod`, not `.env`.

## Project structure

```
src/
  common/               # Guards, decorators, utils, permission catalog, response constants
  modules/
    auth/               # JWT login, refresh, OTP, social login, invite accept
    users/              # User CRUD, permissions, invite flow
    organizations/      # Multi-tenancy, org settings, role defaults
    departments/        # Clinic departments
    clinic-settings/    # Hours, slot duration, SMS templates, blocked slots
    services/           # Booking services CRUD
    providers/          # Doctors/providers (linked to a service)
    insurance/          # Insurance providers list
    patients/           # Patient collection (MRN, phoneHistory) + Counter for atomic MRN generation
    appointments/       # Appointment CRUD, status state-machine, reschedule, audit history
    booking/            # Public booking (no auth, identified by org slug + bookingId UUID)
    intake/             # Digital intake form (public submit + staff view), walk-in flow
    sms/                # Multi-provider router (LifetimeSMS + Telnyx)
    reminders/          # Reminder configs, scheduling, logs, cron
    email/              # Multi-provider email
    chat/               # WebSocket (socket.io) + REST messaging
    media/              # AWS S3 uploads, presigned URLs
    notifications/      # SSE real-time push
    onesignal/          # Push notifications via OneSignal
  seeds/                # Bootstrap + backfill scripts
```

## Domain model

### Multi-tenancy

Every domain document carries an `orgId`. The `JwtAuthGuard` puts the user on the request, and the `@OrgId()` decorator extracts the org for service calls. Every query in services scopes by `orgId` — **never trust client-supplied org IDs**.

### Patient identity (MRN, not phone)

`Patient` is the canonical record, identified by an immutable **MRN** (Medical Record Number) — `P-000001`, `P-000002`, etc. Generated via per-org atomic counter (`Counter` collection, `findOneAndUpdate` with `$inc`).

Phone is searchable but **not indexed unique** — phones change. The same phone can legitimately belong to two patients (couples, parent-child). When a patient's phone changes, the old number is automatically appended to `phoneHistory: [{phone, changedAt}]` so search still finds them.

**Three explicit methods, not a silent upsert:**

| Method | Use case |
|---|---|
| `createPatient(input)` | Brand-new patient — generates MRN, creates row. Caller must have confirmed the patient is new (e.g. ran `search` and got no acceptable match). |
| `updatePatient(orgId, patientId, patch)` | Known existing patient. Empty fields don't blank existing values. Phone change appends to `phoneHistory`. |
| `findByPhoneOrCreate(input)` | Public booking flow only — no auth, no UI for disambiguation. |
| `search(orgId, query)` | Matches MRN (exact), name, current phone, prior phones, email. Used by the staff frontend before deciding create-vs-link. |

`POST /patients/backfill` (admin-only) runs `sanitizeLegacyRefs` → `backfillFromAppointments` → `backfillMrns` for legacy data.

### Appointment schema (FK-only with virtuals)

`Appointment` stores **only foreign keys**: `patientId`, `serviceId`, `providerId`. Snapshot fields like `patientName`, `patientPhone`, `serviceName` are **Mongoose virtuals** populated from the refs.

The schema declares:
- `toJSON: { virtuals: true }` — virtuals serialize into API responses
- `pre('find')` and `pre('findOne')` hooks auto-populate `patientId` and `serviceId`
- `providerId` is intentionally **excluded** from auto-populate — legacy data may contain invalid string IDs (e.g. `"p2"`) that crash the cast. `PatientsService.sanitizeLegacyRefs()` runs `OnModuleInit` to null these out.

**Implications when writing new code:**
- Reading `apt.patientName` works on docs returned from `findOne()`/`find()`. **It does NOT work on freshly-created docs** — call `await apt.populate([...])` first.
- Writing `apt.patientName = "..."` is a no-op (virtuals are read-only). Update the linked `Patient` instead.
- The `AppointmentDocument` type extends `AppointmentVirtuals` so TypeScript exposes the virtual field names as `string | undefined`.

### Booking vs Appointment

"Booking" = the **public, no-auth surface** (`src/modules/booking/`). It creates `Appointment` records but exposes them via UUID `bookingId` instead of Mongo `_id` — that's what goes in SMS confirmation links and the public confirmation page. ObjectIds are sequential and would let patients enumerate adjacent appointments.

`Appointments` is the staff-facing module on the same collection — auth required, identified by `_id`.

### Audit trail (`AppointmentHistory`)

Every state change writes a row with `from*`/`to*` snapshots, `actor` (`patient` / `staff` / `system`), `changedBy` user ref, and `changedAt`. Used for:
- `GET /appointments/:id/history` — per-appointment timeline
- `GET /appointments/patient-history?phone=...` — per-patient stats
- `GET /appointments/stats` — org-wide event counts over a period

Reschedule increments `Appointment.rescheduleCount` and stamps `lastRescheduledAt`. Auto-arrived on intake submission writes a row with `actor: 'patient'` and `reason: 'Intake form submitted'`.

## API surface

### Appointments (staff, JWT)

- `GET /appointments` — list (filter `?period=today|week`, `?date=`, `?status=`)
- `GET /appointments/stats` — org-wide stats with action event counts
- `GET /appointments/patient-history?phone=...` — per-patient timeline
- `GET /appointments/:id` / `GET /appointments/:id/history`
- `POST /appointments` — create (auto-sends confirmation SMS + schedules 24h/2h reminders)
- `PATCH /appointments/:id/status` — update status (validated against `VALID_TRANSITIONS`)
- `PATCH /appointments/:id/reschedule` — cancels old reminders, schedules new
- `PATCH /appointments/:id/reconfirm` — `Rescheduled → Confirmed` (patient reconfirms)
- `POST /appointments/:id/send-confirmation-sms` — manual resend
- `DELETE /appointments/:id` — cancel (cancels pending Telnyx reminders)

### Patients (staff, JWT)

- `GET /patients/search?q=...` — fuzzy match across MRN, name, phone, phoneHistory, email
- `GET /patients/:id`
- `POST /patients/backfill` — admin-only migration

### Booking (public, no auth)

- `GET /booking/:orgSlug/services` — available services
- `GET /booking/:orgSlug/time-slots?date=YYYY-MM-DD`
- `POST /booking/:orgSlug` — create booking (returns `bookingId` UUID)
- `GET /booking/info/:bookingId` — patient looks up their own booking

### Intake

- `GET /intake/:appointmentId` — booking info for the intake form (public)
- `POST /intake` — submit (public for patients via SMS link, staff for walk-ins). For walk-ins, omit `appointmentId` and pass `serviceId` + patient details — the system creates the appointment with `appointmentType: 'walk-in'`, `status: 'arrived'`. Submission also auto-transitions the appointment to `arrived`.
- `GET /intake/:appointmentId/submission` — view (staff, requires `INTAKE_VIEW`)
- `PATCH /intake/:appointmentId/submission` — update (staff)

### Services / Providers / Insurance / Clinic Settings

Standard CRUD under `/services`, `/providers`, `/insurance-providers`, `/clinic-settings`. See [CLAUDE.md](CLAUDE.md) for permission requirements.

## Auth & permissions

All staff endpoints use `JwtAuthGuard` + `PermissionsGuard`. Two clinic roles:

- **Admin** — full access
- **Staff** — view/manage appointments only

Permissions: `APPOINTMENTS_READ`, `APPOINTMENTS_MANAGE`, `BOOKINGS_MANAGE`, `REMINDERS_MANAGE`, `INTAKE_VIEW`, `SETTINGS_MANAGE`, plus the platform-level catalog (`TEAM_VIEW`, `TEAM_INVITE`, etc.).

Wire endpoints with `@Permissions(PERMISSIONS.X)`. Catalog: [`src/common/permissions/permission.constants.ts`](src/common/permissions/permission.constants.ts).

## SMS routing

Automatic provider selection by destination prefix:

| Destination     | Provider    | Features                          |
|-----------------|-------------|-----------------------------------|
| `+92` (Pakistan)| LifetimeSMS | Immediate send only               |
| Everything else | Telnyx      | Immediate + scheduled (`send_at`) |

Files: `sms.service.ts` (router), `lifetime.service.ts`, `telnyx.service.ts`.

### Reminder lifecycle

Smart scheduling — no constant polling:

1. **On appointment create**: confirmation SMS sent immediately, 24h + 2h reminders pre-scheduled via Telnyx `send_at`
2. **On reschedule**: old reminders cancelled (`DELETE /v2/messages/{id}`), new ones scheduled at the new time
3. **On cancel**: all pending reminders cancelled
4. **Hourly cron**: sends due reminders that couldn't be Telnyx-scheduled (PK numbers)
5. **Daily cron (2 AM)**: promotes pending reminders entering Telnyx's 5-day scheduling window

Reminder statuses: `scheduled` | `pending` | `delivered` | `cancelled` | `failed`.

## Testing

```bash
yarn test                              # unit tests
yarn test -- --testPathPattern=<pat>   # single test
yarn test:e2e                          # e2e tests
```

Unit specs colocated as `*.spec.ts`. E2E in `test/` with its own `jest-e2e.json` config. When adding a new model dependency to a service, update its spec to mock the new injected `@InjectModel(...)` token.

## Deployment

```bash
yarn build
NODE_ENV=prod node dist/main.js
```

The app reads `.env.${NODE_ENV}` — set `NODE_ENV=prod` for production builds.

## Conventions

- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`)
- **Branches**: `feature/be-<module>` for features, `cleanup/<scope>` for cleanup
- **Path aliases**: bare `src/` prefix (e.g. `import { X } from 'src/modules/foo/...'`). No `@/` alias.

## Deeper guidance

- [CLAUDE.md](CLAUDE.md) — backend-specific guidance for Claude Code
- [../CLAUDE.md](../CLAUDE.md) — repo-wide architecture
