import { SecuritySettings } from '@/types/profile';
import ProfileInfoRow from './ProfileInfoRow';
import ToggleSwitch from './ToggleSwitch';

interface Props {
  security: SecuritySettings;
  onChangePassword: () => void;
  onToggle2FA: () => void;
}

const SecuritySection = ({ security, onChangePassword, onToggle2FA }: Props) => (
  <div>
    <h2 className="text-lg font-semibold text-slate-100 mb-4">Security</h2>
    <div className="space-y-2">
      <ProfileInfoRow
        label="Password"
        value="••••••••••"
        action={
          <button
            type="button"
            onClick={onChangePassword}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-1.5 rounded-full transition-colors whitespace-nowrap"
          >
            Change Password
          </button>
        }
      />
      <ProfileInfoRow
        label="Two-Factor Authentication"
        value={security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
        action={<ToggleSwitch enabled={security.twoFactorEnabled} onToggle={onToggle2FA} />}
      />
      <div className="bg-slate-800 border border-slate-700 rounded-lg px-5 py-4">
        <p className="font-semibold text-slate-200 text-sm">Alternative Verification Codes</p>
        <p className="text-slate-500 text-xs mt-1">
          To generate the codes it is necessary to activate the Two-Factor Authentication
        </p>
      </div>
    </div>
  </div>
);

export default SecuritySection;
