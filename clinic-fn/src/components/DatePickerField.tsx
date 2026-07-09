import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import { CalendarDays } from 'lucide-react';

interface DatePickerFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disableFuture?: boolean;
  disablePast?: boolean;
  minDate?: string;
  maxDate?: string;
  className?: string;
  /** Show year/month dropdowns in the calendar header — useful for DOB
   *  fields where users need to jump back many years quickly. */
  showYearDropdown?: boolean;
}

const toDate = (value: string) => {
  if (!value) return undefined;
  const parsed = dayjs(value, 'YYYY-MM-DD', true);
  return parsed.isValid() ? parsed.toDate() : undefined;
};

const DatePickerField = ({
  value,
  onChange,
  placeholder = 'Select date',
  disableFuture = false,
  disablePast = false,
  minDate,
  maxDate,
  className,
  showYearDropdown = false,
}: DatePickerFieldProps) => {
  const [open, setOpen] = useState(false);
  const selectedDate = toDate(value);
  const today = dayjs().endOf('day').toDate();
  const minDateValue = toDate(minDate || '');
  const maxDateValue = toDate(maxDate || '');
  const currentYear = dayjs().year();
  // 120 years back covers any plausible DOB; only used when dropdown enabled.
  const dropdownFromYear = currentYear - 120;
  const dropdownToYear = disableFuture ? currentYear : currentYear + 5;

  const isDisabled = (date: Date) => {
    const d = dayjs(date);
    if (disableFuture && d.isAfter(today)) return true;
    if (disablePast && d.isBefore(dayjs().startOf('day'))) return true;
    if (minDateValue && d.isBefore(dayjs(minDateValue).startOf('day'))) return true;
    if (maxDateValue && d.isAfter(dayjs(maxDateValue).endOf('day'))) return true;
    return false;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'w-full justify-between rounded-xl border-input bg-background px-3 font-normal text-left hover:bg-background hover:text-foreground',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <span className="min-w-0 truncate">
            {value ? dayjs(value).format('MMMM D, YYYY') : placeholder}
          </span>
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(20rem,calc(100vw-2rem))] p-0 overflow-x-hidden"
        align="start"
        collisionPadding={16}
        // Prevent auto-focus from moving into the Portal when this Popover
        // is nested inside a Radix Dialog. The Dialog's FocusTrap would
        // reclaim focus, triggering DismissableLayer to close the Popover.
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate}
          onSelect={(date) => {
            onChange(date ? dayjs(date).format('YYYY-MM-DD') : '');
            if (date) setOpen(false);
          }}
          disabled={isDisabled}
          captionLayout={showYearDropdown ? 'dropdown' : undefined}
          fromYear={showYearDropdown ? dropdownFromYear : undefined}
          toYear={showYearDropdown ? dropdownToYear : undefined}
          classNames={{
            month: 'space-y-3 w-full',
            table: 'w-full border-collapse',
            head_row: 'grid grid-cols-7',
            head_cell:
              'text-muted-foreground rounded-md text-center font-normal text-[0.75rem]',
            row: 'grid grid-cols-7 w-full mt-1',
            cell:
              'aspect-square text-center text-sm p-0 relative focus-within:relative focus-within:z-20',
            day: 'h-8 w-8 sm:h-9 sm:w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-muted hover:text-foreground',
            ...(showYearDropdown
              ? {
                  caption_label: 'hidden',
                  caption_dropdowns:
                    'flex items-center justify-center gap-2 pt-1',
                  vhidden: 'sr-only',
                  dropdown:
                    'h-8 rounded-md border border-input bg-background px-2 text-sm font-medium hover:bg-muted cursor-pointer outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                }
              : {}),
          }}
        />
      </PopoverContent>
    </Popover>
  );
};

export default DatePickerField;
