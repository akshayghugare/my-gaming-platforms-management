import { useState, type FC } from 'react';
import { toast } from 'react-toastify';
import apiService from '@/services/api';
import ModalInput from '@/components/inputs/ModalInput';
import ProfileModalShell from './ProfileModalShell';

interface Props {
  currentEmail: string;
  onClose: () => void;
  onSaved: (email: string) => void;
}

const ChangeEmailModal: FC<Props> = ({ currentEmail, onClose, onSaved }) => {
  const [email, setEmail] = useState(currentEmail);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (): Promise<void> => {
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address');
      return;
    }
    if (trimmed === currentEmail.toLowerCase()) {
      setError('This is already your email');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await apiService.patch('/users/me', { email: trimmed });
      if (res?.success) {
        toast.success('Email updated successfully');
        onSaved(trimmed);
        onClose();
      } else {
        setError(res?.message || 'Failed to update email');
      }
    } catch (err) {
      const e = err as { message?: string; errors?: Record<string, string> };
      setError(e?.errors?.email || e?.message || 'Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProfileModalShell
      title="Change Email"
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={loading}
    >
      <ModalInput
        label="New Email"
        type="email"
        value={email}
        onChange={setEmail}
        error={error}
        placeholder="you@example.com"
      />
    </ProfileModalShell>
  );
};

export default ChangeEmailModal;
