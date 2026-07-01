import { useState } from 'react';
import DashboardLayout from '@/layout/DashboardLayout';

import MediaDatabaseSidePanal from '@/components/sidePanals/mediaDatabase/MediaDatabaseSidePanal';
import { MediaDatabaseNavItemId } from '@/types/medaiDatabase.types';
import AllMediaDatabase from '@/pages/mediaDatabase/AllMediaDatabase';
import BannersMediaDatabase from './BannersMediaDatabase';
import BoosterImageMediaDatabase from './BoosterImageMediaDatabase';
import EmailTemplateAssetsMediaDatabase from './EmailTemplateAssetsMediaDatabase';
import MissionBundleMediaDatabase from './MissionBundleMediaDatabase';
import MissionBannerMediaDatabase from './MissionBannerMediaDatabase';
import TemplateMediaDatabase from './TemplatedMediaDatabase';

const MediaDatabase = () => {
  const [activeSection, setActiveSection] = useState<MediaDatabaseNavItemId>('all-media-database');

  const renderPanel = () => {
    switch (activeSection) {
      case 'all-media-database':
        return <AllMediaDatabase />;
      case 'media-database-banners':
        return <BannersMediaDatabase />;
      case 'media-database-booster-images':
        return <BoosterImageMediaDatabase />;
      case 'media-database-email-templates-assets':
        return <EmailTemplateAssetsMediaDatabase />;
      case 'media-database-joy-saha':
        return <EmailTemplateAssetsMediaDatabase />;
      case 'media-database-mission-bundles':
        return <MissionBundleMediaDatabase />;
      case 'media-database-mission-banner':
        return <MissionBannerMediaDatabase />;
      case 'media-database-template':
        return <TemplateMediaDatabase />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full flex min-h-screen  text-slate-200 p-4">
        <MediaDatabaseSidePanal activeSection={activeSection} onSelect={setActiveSection} />
        <main className="flex-1 overflow-y-auto">{renderPanel()}</main>
      </div>
    </DashboardLayout>
  );
};

export default MediaDatabase;
