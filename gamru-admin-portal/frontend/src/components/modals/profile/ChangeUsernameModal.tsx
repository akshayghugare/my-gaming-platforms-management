import { useState, type FC } from 'react';
import { toast } from 'react-toastify';
import apiService from '@/services/api';
import ModalInput from '@/components/inputs/ModalInput';
import ProfileModalShell from './ProfileModalShell';

interface Props {
  currentUsername: string;
  onClose: () => void;
  onSaved: (username: string) => void;
}

const ChangeUsernameModal: FC<Props> = ({ currentUsername, onClose, onSaved }) => {
  const [username, setUsername] = useState(currentUsername);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (): Promise<void> => {
    const trimmed = username.trim();
    if (trimmed.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (trimmed === currentUsername) {
      setError('This is already your username');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await apiService.patch('/users/me', { username: trimmed });
      if (res?.success) {
        toast.success('Username updated successfully');
        onSaved(trimmed);
        onClose();
      } else {
        setError(res?.message || 'Failed to update username');
      }
    } catch (err) {
      const e = err as { message?: string; errors?: Record<string, string> };
      setError(e?.errors?.username || e?.message || 'Failed to update username');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProfileModalShell
      title="Change Username"
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={loading}
    >
      <ModalInput
        label="New Username"
        value={username}
        onChange={setUsername}
        error={error}
        placeholder="your_username"
      />
    </ProfileModalShell>
  );
};

export default ChangeUsernameModal;
