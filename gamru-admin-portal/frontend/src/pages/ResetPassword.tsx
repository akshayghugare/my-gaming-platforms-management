import { useState, type FC, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiService from '@/services/api';
import ButtonLoader from '@/components/ButtonLoader';
import type { ApiError } from '@/types';

const ResetPassword: FC = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');

  const navigate = useNavigate();
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleReset = async (e: FormEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      return toast.error('All fields are required');
    }

    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }

    try {
      setLoading(true);

      const response = await apiService.post('/auth/reset-password', {
        email,
        token: '',
        new_password: password,
      });

      if (response?.success) {
        toast.success('Password reset successful');
        navigate('/login');
      } else {
        toast.error(response?.message || 'Reset failed');
      }
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(apiErr?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  console.log('ResetPassword email param:', email);
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="bg-slate-900 p-8 rounded-xl w-96 space-y-4">
        <h2 className="text-2xl font-bold text-center">Reset Password</h2>

        <p className="text-sm text-gray-400 text-center break-all">{email}</p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 bg-slate-800 rounded outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="New Password"
        />

        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full p-3 bg-slate-800 rounded outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Confirm Password"
        />

        {/* Inline validation message */}
        {confirmPassword && password !== confirmPassword && (
          <p className="text-red-500 text-sm">Passwords do not match</p>
        )}

        <button
          className="w-full bg-blue-600 p-2 rounded flex items-center justify-center gap-1 disabled:opacity-50"
          onClick={handleReset}
          disabled={loading}
          type="button"
        >
          {loading ? <ButtonLoader /> : 'Reset Password'}
        </button>
      </div>
    </div>
  );
};

export default ResetPassword;
