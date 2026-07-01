import { useState, type FC } from 'react';
import DashboardLayout from '@/layout/DashboardLayout';
import PageHeaderBreadcrumb from '@/components/PageHeaderBreadcrumb';
import AdminOnly from '@/components/AdminOnly';
import { CasinoCatalogTabType } from '@/types/casinoCatalog.types';
import CasinoCatalogGamesTableList from '@/tables/casinoCatalog/CasinoCatalogGamesTableList';
import CasinoCatalogCategoriesTableList from '@/tables/casinoCatalog/CasinoCatalogCategoriesTableList';
import CasinoCatalogProvidersTableList from '@/tables/casinoCatalog/CasinoCatalogProvidersTableList';

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS: { key: CasinoCatalogTabType; label: string }[] = [
  { key: 'games', label: 'Games' },
  { key: 'categories', label: 'Categories' },
  { key: 'providers', label: 'Providers' },
];

const CasinoCatalogPage: FC = () => {
  const [activeTab, setActiveTab] = useState<CasinoCatalogTabType>('games');

  /**
   * Each tab has its own "is the Create modal open?" flag.
   * The parent owns this flag; clicking "Create New" sets it true.
   * Each table component calls onCreateModalClose() when it closes the modal
   * (either by cancel, backdrop click, or successful save), which resets the flag.
   */
  const [isGamesCreateOpen, setIsGamesCreateOpen] = useState(false);
  const [isCategoriesCreateOpen, setIsCategoriesCreateOpen] = useState(false);
  const [isProvidersCreateOpen, setIsProvidersCreateOpen] = useState(false);

  const handleCreateNew = () => {
    if (activeTab === 'games') setIsGamesCreateOpen(true);
    else if (activeTab === 'categories') setIsCategoriesCreateOpen(true);
    else if (activeTab === 'providers') setIsProvidersCreateOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="p-4 w-full">
        <div className="w-full flex items-center justify-between mb-4">
          <PageHeaderBreadcrumb
            title="Casino"
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

        <div className={activeTab === 'games' ? 'block' : 'hidden'}>
          <CasinoCatalogGamesTableList
            isCreateModalOpen={isGamesCreateOpen}
            onCreateModalClose={() => setIsGamesCreateOpen(false)}
          />
        </div>

        <div className={activeTab === 'categories' ? 'block' : 'hidden'}>
          <CasinoCatalogCategoriesTableList
            isCreateModalOpen={isCategoriesCreateOpen}
            onCreateModalClose={() => setIsCategoriesCreateOpen(false)}
          />
        </div>

        <div className={activeTab === 'providers' ? 'block' : 'hidden'}>
          <CasinoCatalogProvidersTableList
            isCreateModalOpen={isProvidersCreateOpen}
            onCreateModalClose={() => setIsProvidersCreateOpen(false)}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CasinoCatalogPage;
