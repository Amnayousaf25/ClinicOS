import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useReschedule, useClinicSettings, useProviders } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DatePickerField from '@/components/DatePickerField';
import TimePickerField from '@/components/TimePickerField';
import { patientName, refId } from '@/lib/appointmentDisplay';
import dayjs from 'dayjs';
import type { Appointment } from '@/types';

const rescheduleSchema = Yup.object({
  date: Yup.string().required('Date is required'),
  time: Yup.string().required('Time is required'),
});

interface RescheduleDialogProps {
  appointment: Appointment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RescheduleDialog = ({ appointment, open, onOpenChange }: RescheduleDialogProps) => {
  const { data: settings } = useClinicSettings({ enabled: open });
  const { data: providers = [] } = useProviders({ enabled: open });
  const rescheduleMut = useReschedule({ onSuccess: () => onOpenChange(false) });

  const workingHours = settings?.workingHours ?? { start: '08:00', end: '17:00' };
  const slotDuration = settings?.slotDuration ?? 30;

  const formik = useFormik({
    initialValues: {
      date: appointment.date,
      time: appointment.time,
      providerId: refId(appointment.providerId),
    },
    validationSchema: rescheduleSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      rescheduleMut.mutate({
        id: appointment._id,
        date: values.date,
        time: values.time,
      });
    },
  });

  const generateSlots = () => {
    const slots: string[] = [];
    const [startH] = workingHours.start.split(':').map(Number);
    const [endH] = workingHours.end.split(':').map(Number);
    for (let h = startH; h < endH; h++) {
      for (let m = 0; m < 60; m += slotDuration) {
        slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      }
    }
    return slots;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl p-0 max-h-[90vh] overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border/60">
          <DialogTitle>Reschedule — {patientName(appointment)}</DialogTitle>
          <DialogDescription className="sr-only">
            Pick a new date and time for this appointment.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={formik.handleSubmit} className="flex flex-col max-h-[calc(90vh-74px)]">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="p-3 rounded-xl bg-muted/60 text-sm text-muted-foreground">
            Current: {dayjs(appointment.date).format('MMM D, YYYY')} at {appointment.time}
          </div>
          <div className="space-y-1.5">
            <Label>New Date</Label>
            <DatePickerField
              value={formik.values.date}
              onChange={(date) => {
                formik.setFieldValue('date', date);
                formik.setFieldTouched('date', true, true);
              }}
              minDate={dayjs().format('YYYY-MM-DD')}
              disablePast
              placeholder="Select new date"
            />
          </div>
          <div className="space-y-1.5">
            <Label>New Time</Label>
            <TimePickerField
              value={formik.values.time}
              onChange={(val) => formik.setFieldValue('time', val)}
              slots={generateSlots()}
              placeholder="Select time"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Doctor</Label>
            <Select value={formik.values.providerId || 'none'} onValueChange={(val) => formik.setFieldValue('providerId', val === 'none' ? '' : val)}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select doctor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {providers.map((p) => (
                  <SelectItem key={p._id} value={p._id}>{p.name}{p.title ? ` — ${p.title}` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          </div>
          <div className="shrink-0 px-6 py-4 border-t border-border/60 bg-background">
            <div className="flex gap-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={rescheduleMut.isPending} className="flex-1 rounded-xl btn-3d shadow-primary-glow">
              {rescheduleMut.isPending ? 'Rescheduling...' : 'Reschedule'}
            </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleDialog;
