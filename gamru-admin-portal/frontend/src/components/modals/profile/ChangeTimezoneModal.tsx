import { useState, type FC } from 'react';
import { toast } from 'react-toastify';
import apiService from '@/services/api';
import { TIMEZONE_OPTIONS } from '@/types/profile';
import ProfileModalShell from './ProfileModalShell';

interface Props {
  currentTimezone: string;
  onClose: () => void;
  onSaved: (timezone: string) => void;
}

const ChangeTimezoneModal: FC<Props> = ({ currentTimezone, onClose, onSaved }) => {
  const [timezone, setTimezone] = useState(currentTimezone || TIMEZONE_OPTIONS[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (): Promise<void> => {
    if (timezone === currentTimezone) {
      onClose();
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await apiService.patch('/users/me', { timezone });
      if (res?.success) {
        toast.success('Timezone updated successfully');
        onSaved(timezone);
        onClose();
      } else {
        setError(res?.message || 'Failed to update timezone');
      }
    } catch (err) {
      const e = err as { message?: string };
      setError(e?.message || 'Failed to update timezone');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProfileModalShell
      title="Change Time Zone"
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={loading}
    >
      <div>
        <label className="text-sm block mb-1 text-slate-300">Time Zone</label>
        <select
          className="w-full px-3 py-2 bg-slate-800 rounded text-slate-200 outline-none"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
        >
          {TIMEZONE_OPTIONS.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500 mt-2">
          Applicable only for CRM &amp; Message Gateway Campaigns
        </p>
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </div>
    </ProfileModalShell>
  );
};

export default ChangeTimezoneModal;
