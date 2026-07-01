export type UserStatus = 'ACTIVE' | 'INACTIVE';

export type UserRole =  'ADMIN' | 'USER' | '';

export interface User {
  id: string | number;
  first_name: string;
  last_name: string;
  name?: string;
  email: string;
  mobile: string;
  username: string;
  role: UserRole;
  status: UserStatus;
}

export interface UserFormData {
  id?: string | number;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  username: string;
  role: UserRole;
  status: UserStatus;
}

export type UserFormErrors = Partial<Record<keyof UserFormData, string>>;
