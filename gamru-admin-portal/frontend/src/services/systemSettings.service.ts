import apiService from './api';
import type {
  SettingsPanel,
  SettingDTO,
  AccountStatusDTO,
  PaymentMethodDTO,
  LanguageDTO,
  OAuthClientDTO,
  WebhookDTO,
  EmailSmtpDTO,
  EmailSmtpType,
  EmailSmtpInput,
} from '@/types/systemSettings.types';

const BASE = '/system-settings';

// ─── Generic key/value settings ────────────────────────────────────────────

export const settingsApi = {
  getAll: () => apiService.get<Record<string, Record<string, unknown>>>(`${BASE}/settings`),
  getByPanel: (panel: SettingsPanel) =>
    apiService.get<Record<string, unknown>>(`${BASE}/settings/${panel}`),
  get: (panel: SettingsPanel, key: string) =>
    apiService.get<SettingDTO>(`${BASE}/settings/${panel}/${key}`),
  upsert: (panel: SettingsPanel, key: string, value: unknown, description?: string) =>
    apiService.put<SettingDTO>(`${BASE}/settings/${panel}/${key}`, { value, description }),
  bulkUpsert: (
    items: Array<{ panel: SettingsPanel; key: string; value: unknown; description?: string }>
  ) => apiService.put<SettingDTO[]>(`${BASE}/settings/bulk`, { items }),
  delete: (panel: SettingsPanel, key: string) =>
    apiService.delete(`${BASE}/settings/${panel}/${key}`),
};

// ─── Account Statuses ─────────────────────────────────────────────────────

export const accountStatusesApi = {
  list: () => apiService.get<AccountStatusDTO[]>(`${BASE}/account-statuses`),
  create: (data: Omit<AccountStatusDTO, 'id'>) =>
    apiService.post<AccountStatusDTO>(`${BASE}/account-statuses`, data),
  update: (id: string, data: Partial<Omit<AccountStatusDTO, 'id'>>) =>
    apiService.put<AccountStatusDTO>(`${BASE}/account-statuses/${id}`, data),
  remove: (id: string) => apiService.delete(`${BASE}/account-statuses/${id}`),
  replaceAll: (items: Array<Omit<AccountStatusDTO, 'id'>>) =>
    apiService.put<AccountStatusDTO[]>(`${BASE}/account-statuses/bulk`, { items }),
};

// ─── Payment Methods ──────────────────────────────────────────────────────

export const paymentMethodsApi = {
  list: () => apiService.get<PaymentMethodDTO[]>(`${BASE}/payment-methods`),
  create: (data: Omit<PaymentMethodDTO, 'id'>) =>
    apiService.post<PaymentMethodDTO>(`${BASE}/payment-methods`, data),
  update: (id: string, data: Partial<Omit<PaymentMethodDTO, 'id'>>) =>
    apiService.put<PaymentMethodDTO>(`${BASE}/payment-methods/${id}`, data),
  remove: (id: string) => apiService.delete(`${BASE}/payment-methods/${id}`),
  replaceAll: (items: Array<Omit<PaymentMethodDTO, 'id'>>) =>
    apiService.put<PaymentMethodDTO[]>(`${BASE}/payment-methods/bulk`, { items }),
};

// ─── Languages ────────────────────────────────────────────────────────────

export const languagesApi = {
  list: () => apiService.get<LanguageDTO[]>(`${BASE}/languages`),
  create: (data: Omit<LanguageDTO, 'id'>) =>
    apiService.post<LanguageDTO>(`${BASE}/languages`, data),
  update: (id: string, data: Partial<Omit<LanguageDTO, 'id'>>) =>
    apiService.put<LanguageDTO>(`${BASE}/languages/${id}`, data),
  remove: (id: string) => apiService.delete(`${BASE}/languages/${id}`),
  replaceAll: (items: Array<Omit<LanguageDTO, 'id'>>) =>
    apiService.put<LanguageDTO[]>(`${BASE}/languages/bulk`, { items }),
};

// ─── OAuth Clients ────────────────────────────────────────────────────────

export const oauthClientsApi = {
  list: () => apiService.get<OAuthClientDTO[]>(`${BASE}/oauth-clients`),
  create: (data: Omit<OAuthClientDTO, 'id'>) =>
    apiService.post<OAuthClientDTO>(`${BASE}/oauth-clients`, data),
  update: (id: string, data: Partial<Omit<OAuthClientDTO, 'id'>>) =>
    apiService.put<OAuthClientDTO>(`${BASE}/oauth-clients/${id}`, data),
  remove: (id: string) => apiService.delete(`${BASE}/oauth-clients/${id}`),
};

// ─── Webhooks ─────────────────────────────────────────────────────────────

export const webhooksApi = {
  list: () => apiService.get<WebhookDTO[]>(`${BASE}/webhooks`),
  create: (data: Omit<WebhookDTO, 'id'>) => apiService.post<WebhookDTO>(`${BASE}/webhooks`, data),
  update: (id: string, data: Partial<Omit<WebhookDTO, 'id'>>) =>
    apiService.put<WebhookDTO>(`${BASE}/webhooks/${id}`, data),
  remove: (id: string) => apiService.delete(`${BASE}/webhooks/${id}`),
};

// ─── Email SMTP ───────────────────────────────────────────────────────────

export const emailSmtpApi = {
  list: () => apiService.get<EmailSmtpDTO[]>(`${BASE}/email-smtp`),
  get: (type: EmailSmtpType) => apiService.get<EmailSmtpDTO | null>(`${BASE}/email-smtp/${type}`),
  upsert: (type: EmailSmtpType, data: EmailSmtpInput) =>
    apiService.put<EmailSmtpDTO>(`${BASE}/email-smtp/${type}`, data),
};
