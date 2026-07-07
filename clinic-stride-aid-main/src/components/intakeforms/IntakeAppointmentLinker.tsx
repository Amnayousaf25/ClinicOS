import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  appointmentIdInput: string;
  onInputChange: (value: string) => void;
  onLoad: () => void;
  loading: boolean;
  inputError?: string;
  inputTouched?: boolean;
  bookingSummary?: { patientName: string; service: string; date: string; time: string };
  noBookingFound: boolean;
  onBlur: () => void;
}

/** Header field of the public intake form — appointment-id lookup. */
export const IntakeAppointmentLinker = ({
  appointmentIdInput,
  onInputChange,
  onLoad,
  loading,
  inputError,
  inputTouched,
  bookingSummary,
  noBookingFound,
  onBlur,
}: Props) => (
  <div className="space-y-1.5">
    <Label>Link to Appointment *</Label>
    <div className="flex gap-2">
      <Input
        required
        placeholder="Enter appointment ID"
        name="appointmentIdInput"
        value={appointmentIdInput}
        onChange={(e) => onInputChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onLoad();
          }
        }}
        className="rounded-xl"
      />
      <Button
        type="button"
        variant="outline"
        className="rounded-xl"
        onClick={onLoad}
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Load'}
      </Button>
    </div>
    {inputTouched && inputError && (
      <p className="text-xs text-destructive">{inputError}</p>
    )}
    {bookingSummary && (
      <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        Linked: {bookingSummary.patientName} - {bookingSummary.service} on{' '}
        {bookingSummary.date} at {bookingSummary.time}
      </div>
    )}
    {noBookingFound && (
      <p className="text-xs text-destructive">
        Unable to load this appointment ID.
      </p>
    )}
  </div>
);
