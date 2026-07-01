import { useState } from 'react';
import { NavItemId } from '@/types/systemSettings.types';
import CoreFeaturesPanel from '@/components/systemSettings/CoreFeaturesPanel';
import GamificationPanel from '@/components/systemSettings/GamificationPanel';
import MissionPanel from '@/components/systemSettings/MissionsPanel';
import CRMPanel from '@/components/systemSettings/CRMPanel';
import PlatformIntegrationPanel from '@/components/systemSettings/PlatformIntegrationPanel';
import EmailConfigurationPanel from '@/components/systemSettings/EmailConfigurationPanel';
import WidgetsPanel from '@/components/systemSettings/WidgetsPanel';
import SystemSettingsSidePanel from '@/components/sidePanals/systemSettings/SystemSettingsSidePanel';
import DashboardLayout from '@/layout/DashboardLayout';

const SystemSettings = () => {
  const [activeSection, setActiveSection] = useState<NavItemId>('core-features');

  const renderPanel = () => {
    switch (activeSection) {
      case 'core-features':
        return <CoreFeaturesPanel />;
      case 'gamification':
        return <GamificationPanel />;
      case 'missions':
        return <MissionPanel />;
      case 'crm':
        return <CRMPanel />;
      case 'platform-integration':
        return <PlatformIntegrationPanel />;
      case 'email-smtp':
        return <EmailConfigurationPanel />;
      case 'widgets':
        return <WidgetsPanel />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full flex min-h-screen  text-slate-200 p-4">
        <SystemSettingsSidePanel activeSection={activeSection} onSelect={setActiveSection} />
        <main className="flex-1 overflow-y-auto">{renderPanel()}</main>
      </div>
    </DashboardLayout>
  );
};

export default SystemSettings;
