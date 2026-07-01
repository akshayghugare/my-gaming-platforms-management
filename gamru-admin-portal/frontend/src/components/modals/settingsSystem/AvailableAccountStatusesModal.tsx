import type { Dispatch, FC, SetStateAction } from 'react';
import { X, Plus } from 'lucide-react';
import { AccountStatusErrors, AccountStatusForm } from '@/types/accountStatus';
import AccountStatusItem from '@/components/accounts/AccountStatusItem';

interface Props {
  form: AccountStatusForm;
  setForm: Dispatch<SetStateAction<AccountStatusForm>>;
  errors: AccountStatusErrors;
  onSave: () => void;
  loading: boolean;
  closeModal: () => void;
}

const generateId = () => Math.random().toString(36).slice(2, 9);

const AvailableAccountStatusesModal: FC<Props> = ({
  form,
  setForm,
  errors,
  onSave,
  loading,
  closeModal,
}) => {
  const addStatus = () => {
    setForm((prev) => ({
      ...prev,
      statuses: [
        ...prev.statuses,
        { id: generateId(), uniqueKey: '', displayName: '', icon: '', color: '' },
      ],
    }));
  };

  const updateStatus = (index: number, updated: AccountStatusForm['statuses'][number]) => {
    setForm((prev) => {
      const next = [...prev.statuses];
      next[index] = updated;
      return { ...prev, statuses: next };
    });
  };

  const deleteStatus = (index: number) => {
    setForm((prev) => ({
      ...prev,
      statuses: prev.statuses.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex justify-center items-center z-50 thin-scrollbar overflow-auto">
      <div
        className=" bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl shadow-black/60 w-full max-w-lg mx-4 flex flex-col max-h-[90vh] thin-scrollbar overflow-auto "
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 shrink-0">
          <h2 className="text-base font-semibold text-slate-100 tracking-tight">
            Available Account Statuses
          </h2>
          <button
            type="button"
            onClick={closeModal}
            className="
              p-1.5 rounded-md text-slate-400 hover:text-slate-200
              hover:bg-slate-700/60 transition-all duration-200
            "
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 px-6 py-4 space-y-3 overflow-auto  thin-scrollbar ">
          {form?.statuses?.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-6">
              No statuses yet. Click below to add one.
            </p>
          )}
          {form?.statuses?.map((status, index) => (
            <AccountStatusItem
              key={status.id}
              status={status}
              errors={errors[status.id] ?? {}}
              onChange={(updated) => updateStatus(index, updated)}
              onDelete={() => deleteStatus(index)}
            />
          ))}
        </div>

        <div className="px-6 py-3 border-t border-slate-700/40 shrink-0">
          <button
            type="button"
            onClick={addStatus}
            className="
              flex items-center gap-2 px-4 py-2 rounded-lg
              border border-blue-500/40 bg-blue-500/10
              text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 hover:border-blue-400/60
              transition-all duration-200 font-medium
            "
          >
            <Plus size={14} />
            Add Account Status
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700/50 shrink-0">
          <button
            type="button"
            onClick={closeModal}
            className="
              px-4 py-2 rounded-lg text-sm font-medium
              text-red-400 hover:text-red-300 hover:bg-red-500/10
              transition-all duration-200
            "
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={loading}
            className="
              px-5 py-2 rounded-lg text-sm font-semibold
              bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50
              text-white disabled:text-white/50
              transition-all duration-200 shadow-lg shadow-blue-900/30
            "
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvailableAccountStatusesModal;
