import { useState, type FC } from 'react';
import DashboardLayout from '@/layout/DashboardLayout';
import PageHeaderBreadcrumb from '@/components/PageHeaderBreadcrumb';
import CampaignsAnalyticsTab from './CampaignsAnalyticsTab';
import HistoryTab from './HistoryTab';

type Tab = 'campaigns' | 'history';

const AnalyticsPage: FC = () => {
  const [tab, setTab] = useState<Tab>('campaigns');

  return (
    <DashboardLayout>
      <div className="px-4 w-full">
        <div className="mb-4">
          <PageHeaderBreadcrumb
            title="Analytics"
            items={[
              { label: 'Home', clickable: true },
              { label: 'CRM' },
              { label: 'Campaigns' },
              { label: 'Analytics' },
            ]}
          />
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('campaigns')}
            className={`px-5 py-2 rounded-full text-sm ${
              tab === 'campaigns'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Campaigns
          </button>
          <button
            onClick={() => setTab('history')}
            className={`px-5 py-2 rounded-full text-sm ${
              tab === 'history'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            History
          </button>
        </div>

        {tab === 'campaigns' ? <CampaignsAnalyticsTab /> : <HistoryTab />}
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
