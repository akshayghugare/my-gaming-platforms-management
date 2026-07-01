import { ReactNode } from 'react';

interface Props {
  label: string;
  value?: string;
  action?: ReactNode;
}

const ProfileInfoRow = ({ label, value, action }: Props) => (
  <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg px-5 py-4 hover:border-slate-500 transition-colors">
    <div>
      <p className="text-xs font-semibold text-slate-400 mb-0.5">{label}</p>
      {value && <p className="text-sm text-slate-200">{value}</p>}
    </div>
    {action && <div className="ml-4 flex-shrink-0">{action}</div>}
  </div>
);

export default ProfileInfoRow;
