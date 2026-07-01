import type { Dispatch, FC, SetStateAction } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import ModalInput from '@/components/inputs/ModalInput';
import { PaymentMethodErrors, PaymentMethodForm } from '@/types/systemSettings.types';

interface Props {
  form: PaymentMethodForm;
  setForm: Dispatch<SetStateAction<PaymentMethodForm>>;
  errors: PaymentMethodErrors;
  onSave: () => void;
  loading: boolean;
  closeModal: () => void;
}

const generateId = () => Math.random().toString(36).slice(2, 9);

const PaymentMethodsModal: FC<Props> = ({ form, setForm, errors, onSave, loading, closeModal }) => {
  const addMethod = () => {
    setForm((prev) => ({
      ...prev,
      methods: [...prev.methods, { id: generateId(), uniqueKey: '', displayName: '' }],
    }));
  };

  const updateMethod = (index: number, field: 'uniqueKey' | 'displayName', value: string) => {
    setForm((prev) => {
      const next = [...prev.methods];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, methods: next };
    });
  };

  const deleteMethod = (index: number) => {
    setForm((prev) => ({
      ...prev,
      methods: prev.methods.filter((_, i) => i !== index),
    }));
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-xs flex justify-center items-center z-50"
      onClick={closeModal}
    >
      <div
        className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl shadow-black/60 w-full max-w-lg mx-4 flex flex-col thin-scrollbar  max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 shrink-0">
          <h2 className="text-base font-semibold text-slate-100 tracking-tight">Payment Methods</h2>
          <button
            type="button"
            onClick={closeModal}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition-all duration-200"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {form.methods.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-6">
              No payment methods yet. Click below to add one.
            </p>
          )}

          {form.methods.map((method, index) => (
            <div
              key={method.id}
              className="bg-slate-800/50 border border-slate-700/40 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Method {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => deleteMethod(index)}
                  className="p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <ModalInput
                label="ID"
                value={method.uniqueKey}
                onChange={(val) => updateMethod(index, 'uniqueKey', val)}
                error={errors[index]?.uniqueKey}
              />
              <ModalInput
                label="Name"
                value={method.displayName}
                onChange={(val) => updateMethod(index, 'displayName', val)}
                error={errors[index]?.displayName}
              />
            </div>
          ))}
        </div>

        <div className="px-6 py-3 border-t border-slate-700/40 shrink-0">
          <button
            type="button"
            onClick={addMethod}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-500/40 bg-blue-500/10 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 hover:border-blue-400/60 transition-all duration-200 font-medium"
          >
            <Plus size={14} />
            Add Payment Method
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700/50 shrink-0">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={loading}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white disabled:text-white/50 transition-all duration-200 shadow-lg shadow-blue-900/30"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodsModal;
