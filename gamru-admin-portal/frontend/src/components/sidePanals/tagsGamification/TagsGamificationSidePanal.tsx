import {
  TagsGamificationsNavItem,
  TagsGamificationsNavItemId,
} from '@/types/gamificationTags.types';
import { Zap, Trophy, Flag, Send, Settings, LayoutGrid } from 'lucide-react';

interface Props {
  activeSection: TagsGamificationsNavItemId;
  onSelect: (id: TagsGamificationsNavItemId) => void;
}

const navItems: TagsGamificationsNavItem[] = [
  { id: 'all-gamification-tags', label: 'All', icon: <Zap size={16} /> },
  { id: 'mission-gamification-tags', label: 'Missions', icon: <Trophy size={16} /> },
  { id: 'ranks-gamification-tags', label: 'Ranks', icon: <Flag size={16} /> },
  { id: 'reward-shop-gamification-tags', label: 'Reward Shop', icon: <Send size={16} /> },
  { id: 'token-rules-gamification-tags', label: 'Token Rules', icon: <Settings size={16} /> },
  { id: 'tournaments-gamification-tags', label: 'Tournaments', icon: <LayoutGrid size={16} /> },
  { id: 'xp-points-gamification-tags', label: 'XP Points', icon: <LayoutGrid size={16} /> },
];

const TagsGamificationSidePanal = ({ activeSection, onSelect }: Props) => (
  <div className="w-60 bg-slate-900  flex flex-col flex-shrink-0 sticky top-0 h-[80vh] rounded-md">
    <div className="px-4 py-5 text-xs font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-700">
      Tags Gamification
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

export default TagsGamificationSidePanal;
