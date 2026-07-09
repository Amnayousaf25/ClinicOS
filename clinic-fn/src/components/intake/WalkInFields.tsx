import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProviders, useServices } from '@/hooks/useApi';
import type { FormikHelpers } from 'formik';
import type { IntakeFormValues } from './types';

interface Props {
  values: IntakeFormValues;
  setFieldValue: FormikHelpers<IntakeFormValues>['setFieldValue'];
  isOpen: boolean;
}

/**
 * Walk-in-only service + provider selectors. Only rendered when the
 * intake form is in walk-in mode (no linked appointment exists yet,
 * so we have to capture the service that's about to be performed).
 */
export const WalkInFields = ({ values, setFieldValue, isOpen }: Props) => {
  const { data: services = [] } = useServices({ enabled: isOpen });
  const { data: providers = [] } = useProviders({ enabled: isOpen });

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="serviceId">Service *</Label>
        <Select
          value={values.serviceId || ''}
          onValueChange={(val) => setFieldValue('serviceId', val)}
        >
          <SelectTrigger id="serviceId" className="rounded-xl">
            <SelectValue placeholder="Select service" />
          </SelectTrigger>
          <SelectContent>
            {services.map((s) => (
              <SelectItem key={s._id} value={s._id}>
                {s.name}
              </SelectItem>
            ))}
            {services.length === 0 && (
              <SelectItem value="__no_services__" disabled>
                No services configured
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="providerId">Provider</Label>
        <Select
          value={values.providerId || '__unassigned__'}
          onValueChange={(val) =>
            setFieldValue('providerId', val === '__unassigned__' ? '' : val)
          }
        >
          <SelectTrigger id="providerId" className="rounded-xl">
            <SelectValue placeholder="Unassigned" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__unassigned__">Unassigned</SelectItem>
            {providers.map((p) => (
              <SelectItem key={p._id} value={p._id}>
                {p.name}
                {p.title ? ` — ${p.title}` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
