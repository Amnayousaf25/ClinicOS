import type { FormikProps } from 'formik';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DatePickerField from '@/components/DatePickerField';
import { useInsuranceProviders } from '@/hooks/useApi';
import { PhoneInput } from '@/components/PhoneInput';

export interface IntakeEditValues {
  name: string;
  dob: string;
  phone: string;
  email: string;
  reasonForVisit: string;
  consent: boolean;
  insuranceProvider: string;
}

interface Props {
  formik: FormikProps<IntakeEditValues>;
}

const ErrorText = ({
  error,
  touched,
}: {
  error: unknown;
  touched: unknown;
}) =>
  touched && typeof error === 'string' ? (
    <p className="text-xs text-destructive">{error}</p>
  ) : null;

export const IntakeFormEditFields = ({ formik }: Props) => {
  const { data: insuranceProviders = [] } = useInsuranceProviders();

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Full Name</Label>
        <Input name="name" value={formik.values.name} onChange={formik.handleChange} onBlur={formik.handleBlur} className="rounded-xl" />
        <ErrorText error={formik.errors.name} touched={formik.touched.name} />
      </div>
      <div className="space-y-1.5">
        <Label>Date of Birth</Label>
        <DatePickerField
          value={formik.values.dob}
          onChange={(value) => {
            formik.setFieldTouched('dob', true, false);
            formik.setFieldValue('dob', value, true);
          }}
          disableFuture
          showYearDropdown
          placeholder="Select date of birth"
        />
        <ErrorText error={formik.errors.dob} touched={formik.touched.dob} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <PhoneInput
          name="phone"
          label="Phone"
          required
          value={formik.values.phone}
          onChange={(val) => formik.setFieldValue('phone', val)}
          onBlur={formik.handleBlur}
          error={formik.errors.phone}
          touched={formik.touched.phone}
          className="col-span-1"
        />
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input name="email" type="email" value={formik.values.email} onChange={formik.handleChange} onBlur={formik.handleBlur} className="rounded-xl" />
          <ErrorText error={formik.errors.email} touched={formik.touched.email} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Insurance Provider</Label>
        <Select
          value={formik.values.insuranceProvider || '__none__'}
          onValueChange={(value) =>
            formik.setFieldValue(
              'insuranceProvider',
              value === '__none__' ? '' : value,
            )
          }
        >
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Select insurance provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">-- None --</SelectItem>
            {insuranceProviders.map((p) => (
              <SelectItem key={p._id} value={p.name}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Reason for Visit</Label>
        <Textarea
          name="reasonForVisit"
          value={formik.values.reasonForVisit}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          rows={4}
          className="rounded-xl"
        />
        <ErrorText
          error={formik.errors.reasonForVisit}
          touched={formik.touched.reasonForVisit}
        />
      </div>
    </div>
  );
};
