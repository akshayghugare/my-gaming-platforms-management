import type { NavItem, NavItemId } from '../../../types/systemSettings.types';
import { Zap, Trophy, Flag, Send, Settings, LayoutGrid, Mail } from 'lucide-react';

interface Props {
  activeSection: NavItemId;
  onSelect: (id: NavItemId) => void;
}

const navItems: NavItem[] = [
  { id: 'core-features', label: 'Core Features', icon: <Zap size={16} /> },
  { id: 'gamification', label: 'Gamification', icon: <Trophy size={16} /> },
  { id: 'missions', label: 'Missions', icon: <Flag size={16} /> },
  { id: 'crm', label: 'CRM', icon: <Send size={16} /> },
  { id: 'platform-integration', label: 'Platform Integration', icon: <Settings size={16} /> },
  { id: 'email-smtp', label: 'Email SMTP', icon: <Mail size={16} /> },
  { id: 'widgets', label: 'Widgets', icon: <LayoutGrid size={16} /> },
];

const SystemSettingsSidePanel = ({ activeSection, onSelect }: Props) => (
  <div className="w-60 bg-slate-900  flex flex-col flex-shrink-0 sticky top-0 h-[400px] rounded-md">
    <div className="px-4 py-5 text-xs font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-700">
      Settings
    </div>
    <nav className="flex-1 py-2">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors border-l-2
                    ${
                      activeSection === item.id
                        ? 'bg-slate-700/50 bg-blue-950/50 text-blue-400'
                        : 'border-transparent text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                    }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </nav>
    <div className="px-4 py-4 border-t border-slate-700 text-xs text-slate-500">Gamru Engage®</div>
  </div>
);

export default SystemSettingsSidePanel;
