export type ClientStatus = 'ENABLED' | 'DISABLED';

export interface Client {
  id: string;
  name: string;
  slug: string;
  skin_id: string;
  auth_key: string;
  description?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  webhook_url?: string | null;
  timezone: string;
  meta?: Record<string, unknown> | null;
  status: ClientStatus;
  last_seen_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientForm {
  id?: string;
  name: string;
  slug: string;
  skin_id: string;
  description: string;
  contact_email: string;
  contact_phone: string;
  webhook_url: string;
  timezone: string;
  status: ClientStatus;
}

export interface ClientErrors {
  name?: string;
  slug?: string;
  skin_id?: string;
  contact_email?: string;
  webhook_url?: string;
}

export interface ClientListParams {
  page: number;
  limit: number;
  search?: string;
  status?: ClientStatus;
}
