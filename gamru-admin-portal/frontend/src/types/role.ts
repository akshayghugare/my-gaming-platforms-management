export interface Role {
  id: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface RoleForm {
  id?: string; // ✅ optional (fixes your TS error)
  name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface RoleErrors {
  name?: string;
}
