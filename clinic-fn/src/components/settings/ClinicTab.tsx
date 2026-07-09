import { useFormik } from 'formik';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormikFieldError } from '@/components/FormikFieldError';
import { cn } from '@/lib/utils';
import { useClinicSettings, useUpdateSettings } from '@/hooks/useApi';
import { clinicSettingsSchema } from '@/lib/settingsValidation';

interface ClinicValues {
  clinicName: string;
  startHour: string;
  endHour: string;
  slotDuration: number;
  timeFormat: '12' | '24';
}

export const ClinicTab = () => {
  const { data: settings } = useClinicSettings();
  const updateMut = useUpdateSettings();

  const formik = useFormik<ClinicValues>({
    enableReinitialize: true,
    initialValues: {
      clinicName: settings?.clinicName ?? '',
      startHour: settings?.workingHours?.start ?? '08:00',
      endHour: settings?.workingHours?.end ?? '17:00',
      slotDuration: settings?.slotDuration ?? 30,
      timeFormat: settings?.timeFormat || '24',
    },
    validationSchema: clinicSettingsSchema,
    onSubmit: (values, { setSubmitting }) =>
      updateMut.mutate(
        {
          clinicName: values.clinicName.trim(),
          workingHours: { start: values.startHour, end: values.endHour },
          slotDuration: values.slotDuration,
          timeFormat: values.timeFormat,
        },
        { onSettled: () => setSubmitting(false) },
      ),
  });

  return (
    <form
      onSubmit={formik.handleSubmit}
      className="bg-card rounded-2xl p-6 card-3d border border-border/50 space-y-4"
    >
      <h2 className="font-semibold text-foreground">Clinic Details</h2>
      <div className="space-y-2">
        <Label htmlFor="clinicName">Clinic Name</Label>
        <Input
          id="clinicName"
          name="clinicName"
          value={formik.values.clinicName}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className="rounded-xl"
        />
        <FormikFieldError
          error={formik.errors.clinicName}
          touched={formik.touched.clinicName}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startHour">Opening Time</Label>
          <Input
            id="startHour"
            name="startHour"
            type="time"
            value={formik.values.startHour}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="rounded-xl"
          />
          <FormikFieldError
            error={formik.errors.startHour}
            touched={formik.touched.startHour}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endHour">Closing Time</Label>
          <Input
            id="endHour"
            name="endHour"
            type="time"
            value={formik.values.endHour}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="rounded-xl"
          />
          <FormikFieldError
            error={formik.errors.endHour}
            touched={formik.touched.endHour}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="slotDuration">Slot Duration (minutes)</Label>
        <Input
          id="slotDuration"
          name="slotDuration"
          type="number"
          min={5}
          step={5}
          value={formik.values.slotDuration}
          onChange={(e) =>
            formik.setFieldValue(
              'slotDuration',
              Math.max(5, Number(e.target.value) || 5),
            )
          }
          onBlur={formik.handleBlur}
          className="rounded-xl"
        />
        <FormikFieldError
          error={formik.errors.slotDuration}
          touched={formik.touched.slotDuration}
        />
      </div>
      <div className="space-y-2">
        <Label>Time Format</Label>
        <div className="flex gap-2">
          {(['12', '24'] as const).map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => formik.setFieldValue('timeFormat', fmt)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                formik.values.timeFormat === fmt
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              {fmt === '12' ? '12 Hour (AM/PM)' : '24 Hour'}
            </button>
          ))}
        </div>
      </div>
      <Button
        type="submit"
        disabled={updateMut.isPending || formik.isSubmitting}
        className="btn-3d rounded-xl"
      >
        {updateMut.isPending ? 'Saving...' : 'Save Settings'}
      </Button>
    </form>
  );
};
