import { useState, useRef, useEffect, type FC } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ApiResponse } from '@/types';
import apiService from '@/services/api';
import type { ThemeName } from '@/types/profile';
import { useNavigate } from 'react-router-dom';
import GlobalSearch from '@/components/GlobalSearch';

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
    className={`transition-transform ${open ? 'rotate-180' : ''}`}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const Header: FC = () => {
  const { logout } = useAuth();
  const { applyTheme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  const now = new Date();

  const utcStr =
    now.toUTCString().slice(5, 11) +
    ' · ' +
    String(now.getUTCHours()).padStart(2, '0') +
    ':' +
    String(now.getUTCMinutes()).padStart(2, '0') +
    ' UTC';

  const getLoggedInUser = async (): Promise<void> => {
    try {
      const response = await apiService.get<ApiResponse<any>>('/users/me');
      if (response?.success) {
        setLoggedInUser(response.data);
        const userTheme = (response.data as { theme?: ThemeName })?.theme;
        if (userTheme) {
          applyTheme(userTheme);
        }
      } else {
        console.error('Failed to fetch logged-in user:', response?.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error fetching logged-in user:', error);
    }
  };
  // close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    getLoggedInUser();
  }, []);
  const displayName =
    [loggedInUser?.first_name, loggedInUser?.last_name].filter(Boolean).join(' ') || 'Admin User';
  const initial = (loggedInUser?.first_name?.charAt(0) || 'A').toUpperCase();

  return (
    <header className="flex-shrink-0 sticky top-0 z-50 h-14 px-4 sm:px-6 flex items-center gap-4 border-b border-white/5 bg-[#0d1b3e]">
      {/* Date Time */}
      <div className="hidden md:flex items-center gap-3 text-xs">
        <span className="text-slate-500">{utcStr}</span>

        <span className="h-3 w-px bg-white/10" />

        <span className="text-slate-400">
          Your time:&nbsp;
          <strong className="text-slate-200 font-medium">
            {now.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
            })}{' '}
            ·{' '}
            {now.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </strong>
        </span>
      </div>

      {/* Global Search */}
      <div className="ml-auto flex items-center">
        <GlobalSearch />
      </div>

      <span className="hidden sm:block h-6 w-px bg-white/10" />

      {/* Account */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-white/5 transition-colors"
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-xs font-bold text-white ring-2 ring-white/10">
            {initial}
          </span>
          <span className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-sm text-slate-100 font-medium">{displayName}</span>
            <span className="text-[11px] text-slate-500">
              {loggedInUser?.email || 'Administrator'}
            </span>
          </span>
          <ChevronDown open={open} />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 top-12 w-52 bg-[#162040] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-white/5 sm:hidden">
              <p className="text-sm text-slate-100 font-medium truncate">{displayName}</p>
              <p className="text-[11px] text-slate-500 truncate">
                {loggedInUser?.email || 'Administrator'}
              </p>
            </div>
            <button
              onClick={() => {
                setOpen(false);
                navigate('/profile');
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5 transition-colors"
              type="button"
              role="menuitem"
            >
              Profile
            </button>

            <button
              onClick={logout}
              className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              type="button"
              role="menuitem"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
