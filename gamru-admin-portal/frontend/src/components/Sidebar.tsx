import { useEffect, useState, type FC, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useIsModuleVisible } from '@/context/SettingsContext';
import gamruLogo from '@/assets/gamruLogo.svg';

const HamburgerIcon: FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const HomeIcon: FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </svg>
);

const PlayersIcon: FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
  </svg>
);

const CRMIcon: FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
  </svg>
);

const GamificationIcon: FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V18H9v2h6v-2h-2v-2.1a5.01 5.01 0 003.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2z" />
  </svg>
);

const SettingsIcon: FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
  </svg>
);

const ConfigurationsIcon: FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 7h-9" />
    <path d="M14 17H5" />
    <circle cx="17" cy="17" r="3" />
    <circle cx="7" cy="7" r="3" />
  </svg>
);

const HelpIcon: FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const PlusIcon: FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
interface ChevronDownProps {
  open: boolean;
}

const ChevronDown: FC<ChevronDownProps> = ({ open }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={`ml-auto transition-transform ${open ? 'rotate-180' : ''}`}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const navItem =
  'flex items-center gap-3 px-4 py-2.5 text-sm rounded-r-md transition-all duration-150 border-l-[3px]';
const active = 'text-blue-400 bg-blue-400/10 border-blue-400 font-semibold';
const inactive = 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border-transparent';

const subItem = 'block pl-4 pr-3 py-2 text-[13px] rounded-md transition-colors';
const subActive = 'text-blue-300 bg-blue-400/5 font-medium';
const subInactive = 'text-slate-400 hover:text-white hover:bg-white/5';

const Sidebar: FC = () => {
  const location = useLocation();
  const path = location.pathname;
  const isVisible = useIsModuleVisible();

  const [crmOpen, setCrmOpen] = useState(false);
  const [gameOpen, setGameOpen] = useState(false);
  const [settingOpen, setSettingOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const isCRMActive = path.startsWith('/crm');

  const isGameActive = path.startsWith('/gamification');

  const isSettingActive =
    path.startsWith('/settings/users') ||
    path.startsWith('/settings/user-logs') ||
    path.startsWith('/settings/roles') ||
    path.startsWith('/settings/system-settings') ||
    path.startsWith('/settings/tags-gamification') ||
    path.startsWith('/settings/tags-crm') ||
    path.startsWith('/settings/media-database') ||
    path.startsWith('/settings/casino-catalog') ||
    path.startsWith('/settings/sports-catalog') ||
    path.startsWith('/settings/http-debugger-console') ||
    path.startsWith('/settings/widget-setup');

  const isConfigActive = path.startsWith('/configurations');

  useEffect(() => {
    if (isCRMActive) setCrmOpen(true);
    if (isGameActive) setGameOpen(true);
    if (isSettingActive) setSettingOpen(true);
    if (isConfigActive) setConfigOpen(true);
  }, [path]);

  const crmLinks = [
    { to: '/crm/campaigns', label: 'Campaigns' },
    { to: '/crm/analytics', label: 'Analytics' },
    { to: '/crm/segments', label: 'Segments' },
    { to: '/crm/templates', label: 'Templates' },
    { to: '/crm/custom-triggers', label: 'Custom Triggers' },
    { to: '/crm/frequency-cap', label: 'Frequency Cap' },
    { to: '/crm/unsubscribe-reports', label: 'Unsubscribe Reports' },
    { to: '/crm/player-data', label: 'Player Data' },
  ];

  const gameLinks = [
    { to: '/gamification/missions', label: 'Missions' },
    { to: '/gamification/mission-bundles', label: 'Mission Bundles' },
    { to: '/gamification/ranks', label: 'Ranks' },
    { to: '/gamification/bonuses', label: 'Bonuses' },
    { to: '/gamification/token-rules-casino', label: 'Token Rules (Casino)' },
    { to: '/gamification/token-rules-sports', label: 'Token Rules (Sports)' },
    { to: '/gamification/xp-point-rules-casino', label: 'XP Point Rules (Casino)' },
    { to: '/gamification/xp-point-rules-sports', label: 'XP Point Rules (Sports)' },
    { to: '/gamification/player-categories', label: 'Player Categories' },
    { to: '/gamification/reward-shop', label: 'Reward Shop' },
    { to: '/gamification/prizeshark-catalog', label: 'Prizeshark Catalog' },
    { to: '/gamification/purchase-feed', label: 'Purchase Feed' },
    { to: '/gamification/tournaments', label: 'Tournaments' },
  ];

  const configurationsLinks = [{ to: '/configurations/clients', label: 'Clients' }];

  const settingsLinks = [
    { to: '/settings/users', label: 'User Management' },
    { to: '/settings/user-logs', label: 'User Logs' },
    { to: '/settings/roles', label: 'Roles' },
    { to: '/settings/system-settings', label: 'System Settings' },
    { to: '/settings/tags-gamification', label: 'Tags (Gamification)' },
    { to: '/settings/tags-crm', label: 'Tags (CRM)' },
    { to: '/settings/media-database', label: 'Media Database' },
    { to: '/settings/casino-catalog', label: 'Casino Catalog' },
    { to: '/settings/sports-catalog', label: 'Sports Catalog' },
    { to: '/settings/http-debugger-console', label: 'HTTP Debugger Console' },
    { to: '/settings/widget-setup', label: 'Widget / iFrame Setup' },
  ];

  const renderGroup = (
    label: string,
    icon: ReactNode,
    open: boolean,
    toggle: () => void,
    isActiveGroup: boolean,
    links: { to: string; label: string }[]
  ): ReactNode => (
    <div>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        title={collapsed ? label : undefined}
        className={`${navItem} ${isActiveGroup ? active : inactive} w-full ${
          collapsed ? 'justify-center' : ''
        }`}
      >
        {icon}
        {!collapsed && <span className="flex-1 text-left">{label}</span>}
        {!collapsed && <ChevronDown open={open} />}
      </button>

      {!collapsed && (
        <div
          className={`overflow-hidden transition-all duration-200 ${
            open ? 'max-h-[640px]' : 'max-h-0'
          }`}
        >
          <div className="ml-5 my-1 border-l border-white/10 pl-2 space-y-0.5">
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `${subItem} ${isActive ? subActive : subInactive}`}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <aside
      className={`${
        collapsed ? 'w-[76px] min-w-[76px]' : 'w-[244px] min-w-[244px]'
      } bg-[#0d1b3e] border-r border-white/5 flex flex-col h-screen sticky top-0 transition-all duration-300`}
    >
      {/* Brand */}
      <div
        className={`flex items-center px-4 pt-5 pb-4 ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img src={gamruLogo} alt="Gamru" className="w-[52px] h-[52px] object-contain" />
            <div className="leading-tight">
              <p className="text-sm font-bold text-white">Gamru</p>
              <p className="text-[10px] text-slate-500">Engage v2.11.0</p>
            </div>
          </div>
        )}

        {collapsed && (
          <img src={gamruLogo} alt="Gamru" className="w-[40px] h-[40px] object-contain" />
        )}

        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded-md transition-colors"
            type="button"
            aria-label="Collapse sidebar"
          >
            <HamburgerIcon />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="mx-auto mb-3 text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded-md transition-colors"
          type="button"
          aria-label="Expand sidebar"
        >
          <HamburgerIcon />
        </button>
      )}

      {/* Create */}
      <button
        type="button"
        title={collapsed ? 'Create' : undefined}
        className={`mx-3 mb-3 flex items-center ${
          collapsed ? 'justify-center px-0' : 'gap-2 px-4 justify-center'
        } bg-blue-600 hover:bg-blue-500 rounded-lg py-2.5 text-white text-sm font-semibold transition-colors`}
      >
        <PlusIcon />
        {!collapsed && 'Create'}
      </button>

      {!collapsed && (
        <div className="mx-3 mb-3 flex items-center gap-2 rounded-md bg-[#0e7c6e]/15 border border-[#0e7c6e]/40 px-3 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c3aa]" />
          <span className="text-[11px] font-semibold tracking-widest text-[#22c3aa]">SANDBOX</span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto thin-scrollbar px-2 py-1 space-y-0.5">
        {!collapsed && (
          <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            Overview
          </p>
        )}

        {isVisible('dashboard') && (
          <NavLink
            to="/dashboard"
            title={collapsed ? 'Dashboard' : undefined}
            className={({ isActive }) =>
              `${navItem} ${isActive ? active : inactive} ${collapsed ? 'justify-center' : ''}`
            }
          >
            <HomeIcon />
            {!collapsed && 'Dashboard'}
          </NavLink>
        )}

        {isVisible('players') && (
          <NavLink
            to="/players"
            title={collapsed ? 'Players' : undefined}
            className={({ isActive }) =>
              `${navItem} ${isActive ? active : inactive} ${collapsed ? 'justify-center' : ''}`
            }
          >
            <PlayersIcon />
            {!collapsed && 'Players'}
          </NavLink>
        )}

        {!collapsed && (isVisible('crm') || isVisible('gamification') || isVisible('settings')) && (
          <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            Workspace
          </p>
        )}

        {isVisible('crm') &&
          renderGroup(
            'CRM',
            <CRMIcon />,
            crmOpen,
            () => setCrmOpen(!crmOpen),
            isCRMActive,
            crmLinks
          )}
        {isVisible('gamification') &&
          renderGroup(
            'Gamification',
            <GamificationIcon />,
            gameOpen,
            () => setGameOpen(!gameOpen),
            isGameActive,
            gameLinks
          )}
        {isVisible('settings') &&
          renderGroup(
            'Settings',
            <SettingsIcon />,
            settingOpen,
            () => setSettingOpen(!settingOpen),
            isSettingActive,
            settingsLinks
          )}
        {isVisible('configurations') &&
          renderGroup(
            'Configurations',
            <ConfigurationsIcon />,
            configOpen,
            () => setConfigOpen(!configOpen),
            isConfigActive,
            configurationsLinks
          )}
      </nav>

      {/* Bottom */}
      <NavLink
        to="/documentation"
        title={collapsed ? 'Help & Support' : undefined}
        className={({ isActive }) =>
          `mt-auto border-t border-white/5 px-4 py-4 flex items-center gap-3 text-sm transition-colors ${
            collapsed ? 'justify-center' : ''
          } ${isActive ? 'text-blue-400' : 'text-slate-500 hover:text-slate-200'}`
        }
      >
        <HelpIcon />
        {!collapsed && 'Help & Support'}
      </NavLink>
    </aside>
  );
};

export default Sidebar;
