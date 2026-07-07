import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Clock, Sun, Sunrise, Sunset } from 'lucide-react';

interface TimePickerFieldProps {
  value: string;
  onChange: (value: string) => void;
  slots: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const formatLabel = (slot: string) => {
  const [h, m] = slot.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
};

const groupSlots = (slots: string[]) => {
  const morning: string[] = [];
  const afternoon: string[] = [];
  const evening: string[] = [];
  for (const s of slots) {
    const h = Number(s.split(':')[0]);
    if (h < 12) morning.push(s);
    else if (h < 17) afternoon.push(s);
    else evening.push(s);
  }
  return { morning, afternoon, evening };
};

const TimePickerField = ({
  value,
  onChange,
  slots,
  placeholder = 'Select time',
  disabled,
  className,
}: TimePickerFieldProps) => {
  const [open, setOpen] = useState(false);
  const groups = useMemo(() => groupSlots(slots), [slots]);

  const handleSelect = (slot: string) => {
    onChange(slot);
    setOpen(false);
  };

  const renderGroup = (
    title: string,
    Icon: typeof Sun,
    groupSlots: string[],
  ) => {
    if (!groupSlots.length) return null;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <Icon className="h-3 w-3" />
          {title}
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {groupSlots.map((slot) => {
            const selected = slot === value;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => handleSelect(slot)}
                className={cn(
                  'h-8 rounded-lg text-xs font-medium transition-colors border',
                  selected
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-background text-foreground border-border hover:bg-muted hover:border-primary/40',
                )}
              >
                {formatLabel(slot)}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-between rounded-xl border-input bg-background px-3 font-normal text-left hover:bg-background hover:text-foreground',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <span>{value ? formatLabel(value) : placeholder}</span>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-4 space-y-4" align="start">
        {slots.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No available slots
          </p>
        ) : (
          <>
            {renderGroup('Morning', Sunrise, groups.morning)}
            {renderGroup('Afternoon', Sun, groups.afternoon)}
            {renderGroup('Evening', Sunset, groups.evening)}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default TimePickerField;
