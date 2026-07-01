import { TagsCrmsNavItem, TagsCrmsNavItemId } from '@/types/crmTags.types';
import { LayoutGrid, Send, Mail, Bell, Users } from 'lucide-react';

interface Props {
  activeSection: TagsCrmsNavItemId;
  onSelect: (id: TagsCrmsNavItemId) => void;
}

const navItems: TagsCrmsNavItem[] = [
  { id: 'all-crm-tags', label: 'All', icon: <LayoutGrid size={16} /> },
  { id: 'campaign-crm-tags', label: 'Campaigns', icon: <Send size={16} /> },
  { id: 'segment-crm-tags', label: 'Segments', icon: <Users size={16} /> },
  { id: 'template-crm-tags', label: 'Templates', icon: <Mail size={16} /> },
  { id: 'custom-trigger-crm-tags', label: 'Custom Triggers', icon: <Bell size={16} /> },
];

const CrmTagsSidePanal = ({ activeSection, onSelect }: Props) => (
  <div className="w-60 bg-slate-900  flex flex-col flex-shrink-0 sticky top-0 h-[80vh] rounded-md">
    <div className="px-4 py-5 text-xs font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-700">
      CRM Tags
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

export default CrmTagsSidePanal;
