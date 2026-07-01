import type { FC, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';

interface AdminOnlyProps {
  /** Content (typically action buttons) rendered only for ADMIN users. */
  children: ReactNode;
  /** Optional fallback rendered for non-admin (e.g. USER) viewers. */
  fallback?: ReactNode;
}

/**
 * Renders its children only when the logged-in user has the ADMIN role.
 * Non-admin users (e.g. role "USER") get view-only access — create / edit /
 * delete actions wrapped in this component are simply hidden for them.
 *
 * Note: this is a UX convenience only. The backend RBAC middleware remains the
 * real authorization boundary.
 */
const AdminOnly: FC<AdminOnlyProps> = ({ children, fallback = null }) => {
  const { isAdmin } = useAuth();

  return <>{isAdmin ? children : fallback}</>;
};

export default AdminOnly;
