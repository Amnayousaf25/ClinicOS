import { useState } from 'react';
import { Settings } from 'lucide-react';
import { PageSpinner } from '@/components/Spinner';
import { PageHeader } from '@/components/PageHeader';
import { useClinicSettings } from '@/hooks/useApi';
import {
  SettingsTabs,
  type SettingsTabId,
} from '@/components/settings/SettingsTabs';
import { ClinicTab } from '@/components/settings/ClinicTab';
import { ServicesTab } from '@/components/settings/ServicesTab';
import { ProvidersTab } from '@/components/settings/ProvidersTab';
import { BlockedSlotsTab } from '@/components/settings/BlockedSlotsTab';
import { InsuranceTab } from '@/components/settings/InsuranceTab';
import { SmsTemplatesTab } from '@/components/settings/SmsTemplatesTab';

const TAB_CONTENT: Record<SettingsTabId, React.ComponentType> = {
  clinic: ClinicTab,
  services: ServicesTab,
  providers: ProvidersTab,
  blocked: BlockedSlotsTab,
  insurance: InsuranceTab,
  sms: SmsTemplatesTab,
};

const SettingsPage = () => {
  const { isLoading } = useClinicSettings();
  const [activeTab, setActiveTab] = useState<SettingsTabId>('clinic');

  if (isLoading) return <PageSpinner />;

  const ActiveTab = TAB_CONTENT[activeTab];

  return (
    <div className="animate-fade-in space-y-6 max-w-3xl">
      <PageHeader icon={Settings} title="Settings" />
      <SettingsTabs value={activeTab} onChange={setActiveTab} />
      <ActiveTab />
    </div>
  );
};

export default SettingsPage;
