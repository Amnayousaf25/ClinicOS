import { useReminderConfigs, useUpdateReminderConfig, useReminderLog } from '@/hooks/useApi';
import { PageSpinner } from '@/components/Spinner';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { MessageSquare, Send, Clock, CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import dayjs from 'dayjs';
import { useState } from 'react';

const typeMeta: Record<string, { label: string; color: string }> = {
  confirmation: { label: 'Upcoming Confirmation', color: 'bg-primary/15 text-primary' },
  '24h': { label: '24h Reminder', color: 'bg-info/15 text-info' },
  '2h': { label: 'Urgent Alert (2h Before Arrival)', color: 'bg-warning/15 text-warning' },
  late_reminder: { label: 'Late Alert', color: 'bg-destructive/15 text-destructive' },
  late_no_show_alert: { label: 'No-Show Alert', color: 'bg-destructive/15 text-destructive' },
  reschedule_notification: { label: 'Reschedule Notification', color: 'bg-secondary/15 text-secondary' },
  cancellation_notification: { label: 'Cancellation', color: 'bg-muted text-muted-foreground' },
};

/** Normalize backend status values to the two display categories. */
const normalizeStatus = (s: string): 'sent' | 'scheduled' => {
  if (s === 'delivered' || s === 'sent') return 'sent';
  return 'scheduled'; // pending, scheduled, etc.
};

const SmsReminders = () => {
  const { data: reminderConfigs = [], isLoading: configsLoading } = useReminderConfigs();
  const updateConfigMut = useUpdateReminderConfig();
  const { data: smsLog = [], isLoading: logLoading } = useReminderLog();
  const [filter, setFilter] = useState<'all' | 'sent' | 'scheduled'>('all');

  const filtered = smsLog.filter((e) => filter === 'all' || normalizeStatus(e.status) === filter);



  // Counts per communication type
  const urgentAlertCount = smsLog.filter((e) => e.type === '2h').length;
  const urgentAlertSent = smsLog.filter((e) => e.type === '2h' && normalizeStatus(e.status) === 'sent').length;
  const urgentAlertScheduled = smsLog.filter((e) => e.type === '2h' && normalizeStatus(e.status) === 'scheduled').length;

  const confirmationCount = smsLog.filter((e) => e.type === 'confirmation').length;
  const confirmationSent = smsLog.filter((e) => e.type === 'confirmation' && normalizeStatus(e.status) === 'sent').length;
  const confirmationScheduled = smsLog.filter((e) => e.type === 'confirmation' && normalizeStatus(e.status) === 'scheduled').length;

  const isLoading = configsLoading || logLoading;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        icon={MessageSquare}
        title="SMS Reminders & Communication"
        subtitle="Templates, log & configuration"
      />

      {isLoading && <PageSpinner padding="sm" />}

      {/* ── Communication Type Cards ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Urgent Alert Card */}
        <div className="relative overflow-hidden rounded-2xl p-6 border border-warning/25 card-3d group bg-gradient-to-br from-card via-card to-warning/5 hover:shadow-[0_0_30px_rgba(245,158,11,0.12)] transition-all duration-500">
          {/* Decorative circles */}
          <div className="absolute -top-6 -right-6 w-28 h-28 bg-warning/8 rounded-full group-hover:scale-[2] transition-transform duration-700" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-warning/5 rounded-full group-hover:scale-150 transition-transform duration-500 delay-100" />
          <div className="relative">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-warning/25 to-warning/10 flex items-center justify-center shadow-sm border border-warning/10">
                  <AlertTriangle className="w-6 h-6 text-warning drop-shadow-sm" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-foreground tracking-tight">Urgent Alert</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">2 Hours Before Arrival</p>
                </div>
              </div>
              <span className="text-3xl font-black text-warning/80 tabular-nums">{urgentAlertCount}</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-muted/40 mb-4 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-warning to-amber-400 transition-all duration-700"
                style={{ width: urgentAlertCount > 0 ? `${Math.round((urgentAlertSent / urgentAlertCount) * 100)}%` : '0%' }}
              />
            </div>
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                </div>
                <div>
                  <p className="text-lg font-black text-foreground leading-none tabular-nums">{urgentAlertSent}</p>
                  <p className="text-[9px] text-muted-foreground font-medium mt-0.5">Sent</p>
                </div>
              </div>
              <div className="w-px h-8 bg-border/50" />
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-warning" />
                </div>
                <div>
                  <p className="text-lg font-black text-foreground leading-none tabular-nums">{urgentAlertScheduled}</p>
                  <p className="text-[9px] text-muted-foreground font-medium mt-0.5">Scheduled</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Confirmation Card */}
        <div className="relative overflow-hidden rounded-2xl p-6 border border-primary/25 card-3d group bg-gradient-to-br from-card via-card to-primary/5 hover:shadow-[0_0_30px_rgba(99,102,241,0.12)] transition-all duration-500">
          {/* Decorative circles */}
          <div className="absolute -top-6 -right-6 w-28 h-28 bg-primary/8 rounded-full group-hover:scale-[2] transition-transform duration-700" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500 delay-100" />
          <div className="relative">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/10 flex items-center justify-center shadow-sm border border-primary/10">
                  <ShieldCheck className="w-6 h-6 text-primary drop-shadow-sm" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-foreground tracking-tight">Upcoming Confirmation</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Booking Confirmation SMS</p>
                </div>
              </div>
              <span className="text-3xl font-black text-primary/80 tabular-nums">{confirmationCount}</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-muted/40 mb-4 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-400 transition-all duration-700"
                style={{ width: confirmationCount > 0 ? `${Math.round((confirmationSent / confirmationCount) * 100)}%` : '0%' }}
              />
            </div>
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                </div>
                <div>
                  <p className="text-lg font-black text-foreground leading-none tabular-nums">{confirmationSent}</p>
                  <p className="text-[9px] text-muted-foreground font-medium mt-0.5">Sent</p>
                </div>
              </div>
              <div className="w-px h-8 bg-border/50" />
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-warning" />
                </div>
                <div>
                  <p className="text-lg font-black text-foreground leading-none tabular-nums">{confirmationScheduled}</p>
                  <p className="text-[9px] text-muted-foreground font-medium mt-0.5">Scheduled</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Log */}
      <div className="bg-card rounded-2xl card-3d border border-border/50 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-semibold text-foreground">Message Log</h2>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {(['all', 'sent', 'scheduled'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all ${filter === f ? 'bg-card text-foreground shadow-3d' : 'text-muted-foreground'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">No messages yet. Create a booking to fire one.</div>
          )}
          {filtered.map((e) => (
            <div key={e._id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${typeMeta[e.type]?.color || 'bg-muted text-muted-foreground'}`}>{typeMeta[e.type]?.label || e.type}</span>
                  <span className="text-sm font-semibold text-foreground">{e.patientName}</span>
                  <span className="text-xs text-muted-foreground">{e.patientPhone}</span>
                  {normalizeStatus(e.status) === 'sent' && <span className="text-[10px] text-success flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Sent {e.sentAt && dayjs(e.sentAt).format('HH:mm')}</span>}
                  {normalizeStatus(e.status) === 'scheduled' && <span className="text-[10px] text-warning flex items-center gap-1"><Clock className="w-3 h-3" />Scheduled</span>}
                  {e.reply === 'YES' && <span className="text-[10px] text-success font-bold">↩ YES</span>}
                  {e.reply === 'NO' && <span className="text-[10px] text-destructive font-bold">↩ NO</span>}
                </div>
              </div>
              <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">{e.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SmsReminders;
