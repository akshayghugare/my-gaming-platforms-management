import { FC, useState } from 'react';
import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { AccountStatus, AccountStatusErrors } from '@/types/accountStatus';
import ModalInput from '../inputs/ModalInput';
import ModalSelect from '../dropdowns/ModalSelect';

const ICON_OPTIONS = [
  { label: 'Circle', value: 'circle' },
  { label: 'Check', value: 'check' },
  { label: 'Clock', value: 'clock' },
  { label: 'Ban', value: 'ban' },
  { label: 'Star', value: 'star' },
];

const COLOR_OPTIONS = [
  { label: 'Red', value: 'red' },
  { label: 'Green', value: 'green' },
  { label: 'Blue', value: 'blue' },
  { label: 'Yellow', value: 'yellow' },
  { label: 'Gray', value: 'gray' },
  { label: 'Orange', value: 'orange' },
];

interface Props {
  status: AccountStatus;
  errors: AccountStatusErrors[string];
  onChange: (updated: AccountStatus) => void;
  onDelete: () => void;
}

const AccountStatusItem: FC<Props> = ({ status, errors = {}, onChange, onDelete }) => {
  const [expanded, setExpanded] = useState(true);

  const label =
    status.displayName || status.uniqueKey ? status.displayName || status.uniqueKey : 'N/A';

  return (
    <div className="border border-slate-700/60 rounded-lg overflow-hidden bg-slate-800/30">
      {/* Header row */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-700/40">
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className="flex items-center gap-2 text-sm font-medium text-slate-200 hover:text-white transition-colors"
        >
          {expanded ? (
            <ChevronUp size={15} className="text-slate-400" />
          ) : (
            <ChevronDown size={15} className="text-slate-400" />
          )}
          <span className="bg-slate-600/60 px-3 py-0.5 rounded-full text-xs tracking-wide">
            {label}
          </span>
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="
            p-1.5 rounded-md bg-red-500/15 hover:bg-red-500/30
            text-red-400 hover:text-red-300 transition-all duration-200
          "
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Body */}
      {expanded && (
        <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-4">
          <ModalInput
            label="Unique Key"
            value={status.uniqueKey}
            onChange={(val) => onChange({ ...status, uniqueKey: val })}
            error={errors.uniqueKey}
          />
          <ModalInput
            label="Display Name"
            value={status.displayName}
            onChange={(val) => onChange({ ...status, displayName: val })}
            error={errors.displayName}
          />
          <ModalSelect
            label="Icon"
            value={status.icon}
            options={ICON_OPTIONS}
            onChange={(val) => onChange({ ...status, icon: val })}
            error={errors.icon}
          />
          <ModalSelect
            label="Color"
            value={status.color}
            options={COLOR_OPTIONS}
            onChange={(val) => onChange({ ...status, color: val })}
            error={errors.color}
          />
        </div>
      )}
    </div>
  );
};

export default AccountStatusItem;
