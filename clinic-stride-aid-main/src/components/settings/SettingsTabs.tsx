import { Settings, Stethoscope, UserCog, Ban, ShieldCheck, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SettingsTabId =
  | 'clinic'
  | 'services'
  | 'providers'
  | 'blocked'
  | 'insurance'
  | 'sms';

const TABS: ReadonlyArray<{ id: SettingsTabId; label: string; icon: LucideIcon }> = [
  { id: 'clinic', label: 'Clinic', icon: Settings },
  { id: 'services', label: 'Services', icon: Stethoscope },
  { id: 'providers', label: 'Providers', icon: UserCog },
  { id: 'blocked', label: 'Blocked Slots', icon: Ban },
  { id: 'insurance', label: 'Insurance', icon: ShieldCheck },
  { id: 'sms', label: 'SMS Templates', icon: Settings },
];

interface Props {
  value: SettingsTabId;
  onChange: (next: SettingsTabId) => void;
}

export const SettingsTabs = ({ value, onChange }: Props) => (
  <div className="flex flex-nowrap gap-1 bg-muted rounded-xl p-1 overflow-x-auto">
    {TABS.map((t) => (
      <button
        key={t.id}
        type="button"
        onClick={() => onChange(t.id)}
        className={cn(
          'flex shrink-0 items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
          value === t.id
            ? 'bg-card text-foreground shadow-3d'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <t.icon className="w-4 h-4" />
        {t.label}
      </button>
    ))}
  </div>
);
