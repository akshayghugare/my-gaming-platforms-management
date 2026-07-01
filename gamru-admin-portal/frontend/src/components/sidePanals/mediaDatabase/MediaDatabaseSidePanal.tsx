import { MediaDatabaseNavItem, MediaDatabaseNavItemId } from '@/types/medaiDatabase.types';
import { Zap, Trophy, Flag, Send, Settings } from 'lucide-react';

interface Props {
  activeSection: MediaDatabaseNavItemId;
  onSelect: (id: MediaDatabaseNavItemId) => void;
}

const navItems: MediaDatabaseNavItem[] = [
  { id: 'all-media-database', label: 'All', icon: <Zap size={16} /> },
  { id: 'media-database-banners', label: 'Banners', icon: <Trophy size={16} /> },
  { id: 'media-database-booster-images', label: 'Booster Images', icon: <Flag size={16} /> },
  {
    id: 'media-database-email-templates-assets',
    label: 'Email Templates Assets',
    icon: <Send size={16} />,
  },
  { id: 'media-database-joy-saha', label: 'Joy Saha', icon: <Settings size={16} /> },
  { id: 'media-database-mission-bundles', label: 'Mission Bundles', icon: <Settings size={16} /> },
  { id: 'media-database-mission-banner', label: 'Mission Banner', icon: <Settings size={16} /> },
  { id: 'media-database-template', label: 'Template', icon: <Settings size={16} /> },
];

const MediaDatabaseSidePanal = ({ activeSection, onSelect }: Props) => (
  <div className="w-60 bg-slate-900  flex flex-col flex-shrink-0 sticky top-0 h-[80vh] rounded-md">
    <div className="px-4 py-5 text-xs font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-700">
      Media Database
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
  </div>
);

export default MediaDatabaseSidePanal;
