import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { useClinicSettings, useUpdateSettings } from '@/hooks/useApi';

export const SmsTemplatesTab = () => {
  const { data: settings } = useClinicSettings();
  const updateMut = useUpdateSettings();
  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings?.smsTemplates) setDraft(settings.smsTemplates);
  }, [settings]);

  if (!settings) return null;

  const handleBlur = (key: string) => {
    if (!settings.smsTemplates) return;
    const prev = settings.smsTemplates[key as keyof typeof settings.smsTemplates] || '';
    const next = draft[key] ?? '';
    if (next === prev) return;
    updateMut.mutate({
      smsTemplates: { ...settings.smsTemplates, ...draft, [key]: next },
    });
  };

  return (
    <div className="bg-card rounded-2xl p-6 card-3d border border-border/50 space-y-4">
      <h2 className="font-semibold text-foreground">SMS Templates</h2>
      {(Object.entries(settings.smsTemplates) as [string, string][]).map(
        ([key, value]) => (
          <div key={key} className="space-y-2">
            <Label className="capitalize">
              {key.replace(/([A-Z])/g, ' $1')}
            </Label>
            <textarea
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground resize-none h-20"
              value={draft[key] ?? value}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, [key]: e.target.value }))
              }
              onBlur={() => handleBlur(key)}
            />
          </div>
        ),
      )}
    </div>
  );
};
