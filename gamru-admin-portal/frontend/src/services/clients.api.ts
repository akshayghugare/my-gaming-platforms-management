import apiService from '@/services/api';
import type { Client, ClientForm, ClientListParams, ClientStatus } from '@/types/client.types';

interface Paginated<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const BASE = '/clients';

const toPayload = (form: Partial<ClientForm>) => {
  const trim = (v?: string) => (v ?? '').trim();
  const optional = (v?: string) => {
    const t = trim(v);
    return t.length ? t : undefined;
  };

  return {
    name: form.name !== undefined ? trim(form.name) : undefined,
    slug: optional(form.slug),
    skin_id: optional(form.skin_id),
    description: form.description !== undefined ? trim(form.description) : undefined,
    contact_email: form.contact_email !== undefined ? trim(form.contact_email) : undefined,
    contact_phone: form.contact_phone !== undefined ? trim(form.contact_phone) : undefined,
    webhook_url: form.webhook_url !== undefined ? trim(form.webhook_url) : undefined,
    timezone: optional(form.timezone),
    status: form.status,
  };
};

export const clientsApi = {
  list: (params: ClientListParams) => apiService.get<Paginated<Client>>(`${BASE}/paginate`, params),

  get: (id: string) => apiService.get<Client>(`${BASE}/${id}`),

  create: (form: Partial<ClientForm>) => apiService.post<Client>(`${BASE}/add`, toPayload(form)),

  update: (id: string, form: Partial<ClientForm>) =>
    apiService.post<Client>(`${BASE}/update-by/${id}`, toPayload(form)),

  rotateAuthKey: (id: string) => apiService.post<Client>(`${BASE}/rotate-auth-key/${id}`, {}),

  toggleStatus: (id: string) => apiService.post<Client>(`${BASE}/toggle-status/${id}`, {}),

  remove: (id: string) => apiService.delete<null>(`${BASE}/${id}`),
};

export type { Client, ClientForm, ClientStatus, ClientListParams };
