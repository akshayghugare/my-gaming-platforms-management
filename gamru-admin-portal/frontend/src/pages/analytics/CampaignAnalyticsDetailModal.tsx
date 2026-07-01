import { useEffect, useState, type FC } from 'react';
import { X } from 'lucide-react';
import apiService from '@/services/api';
import type { ApiError } from '@/types';
import type { ChannelMetrics, CampaignHistoryRow } from '@/types/analytics.types';
import { CHANNEL_LABEL } from '@/types/analytics.types';

interface DetailData {
  id: string;
  name: string;
  type: string;
  status: string;
  metrics: {
    email: ChannelMetrics;
    sms: ChannelMetrics;
    web_push: ChannelMetrics;
    onsite: ChannelMetrics;
  };
  recent_history: CampaignHistoryRow[];
}

interface Props {
  campaignId: string;
  onClose: () => void;
}

const MetricCard: FC<{ title: string; m: ChannelMetrics; showParts?: boolean }> = ({
  title,
  m,
  showParts,
}) => (
  <div className="bg-slate-800/60 border border-slate-700 rounded-md p-4">
    <h4 className="text-sm font-semibold text-slate-200 mb-3">{title}</h4>
    <div className="grid grid-cols-2 gap-2 text-sm">
      <span className="text-slate-400">Sent</span>
      <span className="text-right">{m.sent}</span>
      <span className="text-slate-400">Delivered</span>
      <span className="text-right">{m.delivered}</span>
      <span className="text-slate-400">Opened</span>
      <span className="text-right">{m.opened}</span>
      <span className="text-slate-400">Clicked</span>
      <span className="text-right">{m.clicked}</span>
      {showParts && (
        <>
          <span className="text-slate-400">SMS Parts</span>
          <span className="text-right">{m.sms_parts}</span>
        </>
      )}
    </div>
  </div>
);

const CampaignAnalyticsDetailModal: FC<Props> = ({ campaignId, onClose }) => {
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const response = await apiService.get<DetailData>(`/analytics/campaigns/${campaignId}`);
        if (response?.success && response?.data) {
          setData(response.data);
        }
      } catch (err) {
        console.error('Analytics detail error:', err as ApiError);
      } finally {
        setLoading(false);
      }
    })();
  }, [campaignId]);

  return (
    <div
      className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-md w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-bold text-lg">{loading ? 'Loading...' : data?.name} — Analytics</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-700">
            <X size={18} />
          </button>
        </div>

        {data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <MetricCard title="Email" m={data.metrics.email} />
              <MetricCard title="SMS" m={data.metrics.sms} showParts />
              <MetricCard title="Web Push Notification" m={data.metrics.web_push} />
              <MetricCard title="On-site Notification" m={data.metrics.onsite} />
            </div>

            <h3 className="text-sm font-semibold text-slate-200 mb-2">Recent Events</h3>
            <div className="overflow-x-auto border border-slate-700 rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Player ID</th>
                    <th className="p-2 text-left">Channel</th>
                    <th className="p-2 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_history.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-400">
                        No events recorded
                      </td>
                    </tr>
                  ) : (
                    data.recent_history.map((h) => (
                      <tr key={h.id} className="border-t border-slate-700">
                        <td className="p-2 capitalize">{h.status.toLowerCase()}</td>
                        <td className="p-2 text-xs">{h.player_id}</td>
                        <td className="p-2">{CHANNEL_LABEL[h.channel]}</td>
                        <td className="p-2 text-xs">{new Date(h.event_date).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CampaignAnalyticsDetailModal;
