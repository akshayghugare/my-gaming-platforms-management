import PersonalInfoSection from '@/components/profile/PersonalInfoSection';
import ProfileLeftPanel from '@/components/profile/ProfileLeftPanel';
import SecuritySection from '@/components/profile/SecuritySection';
import ChangeEmailModal from '@/components/modals/profile/ChangeEmailModal';
import ChangeUsernameModal from '@/components/modals/profile/ChangeUsernameModal';
import ChangeTimezoneModal from '@/components/modals/profile/ChangeTimezoneModal';
import ChangePasswordModal from '@/components/modals/profile/ChangePasswordModal';
import TwoFactorModal from '@/components/modals/profile/TwoFactorModal';
import ThemeModal from '@/components/modals/profile/ThemeModal';
import DashboardLayout from '@/layout/DashboardLayout';
import apiService from '@/services/api';
import { useTheme } from '@/context/ThemeContext';
import { ApiResponse } from '@/types';
import { ApiUser, SecuritySettings, ThemeName, UserProfile } from '@/types/profile';
import { useEffect, useState } from 'react';

type ActiveModal = 'email' | 'username' | 'timezone' | 'password' | '2fa' | 'theme' | null;

const ProfilePage = () => {
  const { applyTheme } = useTheme();

  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    name: '',
    email: '',
    username: '',
    timezone: 'GMT+04 Samara / Armenia',
    role: '',
    avatarInitials: '',
    theme: 'dark',
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorEnabled: false,
  });

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const closeModal = () => setActiveModal(null);

  const getLoggedInUser = async (): Promise<void> => {
    try {
      const response = await apiService.get<ApiResponse<ApiUser>>('/users/me');
      if (response && response.success && response.data) {
        const user = response.data as unknown as ApiUser;
        const theme: ThemeName = user.theme ?? 'dark';

        setProfile({
          id: user.id,
          name: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim(),
          email: user.email ?? '',
          username: user.username ?? '',
          role: user.role ?? '',
          timezone: user.timezone ?? 'GMT+04 Samara / Armenia',
          avatarInitials: `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase(),
          theme,
        });
        setSecurity({ twoFactorEnabled: !!user.two_factor_enabled });
        applyTheme(theme);
      } else {
        console.error(response?.message || 'Failed to fetch user');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  useEffect(() => {
    getLoggedInUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DashboardLayout>
      <div className="w-full flex min-h-full bg-slate-900 text-slate-200">
        <ProfileLeftPanel profile={profile} />
        <div className="flex-1 overflow-y-auto p-8 scrollbar-none">
          <PersonalInfoSection
            profile={profile}
            onChangeEmail={() => setActiveModal('email')}
            onChangeUsername={() => setActiveModal('username')}
            onChangeTimezone={() => setActiveModal('timezone')}
            onChangeTheme={() => setActiveModal('theme')}
          />
          <div className="my-6 border-t border-slate-700" />
          <SecuritySection
            security={security}
            onChangePassword={() => setActiveModal('password')}
            onToggle2FA={() => setActiveModal('2fa')}
          />
        </div>
      </div>

      {activeModal === 'email' && (
        <ChangeEmailModal
          currentEmail={profile.email}
          onClose={closeModal}
          onSaved={(email) => setProfile((p) => ({ ...p, email }))}
        />
      )}

      {activeModal === 'username' && (
        <ChangeUsernameModal
          currentUsername={profile.username}
          onClose={closeModal}
          onSaved={(username) => setProfile((p) => ({ ...p, username }))}
        />
      )}

      {activeModal === 'timezone' && (
        <ChangeTimezoneModal
          currentTimezone={profile.timezone}
          onClose={closeModal}
          onSaved={(timezone) => setProfile((p) => ({ ...p, timezone }))}
        />
      )}

      {activeModal === 'password' && <ChangePasswordModal onClose={closeModal} />}

      {activeModal === '2fa' && (
        <TwoFactorModal
          currentlyEnabled={security.twoFactorEnabled}
          onClose={closeModal}
          onSaved={(enabled) => setSecurity({ twoFactorEnabled: enabled })}
        />
      )}

      {activeModal === 'theme' && (
        <ThemeModal
          currentTheme={profile.theme}
          onClose={closeModal}
          onSaved={(theme) => setProfile((p) => ({ ...p, theme }))}
        />
      )}
    </DashboardLayout>
  );
};

export default ProfilePage;
