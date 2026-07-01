import { UserProfile, THEME_OPTIONS } from '@/types/profile';
import ProfileInfoRow from './ProfileInfoRow';
import TimezoneRow from './TimezoneRow';

interface Props {
  profile: UserProfile;
  onChangeEmail: () => void;
  onChangeUsername: () => void;
  onChangeTimezone: () => void;
  onChangeTheme: () => void;
}

const pillButton =
  'bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-1.5 rounded-full transition-colors whitespace-nowrap';

const PersonalInfoSection = ({
  profile,
  onChangeEmail,
  onChangeUsername,
  onChangeTimezone,
  onChangeTheme,
}: Props) => {
  const themeLabel = THEME_OPTIONS.find((t) => t.value === profile.theme)?.label ?? 'Dark';

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-100 mb-4">Personal Information</h2>
      <div className="space-y-2">
        <ProfileInfoRow label="Name" value={profile.name} />

        <ProfileInfoRow
          label="Email"
          value={profile.email}
          action={
            <button type="button" className={pillButton} onClick={onChangeEmail}>
              Change
            </button>
          }
        />

        <ProfileInfoRow
          label="Username"
          value={profile.username || 'Not set'}
          action={
            <button type="button" className={pillButton} onClick={onChangeUsername}>
              Change
            </button>
          }
        />

        <TimezoneRow
          description="Applicable only for CRM & Message Gateway Campaigns"
          value={profile.timezone}
          onClick={onChangeTimezone}
        />

        <ProfileInfoRow
          label="Appearance Theme"
          value={themeLabel}
          action={
            <button type="button" className={pillButton} onClick={onChangeTheme}>
              Change
            </button>
          }
        />
      </div>
    </div>
  );
};

export default PersonalInfoSection;
