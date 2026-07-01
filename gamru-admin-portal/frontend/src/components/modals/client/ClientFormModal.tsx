import { useEffect, type Dispatch, type FC, type SetStateAction } from 'react';
import ModalInput from '@/components/inputs/ModalInput';
import type { ClientErrors, ClientForm, ClientStatus } from '@/types/client.types';

interface Props {
  mode: 'create' | 'edit';
  open: boolean;
  form: ClientForm;
  setForm: Dispatch<SetStateAction<ClientForm>>;
  errors: ClientErrors;
  loading: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

const ClientFormModal: FC<Props> = ({
  mode,
  open,
  form,
  setForm,
  errors,
  loading,
  onClose,
  onSubmit,
}) => {
  // Auto-derive slug from name in create mode until the user types one explicitly.
  useEffect(() => {
    if (mode !== 'create') return;
    if (form.slug && form.slug !== slugify(form.name)) return;
    setForm((prev) => ({ ...prev, slug: slugify(prev.name) }));
  }, [form.name, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 p-6 rounded w-full max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 font-bold text-lg text-white">
          {mode === 'create' ? 'Add Client' : 'Edit Client'}
        </h2>

        <div className="space-y-3">
          <ModalInput
            label="Name *"
            value={form.name}
            onChange={(val) => setForm({ ...form, name: val })}
            error={errors.name}
            placeholder="SDLC Corps"
          />

          <ModalInput
            label="Slug *"
            value={form.slug}
            onChange={(val) => setForm({ ...form, slug: val })}
            error={errors.slug}
            placeholder="sdlc-corps"
          />

          <ModalInput
            label="Skin ID"
            value={form.skin_id}
            onChange={(val) => setForm({ ...form, skin_id: val })}
            error={errors.skin_id}
            placeholder="Leave empty to auto-generate"
          />

          <ModalInput
            label="Description"
            value={form.description}
            onChange={(val) => setForm({ ...form, description: val })}
            placeholder="Optional notes about this client"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ModalInput
              label="Contact Email"
              value={form.contact_email}
              onChange={(val) => setForm({ ...form, contact_email: val })}
              error={errors.contact_email}
              placeholder="ops@example.com"
              type="email"
            />

            <ModalInput
              label="Contact Phone"
              value={form.contact_phone}
              onChange={(val) => setForm({ ...form, contact_phone: val })}
              placeholder="+1 555 123 4567"
            />
          </div>

          <ModalInput
            label="Webhook URL"
            value={form.webhook_url}
            onChange={(val) => setForm({ ...form, webhook_url: val })}
            error={errors.webhook_url}
            placeholder="https://example.com/webhooks/gamru"
          />

          <ModalInput
            label="Timezone"
            value={form.timezone}
            onChange={(val) => setForm({ ...form, timezone: val })}
            placeholder="UTC"
          />

          {mode === 'edit' && (
            <div>
              <label className="text-sm block mb-1 text-slate-300">Status</label>
              <select
                className="w-full px-3 py-2 bg-slate-800 rounded text-white"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ClientStatus })}
              >
                <option value="ENABLED">ENABLED</option>
                <option value="DISABLED">DISABLED</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded bg-slate-700 text-white hover:bg-slate-600"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="bg-blue-600 px-4 py-2 rounded text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {loading
              ? mode === 'create'
                ? 'Saving...'
                : 'Updating...'
              : mode === 'create'
                ? 'Save'
                : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientFormModal;
