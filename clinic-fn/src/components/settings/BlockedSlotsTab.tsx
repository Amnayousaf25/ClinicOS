import { useFormik } from 'formik';
import { Ban, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/Spinner';
import DatePickerField from '@/components/DatePickerField';
import { FormikFieldError } from '@/components/FormikFieldError';
import {
  useBlockedSlots,
  useBlockSlot,
  useUnblockSlot,
} from '@/hooks/useApi';
import { blockSlotSchema } from '@/lib/settingsValidation';

interface BlockValues {
  date: string;
  time: string;
  reason: string;
}

const EMPTY: BlockValues = { date: '', time: '', reason: '' };

export const BlockedSlotsTab = () => {
  const { data: blockedSlots = [], isLoading } = useBlockedSlots();
  const blockMut = useBlockSlot();
  const unblockMut = useUnblockSlot();

  const formik = useFormik<BlockValues>({
    initialValues: EMPTY,
    validationSchema: blockSlotSchema,
    onSubmit: (values, { resetForm, setSubmitting }) =>
      blockMut.mutate(
        { date: values.date, time: values.time },
        {
          onSuccess: () => resetForm(),
          onSettled: () => setSubmitting(false),
        },
      ),
  });

  return (
    <div className="bg-card rounded-2xl p-6 card-3d border border-border/50 space-y-4">
      <h2 className="font-semibold text-foreground">Blocked Time Slots</h2>
      <p className="text-xs text-muted-foreground">
        Block slots so they're unavailable on the public booking page.
      </p>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="sm" />
        </div>
      ) : (
        <div className="space-y-2">
          {blockedSlots.map((b) => (
            <div
              key={b._id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {b.date} · {b.time}
                </p>
                {b.reason && (
                  <p className="text-xs text-muted-foreground">{b.reason}</p>
                )}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive"
                onClick={() => unblockMut.mutate({ date: b.date, time: b.time })}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {blockedSlots.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              No blocked slots
            </p>
          )}
        </div>
      )}

      <form
        onSubmit={formik.handleSubmit}
        className="border-t border-border pt-4 space-y-3"
      >
        <h3 className="text-sm font-medium text-foreground">Block a Slot</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <DatePickerField
              value={formik.values.date}
              onChange={(value) => {
                formik.setFieldTouched('date', true, false);
                formik.setFieldValue('date', value, true);
              }}
              placeholder="Select date"
              showYearDropdown
            />
            <FormikFieldError
              error={formik.errors.date}
              touched={formik.touched.date}
            />
          </div>
          <div className="space-y-1">
            <Input
              name="time"
              type="time"
              value={formik.values.time}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="rounded-xl"
            />
            <FormikFieldError
              error={formik.errors.time}
              touched={formik.touched.time}
            />
          </div>
        </div>
        <Input
          name="reason"
          placeholder="Reason (optional)"
          value={formik.values.reason}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className="rounded-xl"
        />
        <Button
          type="submit"
          className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={blockMut.isPending || formik.isSubmitting}
        >
          <Ban className="w-4 h-4 mr-2" />
          Block Slot
        </Button>
      </form>
    </div>
  );
};
