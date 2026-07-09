import { useState } from 'react';
import { PageSpinner, Spinner } from '@/components/Spinner';
import { PageHeader } from '@/components/PageHeader';
import { useAppointments, useClinicSettings } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarDays} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { statusBgColor } from '@/lib/appointmentStatus';
import { patientName, serviceName } from '@/lib/appointmentDisplay';
import dayjs from 'dayjs';

const CalendarView = () => {
  const { data: appointments = [], isLoading: aptsLoading } = useAppointments();
  const { data: settings, isLoading: settingsLoading } = useClinicSettings();
  const [weekStart, setWeekStart] = useState(() => dayjs().startOf('week').add(1, 'day'));

  const workingHours = settings?.workingHours ?? { start: '08:00', end: '17:00' };
  const slotDuration = settings?.slotDuration ?? 30;

  const days = Array.from({ length: 5 }, (_, i) => weekStart.add(i, 'day'));
  const [startH] = workingHours.start.split(':').map(Number);
  const [endH] = workingHours.end.split(':').map(Number);
  const hours = Array.from({ length: endH - startH }, (_, i) => startH + i);

  const getAppointments = (date: string, hour: number) =>
    appointments.filter(
      (a) => a.date === date && serviceName(a) !== 'Registration' && parseInt(a.time.split(':')[0]) === hour
    );

  if (settingsLoading) return <PageSpinner />;

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader
        icon={CalendarDays}
        title="Calendar"
        subtitle={`${weekStart.format('MMM D')} — ${weekStart.add(4, 'day').format('MMM D, YYYY')}`}
        actions={
          <>
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => setWeekStart((w) => w.subtract(7, 'day'))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="rounded-lg text-xs h-8" onClick={() => setWeekStart(dayjs().startOf('week').add(1, 'day'))}>
              Today
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => setWeekStart((w) => w.add(7, 'day'))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        }
      />

      {aptsLoading && (
        <div className="flex items-center justify-center py-8">
          <Spinner size="sm" />
        </div>
      )}

      <div className="bg-card rounded-2xl card-3d border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: 640 }}>
            <thead>
              <tr>
                <th className="w-16 p-2 border-b border-r border-border bg-muted/30" />
                {days.map((d) => {
                  const isToday = d.isSame(dayjs(), 'day');
                  return (
                    <th key={d.toString()} className={`p-2 border-b border-r border-border last:border-r-0 text-center ${isToday ? 'bg-primary/5' : 'bg-muted/30'}`}>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">{d.format('ddd')}</p>
                      <p className={`text-sm font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>{d.format('D')}</p>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {hours.map((hour) => (
                <tr key={hour}>
                  <td className="p-1 pr-2 text-right text-[10px] font-medium text-muted-foreground border-r border-border align-top pt-2 whitespace-nowrap">
                    {`${hour}:00`}
                  </td>
                  {days.map((d) => {
                    const dateStr = d.format('YYYY-MM-DD');
                    const apts = getAppointments(dateStr, hour);
                    const isToday = d.isSame(dayjs(), 'day');
                    return (
                      <td key={dateStr} className={`border-r border-b border-border last:border-r-0 p-0.5 align-top h-12 ${isToday ? 'bg-primary/[0.02]' : ''}`}>
                        {apts.map((apt) => (
                          <Tooltip key={apt._id}>
                            <TooltipTrigger asChild>
                              <div
                                className={`flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] leading-tight mb-0.5 hover:bg-muted transition-colors cursor-default ${
                                  apt.status === 'cancelled' ? 'bg-destructive/10 line-through opacity-60' : 'bg-muted/60'
                                }`}
                              >
                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusBgColor[apt.status]}`} />
                                <span className="font-semibold text-foreground truncate">{apt.time}</span>
                                <span className="text-muted-foreground truncate hidden xl:inline">{patientName(apt).split(' ')[0] || '—'}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-semibold">{patientName(apt)}</p>
                              <p className="text-xs">{serviceName(apt)} · {apt.status}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 px-1">
        {[['confirmed', 'Confirmed'], ['pending', 'Pending'], ['cancelled', 'Cancelled'], ['no-show', 'No-show'], ['arrived', 'Arrived']].map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <div className={`w-2 h-2 rounded-full ${statusBgColor[key as keyof typeof statusBgColor]}`} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarView;
