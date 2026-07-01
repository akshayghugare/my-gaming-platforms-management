export type ThemeName =
  | 'dark'
  | 'light'
  | 'white'
  | 'thin'
  | 'midnight'
  | 'slate'
  | 'ocean'
  | 'forest'
  | 'contrast';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  username: string;
  timezone: string;
  role: string;
  avatarInitials: string;
  theme: ThemeName;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
}

/** Raw user shape returned by GET /users/me */
export interface ApiUser {
  id: string;
  first_name: string;
  last_name: string;
  username: string | null;
  email: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE';
  timezone: string | null;
  theme: ThemeName | null;
  two_factor_enabled: boolean;
}

export const THEME_OPTIONS: { value: ThemeName; label: string; swatch: string }[] = [
  { value: 'dark', label: 'Dark', swatch: '#0f172a' },
  { value: 'midnight', label: 'Midnight', swatch: '#020617' },
  { value: 'thin', label: 'Thin', swatch: '#1e2533' },
  { value: 'light', label: 'Light', swatch: '#e2e8f0' },
  { value: 'white', label: 'White', swatch: '#ffffff' },
  { value: 'slate', label: 'Slate', swatch: '#3f4856' },
  { value: 'ocean', label: 'Ocean', swatch: '#082f49' },
  { value: 'forest', label: 'Forest', swatch: '#052e1b' },
  { value: 'contrast', label: 'High Contrast', swatch: '#000000' },
];

export const TIMEZONE_OPTIONS: string[] = [
  'GMT+00 UTC / London',
  'GMT+01 Berlin / Paris',
  'GMT+02 Athens / Cairo',
  'GMT+03 Moscow / Nairobi',
  'GMT+04 Samara / Armenia',
  'GMT+05:30 India Standard Time',
  'GMT+07 Bangkok / Jakarta',
  'GMT+08 Singapore / Beijing',
  'GMT+09 Tokyo / Seoul',
  'GMT+10 Sydney / Guam',
  'GMT-05 New York / Toronto',
  'GMT-06 Chicago / Mexico City',
  'GMT-08 Los Angeles / Vancouver',
];
