import type { User, UserRole } from './user';

/** Shape of the JWT payload signed by the backend (id, email, role). */
export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/** The authenticated user as derived from the decoded access token. */
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthContextType {
  token: string | null;
  /** Decoded user from the token, or null when logged out / token invalid. */
  user: AuthUser | null;
  /** Convenience accessor for the current user's role ('' when logged out). */
  role: UserRole;
  /** True when the logged-in user has the ADMIN role. */
  isAdmin: boolean;
  login: (token: string) => void;
  logout: () => void;
}

export interface LoginResponseData {
  token: string;
  user?: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}
export interface AddOrUpdateUserRequest {
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  username: string;
  role: string;
  status: string;
}
