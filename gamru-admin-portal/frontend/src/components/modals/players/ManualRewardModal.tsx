import { useState, type FC } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import apiService from '@/services/api';
import type { ApiError } from '@/types';
import { REWARD_TYPE_OPTIONS } from '@/types/player.types';

interface Props {
  playerId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ManualRewardModal: FC<Props> = ({ playerId, onClose, onSuccess }) => {
  const [rewardType, setRewardType] = useState('');
  const [reward, setReward] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!rewardType) {
      setError('Reward Type is required');
      return;
    }
    try {
      setSaving(true);
      const res = await apiService.post(`/players/${playerId}/rewards`, {
        reward_type: rewardType,
        reward: reward || null,
      });
      if (res?.success) {
        toast.success(res.message || 'Manual reward added');
        onSuccess();
        onClose();
      }
    } catch (err) {
      toast.error((err as ApiError).message || 'Failed to add reward');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 p-6 rounded-lg w-full max-w-sm border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-bold text-lg">Manual Reward</h2>
          <button onClick={onClose} className="text-slate-400">
            <X size={18} />
          </button>
        </div>

        <label className="text-xs text-slate-400 block mb-1">Reward Type</label>
        <select
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm mb-1"
          value={rewardType}
          onChange={(e) => {
            setRewardType(e.target.value);
            setError('');
          }}
        >
          <option value="">Select…</option>
          {REWARD_TYPE_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-400 mb-1">{error}</p>}

        <label className="text-xs text-slate-400 block mb-1 mt-3">Reward (optional)</label>
        <input
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
          value={reward}
          onChange={(e) => setReward(e.target.value)}
        />

        <div className="flex justify-end gap-4 mt-6">
          <button onClick={onClose} className="text-red-400 text-sm">
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={saving}
            className="bg-blue-600 px-5 py-2 rounded-full text-white text-sm disabled:opacity-60"
          >
            {saving ? 'Adding…' : '+ Add'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualRewardModal;
