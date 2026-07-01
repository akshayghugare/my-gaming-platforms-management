import { useEffect, useState, type FC } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import DashboardLayout from '@/layout/DashboardLayout';
import apiService from '@/services/api';
import PlayerLeftPanel from '@/components/players/PlayerLeftPanel';
import PersonalizationTab from '@/components/players/tabs/PersonalizationTab';
import CampaignHistoryTab from '@/components/players/tabs/CampaignHistoryTab';
import GamificationTab from '@/components/players/tabs/GamificationTab';
import PlayerDataTab from '@/components/players/tabs/PlayerDataTab';
import AccountInformationTab from '@/components/players/tabs/AccountInformationTab';
import type { ApiError } from '@/types';
import type { Player } from '@/types/player.types';

const TABS = [
  'Personalization',
  'Campaign History',
  'Gamification',
  'Player Data',
  'Account Information',
] as const;

type Tab = (typeof TABS)[number];

const PlayerProfilePage: FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('Personalization');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await apiService.get<Player>(`/players/${id}`);
        if (res?.success && res?.data) setPlayer(res.data);
      } catch (err) {
        console.error('Get player error:', err as ApiError);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <DashboardLayout>
      <div className="px-4 py-4 w-full">
        <button
          onClick={() => navigate('/players')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-4"
        >
          <ArrowLeft size={16} /> Back to Players
        </button>

        {loading ? (
          <p className="text-center text-slate-400 py-20">Loading player…</p>
        ) : !player ? (
          <p className="text-center text-slate-400 py-20">Player not found</p>
        ) : (
          <div className="flex gap-4 items-start">
            <PlayerLeftPanel player={player} />

            <div className="flex-1 min-w-0">
              {/* Tab bar */}
              <div className="flex flex-wrap gap-2 mb-5">
                {TABS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-4 py-1.5 rounded-full text-sm ${
                      tab === t
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="bg-slate-900/40 rounded-lg p-4">
                {tab === 'Personalization' && <PersonalizationTab player={player} />}
                {tab === 'Campaign History' && <CampaignHistoryTab playerId={player.id} />}
                {tab === 'Gamification' && <GamificationTab playerId={player.id} />}
                {tab === 'Player Data' && <PlayerDataTab player={player} />}
                {tab === 'Account Information' && <AccountInformationTab playerId={player.id} />}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PlayerProfilePage;
