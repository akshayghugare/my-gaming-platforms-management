export type ModalKey =
  | 'accountStatus'
  | 'paymentMethods'
  | 'enabledLanguages'
  | 'clientSite'
  | null;

export type NavItemId =
  | 'core-features'
  | 'gamification'
  | 'missions'
  | 'crm'
  | 'platform-integration'
  | 'email-smtp'
  | 'widgets';
export interface NavItem {
  id: NavItemId;
  label: string;
  icon: React.ReactNode;
}
export interface SettingsRow {
  label: string;
  description?: string;
  value?: string;
  hasUpdate?: boolean;
  hasDropdown?: boolean;
  modalKey?: ModalKey;
}
export interface LanguageItem {
  id: string;
  language: string;
  flag: string;
  flagEmoji: string;
}
export interface EnabledLanguagesForm {
  languages: LanguageItem[];
}
export interface ClientSiteForm {
  url: string;
}
export interface ClientSiteErrors {
  url?: string;
}
export interface PaymentMethodItem {
  id: string;
  uniqueKey: string;
  displayName: string;
}
export interface PaymentMethodForm {
  methods: PaymentMethodItem[];
}
export interface PaymentMethodErrors {
  [index: number]: {
    uniqueKey?: string;
    displayName?: string;
  };
}

export interface OAuthClient {
  id: string;
  name: string;
  description: string;
  clientId: string;
}

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
}

// ─── API DTOs (snake_case from backend) ──────────────────────────────────────

export type SettingsPanel = 'core' | 'gamification' | 'mission' | 'crm' | 'platform' | 'widgets';

export interface SettingDTO {
  panel: SettingsPanel;
  key: string;
  value: unknown;
}

export interface AccountStatusDTO {
  id: string;
  unique_key: string;
  display_name: string;
  icon: string | null;
  color: string | null;
}

export interface PaymentMethodDTO {
  id: string;
  unique_key: string;
  display_name: string;
}

export interface LanguageDTO {
  id: string;
  language: string;
  flag: string | null;
  flag_emoji: string | null;
  is_default: boolean;
}

export interface OAuthClientDTO {
  id: string;
  name: string;
  description: string | null;
  client_id: string;
  client_secret: string | null;
}

export interface WebhookDTO {
  id: string;
  name: string;
  url: string;
  is_enabled: boolean;
}

export type EmailSmtpType = 'register' | 'reward';

export interface EmailSmtpDTO {
  id: string;
  type: EmailSmtpType;
  host: string | null;
  port: number | null;
  username: string | null;
  password: string | null;
  from_email: string | null;
  is_enabled: boolean;
}

export interface EmailSmtpInput {
  host?: string | null;
  port?: number | null;
  username?: string | null;
  password?: string | null;
  from_email?: string | null;
  is_enabled?: boolean;
}
