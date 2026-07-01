import { useState } from 'react';
import DashboardLayout from '@/layout/DashboardLayout';

import { TagsCrmsNavItemId } from '@/types/crmTags.types';
import CrmTagsSidePanal from '@/components/sidePanals/crmTags/CrmTagsSidePanal';
import AllTagTableList from '@/tables/CRMTags/AllTagsTableList';
import CampaignTagsTableList from '@/tables/CRMTags/CampaignTagsTableList';
import SegmentTagsTableList from '@/tables/CRMTags/SegmentTagsTableList';
import TemplateTagsTableList from '@/tables/CRMTags/TemplateTagsTableList';
import CustomTriggerTagsTableList from '@/tables/CRMTags/CustomTriggerTagsTableList';

const CrmTags = () => {
  const [activeSection, setActiveSection] = useState<TagsCrmsNavItemId>('all-crm-tags');

  const renderPanel = () => {
    switch (activeSection) {
      case 'all-crm-tags':
        return <AllTagTableList />;
      case 'campaign-crm-tags':
        return <CampaignTagsTableList />;
      case 'segment-crm-tags':
        return <SegmentTagsTableList />;
      case 'template-crm-tags':
        return <TemplateTagsTableList />;
      case 'custom-trigger-crm-tags':
        return <CustomTriggerTagsTableList />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full flex min-h-screen  text-slate-200 p-4">
        <CrmTagsSidePanal activeSection={activeSection} onSelect={setActiveSection} />
        <main className="flex-1 overflow-y-auto">{renderPanel()}</main>
      </div>
    </DashboardLayout>
  );
};

export default CrmTags;
