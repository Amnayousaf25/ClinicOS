import { useReminderConfigs, useUpdateReminderConfig, useReminderLog } from '@/hooks/useApi';
import { PageSpinner } from '@/components/Spinner';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { MessageSquare, Send, Clock, CheckCircle2, XCircle, Phone} from 'lucide-react';
import dayjs from 'dayjs';
import { useState } from 'react';

const typeMeta: Record<string, { label: string; color: string }> = {
  confirmation: { label: 'Confirmation', color: 'bg-primary/15 text-primary' },
  '24h': { label: '24h Reminder', color: 'bg-info/15 text-info' },
  '2h': { label: '2h Reminder', color: 'bg-warning/15 text-warning' },
};

const SmsReminders = () => {
  const { data: reminderConfigs = [], isLoading: configsLoading } = useReminderConfigs();
  const updateConfigMut = useUpdateReminderConfig();
  const { data: smsLog = [], isLoading: logLoading } = useReminderLog();
  const [filter, setFilter] = useState<'all' | 'sent' | 'scheduled'>('all');

  const filtered = smsLog.filter((e) => filter === 'all' || e.status === filter);

  const counts = {
    sent: smsLog.filter((e) => e.status === 'sent').length,
    scheduled: smsLog.filter((e) => e.status === 'scheduled').length,
    replies: smsLog.filter((e) => e.reply).length,
  };

  const isLoading = configsLoading || logLoading;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        icon={MessageSquare}
        title="SMS Reminders"
        subtitle="Templates, log & configuration"
      />

      {isLoading && <PageSpinner padding="sm" />}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card rounded-2xl p-4 border border-border/50 card-3d">
          <div className="flex items-center gap-2 text-success"><CheckCircle2 className="w-4 h-4" /><p className="text-xs font-semibold">Sent</p></div>
          <p className="text-2xl font-bold text-foreground mt-1">{counts.sent}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border/50 card-3d">
          <div className="flex items-center gap-2 text-warning"><Clock className="w-4 h-4" /><p className="text-xs font-semibold">Scheduled</p></div>
          <p className="text-2xl font-bold text-foreground mt-1">{counts.scheduled}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border/50 card-3d">
          <div className="flex items-center gap-2 text-primary"><Phone className="w-4 h-4" /><p className="text-xs font-semibold">Replies</p></div>
          <p className="text-2xl font-bold text-foreground mt-1">{counts.replies}</p>
        </div>
      </div>

      {/* Reminder Configs */}
      {reminderConfigs.length > 0 && (
        <div className="bg-card rounded-2xl p-6 card-3d border border-border/50 space-y-4">
          <div>
            <h2 className="font-semibold text-foreground">Message Templates</h2>
            <p className="text-xs text-muted-foreground mt-1">Use <code className="bg-muted px-1 rounded">{'{name}'}</code>, <code className="bg-muted px-1 rounded">{'{date}'}</code>, <code className="bg-muted px-1 rounded">{'{time}'}</code>, <code className="bg-muted px-1 rounded">{'{clinic}'}</code>, <code className="bg-muted px-1 rounded">{'{link}'}</code></p>
          </div>
          {reminderConfigs.map((config) => (
            <div key={config._id} className="space-y-2 p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">{config.label || config.type}</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{config.enabled ? 'Enabled' : 'Disabled'}</span>
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(v) => updateConfigMut.mutate({ id: config._id, update: { enabled: v } })}
                  />
                </div>
              </div>
              <textarea
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground resize-none h-20"
                value={config.message || ''}
                onChange={(e) => updateConfigMut.mutate({ id: config._id, update: { message: e.target.value } })}
                disabled={!config.enabled}
              />
            </div>
          ))}
        </div>
      )}

      {/* Log */}
      <div className="bg-card rounded-2xl card-3d border border-border/50 overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
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
                  {e.status === 'sent' && <span className="text-[10px] text-success flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Sent {e.sentAt && dayjs(e.sentAt).format('HH:mm')}</span>}
                  {e.status === 'scheduled' && <span className="text-[10px] text-warning flex items-center gap-1"><Clock className="w-3 h-3" />Scheduled</span>}
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
