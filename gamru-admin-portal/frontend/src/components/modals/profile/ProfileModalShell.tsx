import type { FC, ReactNode } from 'react';

interface ProfileModalShellProps {
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  loading: boolean;
  submitLabel?: string;
  submitDisabled?: boolean;
  children: ReactNode;
}

const ProfileModalShell: FC<ProfileModalShellProps> = ({
  title,
  onClose,
  onSubmit,
  loading,
  submitLabel = 'Save',
  submitDisabled = false,
  children,
}) => {
  return (
    <div
      className="fixed inset-0 bg-black/70 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-5 text-slate-100">{title}</h2>

        <div className="space-y-4">{children}</div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 rounded text-slate-300 hover:text-white"
          >
            Cancel
          </button>

          <button
            onClick={onSubmit}
            type="button"
            disabled={loading || submitDisabled}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2 rounded text-white transition-colors"
          >
            {loading ? 'Saving…' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModalShell;
