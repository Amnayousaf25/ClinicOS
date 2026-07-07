import dayjs from 'dayjs';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DatePickerField from '@/components/DatePickerField';
import { FormikFieldError } from '@/components/FormikFieldError';

const today = () => dayjs().format('YYYY-MM-DD');
const nowTime = () => dayjs().format('HH:mm');

interface Props {
  date: string;
  time: string;
  dateError?: string;
  dateTouched?: boolean;
  timeError?: string;
  timeTouched?: boolean;
  workingHours: { start: string; end: string };
  slotDuration: number;
  bookedTimes: string[];
  blockedTimes: string[];
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
}

const generateSlots = (
  workingHours: { start: string; end: string },
  slotDuration: number,
): string[] => {
  const slots: string[] = [];
  const [startH, startM] = workingHours.start.split(':').map(Number);
  const [endH, endM] = workingHours.end.split(':').map(Number);
  const startMinutes = startH * 60 + (startM || 0);
  const endMinutes = endH * 60 + (endM || 0);
  for (let m = startMinutes; m < endMinutes; m += slotDuration) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(
      `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
    );
  }
  return slots;
};

export const AppointmentDateTimeFields = ({
  date,
  time,
  dateError,
  dateTouched,
  timeError,
  timeTouched,
  workingHours,
  slotDuration,
  bookedTimes,
  blockedTimes,
  onDateChange,
  onTimeChange,
}: Props) => {
  const isToday = date === today();
  const currentTime = nowTime();
  const slots = generateSlots(workingHours, slotDuration);

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <Label>Date *</Label>
        <DatePickerField
          value={date}
          onChange={onDateChange}
          minDate={today()}
          disablePast
          placeholder="Select appointment date"
        />
        <FormikFieldError error={dateError} touched={dateTouched} />
      </div>
      <div className="space-y-1.5">
        <Label>Time *</Label>
        <Select value={time} onValueChange={onTimeChange}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Select time" />
          </SelectTrigger>
          <SelectContent>
            {slots.map((slot) => {
              const taken = bookedTimes.includes(slot);
              const blocked = blockedTimes.includes(slot);
              const pastTime = isToday && slot <= currentTime;
              const disabled = blocked || pastTime;
              return (
                <SelectItem
                  key={slot}
                  value={slot}
                  disabled={disabled}
                  className="disabled:pointer-events-none disabled:opacity-50"
                >
                  {slot}{' '}
                  {blocked
                    ? '• Blocked'
                    : pastTime
                      ? '• Past'
                      : ''}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <FormikFieldError error={timeError} touched={timeTouched} />
      </div>
    </div>
  );
};
