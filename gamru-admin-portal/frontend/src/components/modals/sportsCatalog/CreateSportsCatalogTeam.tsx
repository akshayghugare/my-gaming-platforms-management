import type { Dispatch, FC, SetStateAction } from 'react';

import ModalInput from '@/components/inputs/ModalInput';

import {
  SportsCatalogTeamFormData,
  SportsCatalogTeamFormErrors,
} from '@/types/sportsCatalog.types';

interface CreateSportsCatalogTeamProps {
  isOpen: boolean;
  closeModal: () => void;
  form: SportsCatalogTeamFormData;
  setForm: Dispatch<SetStateAction<SportsCatalogTeamFormData>>;
  errors: SportsCatalogTeamFormErrors;
  onSave: () => void;
  loading: boolean;
  editId?: string | null;
}

const CreateSportCatalogTeam: FC<CreateSportsCatalogTeamProps> = ({
  isOpen,
  closeModal,
  form,
  setForm,
  errors,
  onSave,
  loading,
  editId,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex justify-center items-center z-50"
      onClick={closeModal}
    >
      <div
        className="bg-slate-900 w-full max-w-sm rounded-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white">{editId ? 'Edit Team' : 'New Team'}</h2>

          <button onClick={closeModal} className="text-slate-400 hover:text-slate-200">
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <ModalInput
            label="Name"
            value={form.name}
            onChange={(val) =>
              setForm((f) => ({
                ...f,
                name: val,
              }))
            }
            error={errors.name}
          />

          <ModalInput
            label="Sport"
            value={form.sport}
            onChange={(val) =>
              setForm((f) => ({
                ...f,
                sport: val,
              }))
            }
            error={errors.sport}
          />

          <ModalInput
            label="Tournament"
            value={form.tournament}
            onChange={(val) =>
              setForm((f) => ({
                ...f,
                tournament: val,
              }))
            }
            error={errors.tournament}
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={closeModal}
            type="button"
            className="px-4 py-2 text-sm text-slate-300 hover:text-white"
          >
            Cancel
          </button>

          <button
            onClick={onSave}
            type="button"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded text-sm text-white disabled:opacity-50"
          >
            {loading ? 'Saving...' : editId ? 'Update' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateSportCatalogTeam;
