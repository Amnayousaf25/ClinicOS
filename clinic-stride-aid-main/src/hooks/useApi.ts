/**
 * Barrel re-export of all React Query hooks. Each domain lives in its
 * own file under `hooks/api/` — this index keeps the existing
 * `import { ... } from '@/hooks/useApi'` call sites working without
 * forcing every consumer to know about the per-domain file split.
 *
 * When adding a new hook, put it in (or create) the right `hooks/api/*`
 * file and export it here.
 */
export * from './api/useAppointments';
export * from './api/useBooking';
export * from './api/useSettings';
export * from './api/useInsurance';
export * from './api/usePatients';
export * from './api/useSms';
export * from './api/useStaff';
