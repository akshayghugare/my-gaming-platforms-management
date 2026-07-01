import { useState, type FC } from 'react';
import DashboardLayout from '@/layout/DashboardLayout';
import PageHeaderBreadcrumb from '@/components/PageHeaderBreadcrumb';
import AdminOnly from '@/components/AdminOnly';
import { SportsCatalogTabType } from '@/types/sportsCatalog.types';
import SportsCatalogSportsTableList from '@/tables/sportCatalog/SportsCatalogSportsTableList';
import SportsCatalogTeamesTableList from '@/tables/sportCatalog/SportsCatalogTeamesTableList';
import SportsCatalogTournametsTableList from '@/tables/sportCatalog/SportsCatalogTournamentsTableList';
import SportsCatalogMarketsTableList from '@/tables/sportCatalog/SportsCatalogMarketsTableList';

const TABS: { key: SportsCatalogTabType; label: string }[] = [
  { key: 'sports', label: 'Sports' },
  { key: 'teams', label: 'Teams' },
  { key: 'tournamets', label: 'Tournamets' },
  { key: 'markets', label: 'Markets' },
];

const SportsCatalogPage: FC = () => {
  const [activeTab, setActiveTab] = useState<SportsCatalogTabType>('sports');
  const [isSportCreateOpen, setIsSportCreateOpen] = useState(false);
  const [isTeamsCreateOpen, setIsTeamsCreateOpen] = useState(false);
  const [isTournamentsCreateOpen, setIsTournamentsCreateOpen] = useState(false);
  const [isMarketsCreateOpen, setIsMarketsCreateOpen] = useState(false);

  const handleCreateNew = () => {
    if (activeTab === 'sports') setIsSportCreateOpen(true);
    else if (activeTab === 'teams') setIsTeamsCreateOpen(true);
    else if (activeTab === 'tournamets') setIsTournamentsCreateOpen(true);
    else if (activeTab === 'markets') setIsMarketsCreateOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="p-4 w-full">
        <div className="w-full flex items-center justify-between mb-4">
          <PageHeaderBreadcrumb
            title="Sports"
            items={[
              { label: 'Home', clickable: true },
              { label: 'Casino & Sports Catalog', clickable: true },
              { label: 'Casino' },
            ]}
          />

          <AdminOnly>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 border border-slate-600 px-4 py-2 rounded text-sm text-slate-200 hover:bg-slate-700 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Import CSV
              </button>
              <button
                onClick={handleCreateNew}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm text-white transition-colors"
              >
                Create New
              </button>
            </div>
          </AdminOnly>
        </div>

        <div className="flex gap-2 mb-5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={activeTab === 'sports' ? 'block' : 'hidden'}>
          <SportsCatalogSportsTableList
            isCreateModalOpen={isSportCreateOpen}
            onCreateModalClose={() => setIsSportCreateOpen(false)}
          />
        </div>

        <div className={activeTab === 'teams' ? 'block' : 'hidden'}>
          <SportsCatalogTeamesTableList
            isCreateModalOpen={isTeamsCreateOpen}
            onCreateModalClose={() => setIsTeamsCreateOpen(false)}
          />
        </div>

        <div className={activeTab === 'tournamets' ? 'block' : 'hidden'}>
          <SportsCatalogTournametsTableList
            isCreateModalOpen={isTournamentsCreateOpen}
            onCreateModalClose={() => setIsTournamentsCreateOpen(false)}
          />
        </div>
        <div className={activeTab === 'markets' ? 'block' : 'hidden'}>
          <SportsCatalogMarketsTableList
            isCreateModalOpen={isMarketsCreateOpen}
            onCreateModalClose={() => setIsMarketsCreateOpen(false)}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SportsCatalogPage;
