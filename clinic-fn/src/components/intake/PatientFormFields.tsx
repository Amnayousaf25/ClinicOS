import { Field, ErrorMessage, type FormikHelpers } from 'formik';
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
import { TextField, SectionHeader } from './primitives';
import type { IntakeFormValues } from './types';
import { PhoneInput } from '@/components/PhoneInput';

interface Props {
  values: IntakeFormValues;
  setFieldValue: FormikHelpers<IntakeFormValues>['setFieldValue'];
  errors: any;
  touched: any;
}

export const PatientFormFields = ({ values, setFieldValue, errors, touched }: Props) => {
  const { data: insuranceProviders = [] } = useInsuranceProviders();

  return (
    <>
      <TextField name="name" label="Full Name" placeholder="John Doe" required />

      <div className="space-y-1.5">
        <Label htmlFor="dob">Date of Birth *</Label>
        <DatePickerField
          value={values.dob}
          onChange={(value) => setFieldValue('dob', value, true)}
          placeholder="Select date of birth"
          disableFuture
          showYearDropdown
        />
        <ErrorMessage
          name="dob"
          component="p"
          className="text-xs text-destructive"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-1">
          <PhoneInput
            name="phone"
            label="Phone"
            required
            value={values.phone}
            onChange={(val) => setFieldValue('phone', val)}
            error={errors.phone}
            touched={touched.phone}
          />
        </div>
        <div className="col-span-1">
          <TextField
            name="email"
            label="Email"
            type="email"
            placeholder="john@email.com"
            required
          />
        </div>
      </div>

      <TextField name="address" label="Address" placeholder="123 Main St, City" />

      <SectionHeader>Insurance Information</SectionHeader>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="insuranceProvider">Insurance Provider</Label>
          <Select
            value={values.insuranceProvider || '__none__'}
            onValueChange={(val) =>
              setFieldValue(
                'insuranceProvider',
                val === '__none__' ? '' : val,
              )
            }
          >
            <SelectTrigger id="insuranceProvider" className="rounded-xl">
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">-- None --</SelectItem>
              {insuranceProviders.map((provider) => (
                <SelectItem key={provider._id} value={provider.name}>
                  {provider.name}
                </SelectItem>
              ))}
              {insuranceProviders.length === 0 && (
                <SelectItem value="__no_providers__" disabled>
                  No providers configured in Settings
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <TextField
          name="insuranceNumber"
          label="Insurance Number"
          placeholder="INS-2024-0001"
        />
      </div>

      <SectionHeader>Medical Information</SectionHeader>
      <div className="grid grid-cols-2 gap-3">
        <TextField
          name="allergies"
          label="Allergies"
          placeholder="Penicillin, Latex..."
        />
        <TextField
          name="medications"
          label="Current Medications"
          placeholder="Ibuprofen 200mg..."
        />
      </div>

      <SectionHeader>Emergency Contact</SectionHeader>
      <div className="grid grid-cols-2 gap-3">
        <TextField
          name="emergencyContact"
          label="Contact Name"
          placeholder="Jane Doe"
        />
        <div className="col-span-1">
          <PhoneInput
            name="emergencyPhone"
            label="Contact Phone"
            value={values.emergencyPhone}
            onChange={(val) => setFieldValue('emergencyPhone', val)}
            error={errors.emergencyPhone}
            touched={touched.emergencyPhone}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reasonForVisit">Reason for Visit *</Label>
        <Field
          as={Textarea}
          name="reasonForVisit"
          id="reasonForVisit"
          placeholder="Describe the reason..."
          rows={3}
        />
        <ErrorMessage
          name="reasonForVisit"
          component="p"
          className="text-xs text-destructive"
        />
      </div>
    </>
  );
};
