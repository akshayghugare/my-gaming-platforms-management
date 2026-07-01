import { useState, type FC } from 'react';
import { toast } from 'react-toastify';
import apiService from '@/services/api';
import ModalInput from '@/components/inputs/ModalInput';
import ProfileModalShell from './ProfileModalShell';

interface Props {
  onClose: () => void;
}

const ChangePasswordModal: FC<Props> = ({ onClose }) => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (): Promise<void> => {
    const e: Record<string, string> = {};
    if (!current) e.current = 'Current password is required';
    if (next.length < 6) e.next = 'New password must be at least 6 characters';
    if (next && next === current) e.next = 'New password must differ from the current one';
    if (confirm !== next) e.confirm = 'Passwords do not match';
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      const res = await apiService.post('/users/me/change-password', {
        current_password: current,
        new_password: next,
      });
      if (res?.success) {
        toast.success('Password changed successfully');
        onClose();
      } else {
        setErrors({ current: res?.message || 'Failed to change password' });
      }
    } catch (err) {
      const ex = err as { message?: string; errors?: Record<string, string> };
      setErrors({
        current: ex?.errors?.current_password || ex?.message || 'Failed to change password',
        next: ex?.errors?.new_password || '',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProfileModalShell
      title="Change Password"
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={loading}
      submitLabel="Update Password"
    >
      <ModalInput
        label="Current Password"
        type="password"
        value={current}
        onChange={setCurrent}
        error={errors.current}
      />
      <ModalInput
        label="New Password"
        type="password"
        value={next}
        onChange={setNext}
        error={errors.next}
      />
      <ModalInput
        label="Confirm New Password"
        type="password"
        value={confirm}
        onChange={setConfirm}
        error={errors.confirm}
      />
    </ProfileModalShell>
  );
};

export default ChangePasswordModal;
