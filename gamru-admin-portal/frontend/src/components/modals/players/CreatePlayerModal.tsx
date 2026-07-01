import { useState, type FC } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import apiService from '@/services/api';
import type { ApiError } from '@/types';
import { PLAYER_STATUS_OPTIONS } from '@/types/player.types';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

interface Form {
  player_id: string;
  username: string;
  name: string;
  email: string;
  status: string;
  country: string;
  city: string;
  mobile_number: string;
  language: string;
  registration_date: string;
}

const empty: Form = {
  player_id: '',
  username: '',
  name: '',
  email: '',
  status: 'ACTIVE',
  country: '',
  city: '',
  mobile_number: '',
  language: '',
  registration_date: '',
};

const Field: FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
}> = ({ label, value, onChange, error, type = 'text' }) => (
  <div>
    <label className="text-xs text-slate-400 block mb-1">{label}</label>
    <input
      type={type}
      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
    {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
  </div>
);

const CreatePlayerModal: FC<Props> = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState<Form>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = (k: keyof Form, v: string) => setForm({ ...form, [k]: v });

  const handleSave = async () => {
    const e: Record<string, string> = {};
    if (!form.player_id.trim()) e.player_id = 'Required';
    if (!form.username.trim()) e.username = 'Required';
    setErrors(e);
    if (Object.keys(e).length) return;

    try {
      setSaving(true);
      const res = await apiService.post('/players/add', {
        player_id: form.player_id,
        username: form.username,
        name: form.name || null,
        email: form.email || null,
        status: form.status,
        country: form.country || null,
        city: form.city || null,
        mobile_number: form.mobile_number || null,
        language: form.language || null,
        registration_date: form.registration_date || null,
      });
      if (res?.success) {
        toast.success(res.message || 'Player created');
        onSuccess();
        onClose();
      }
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr?.errors) setErrors(apiErr.errors);
      else toast.error(apiErr?.message || 'Failed to create player');
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
        className="bg-slate-900 p-6 rounded-lg w-full max-w-lg border border-slate-700 max-h-[90vh] overflow-y-auto thin-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-bold text-lg">Create New Player</h2>
          <button onClick={onClose} className="text-slate-400">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Player ID *"
            value={form.player_id}
            onChange={(v) => set('player_id', v)}
            error={errors.player_id}
          />
          <Field
            label="Username *"
            value={form.username}
            onChange={(v) => set('username', v)}
            error={errors.username}
          />
          <Field
            label="Name"
            value={form.name}
            onChange={(v) => set('name', v)}
            error={errors.name}
          />
          <Field
            label="Email"
            value={form.email}
            onChange={(v) => set('email', v)}
            error={errors.email}
          />
          <div>
            <label className="text-xs text-slate-400 block mb-1">Status</label>
            <select
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
            >
              {PLAYER_STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <Field
            label="Registration Date"
            type="date"
            value={form.registration_date}
            onChange={(v) => set('registration_date', v)}
          />
          <Field label="Country" value={form.country} onChange={(v) => set('country', v)} />
          <Field label="City" value={form.city} onChange={(v) => set('city', v)} />
          <Field
            label="Mobile Number"
            value={form.mobile_number}
            onChange={(v) => set('mobile_number', v)}
          />
          <Field label="Language" value={form.language} onChange={(v) => set('language', v)} />
        </div>

        <p className="text-xs text-slate-500 mt-4">
          Player Data and Transactional Data records are generated automatically from these fields.
        </p>

        <div className="flex justify-end gap-4 mt-6">
          <button onClick={onClose} className="text-red-400 text-sm">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 px-5 py-2 rounded-full text-white text-sm disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Create Player'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePlayerModal;
