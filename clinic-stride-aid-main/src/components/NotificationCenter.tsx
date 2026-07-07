import { useState } from 'react';
import { Bell, Calendar, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { Notification } from '@/types';

dayjs.extend(relativeTime);

const defaultNotifications: Notification[] = [
  { id: '1', type: 'appointment', title: 'New Booking', message: 'Sarah Chen booked a Consultation for today at 9:00 AM', time: dayjs().subtract(12, 'minute').toISOString(), read: false },
  { id: '2', type: 'intake', title: 'Intake Form Submitted', message: 'Emily Rodriguez completed her intake form', time: dayjs().subtract(35, 'minute').toISOString(), read: false },
  { id: '3', type: 'reminder', title: 'SMS Reminder Sent', message: '24h reminder sent to Ava Williams for tomorrow', time: dayjs().subtract(1, 'hour').toISOString(), read: false },
  { id: '4', type: 'system', title: 'Appointment Cancelled', message: 'Michael Thompson cancelled his 10:30 AM consultation', time: dayjs().subtract(2, 'hour').toISOString(), read: true },
  { id: '5', type: 'appointment', title: 'Patient Arrived', message: 'Olivia Park checked in for Dermatology at 11:00 AM', time: dayjs().subtract(3, 'hour').toISOString(), read: true },
  { id: '6', type: 'reminder', title: 'SMS Delivery Failed', message: 'Could not deliver 2h reminder to Daniel Kim', time: dayjs().subtract(4, 'hour').toISOString(), read: true },
  { id: '7', type: 'intake', title: 'Intake Form Pending', message: 'James Miller has not completed his intake form — appointment in 30 min', time: dayjs().subtract(5, 'hour').toISOString(), read: true },
];

const typeIcons = {
  appointment: Calendar,
  intake: FileText,
  reminder: CheckCircle,
  system: AlertCircle,
};

const typeColors = {
  appointment: 'bg-primary/10 text-primary',
  intake: 'bg-secondary/10 text-secondary',
  reminder: 'bg-success/10 text-success',
  system: 'bg-warning/10 text-warning',
};

const NotificationCenter = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(defaultNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-10 h-10 rounded-xl flex items-center justify-center bg-card border border-border hover:bg-muted transition-colors btn-3d"
      >
        <Bell className="w-5 h-5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 w-96 bg-card rounded-2xl shadow-3d-hover border border-border z-50 overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary hover:underline font-medium">
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((n) => {
                const Icon = typeIcons[n.type];
                return (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={cn(
                      'w-full text-left flex gap-3 p-4 border-b border-border last:border-0 hover:bg-muted/50 transition-colors',
                      !n.read && 'bg-primary/[0.03]'
                    )}
                  >
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', typeColors[n.type])}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn('text-sm font-medium text-foreground', !n.read && 'font-semibold')}>{n.title}</p>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{dayjs(n.time).fromNow()}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
