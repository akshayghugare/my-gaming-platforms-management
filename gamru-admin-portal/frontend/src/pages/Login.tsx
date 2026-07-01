import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import gamruLogo from '@/assets/gamruLogo.svg';

import { useAuth } from '@/context/AuthContext';
import apiService from '@/services/api';
import { encryptPassword } from '@/utils/crypto';

import ButtonLoader from '@/components/ButtonLoader';

import type { ApiError, LoginResponseData } from '@/types';

const Login = () => {
  const [email, setEmail] = useState<string>('admin@test.com');
  const [password, setPassword] = useState<string>('123456');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    try {
      setLoading(true);

      const securePassword = await encryptPassword(password);

      const response = await apiService.post<LoginResponseData>('/auth/login', {
        email,
        password: securePassword,
      });

      console.log('Login response:', response);

      if (response?.success) {
        if (response?.data?.token) {
          login(response?.data?.token);

          navigate('/dashboard');

          toast.success('Login successful');
        } else {
          toast.error('Token not found in response');

          console.error('Login failed: Token not found in response');
        }
      } else {
        toast.error(response?.message || 'Login failed');
      }
    } catch (err) {
      const apiErr = err as ApiError;

      console.error(apiErr);

      toast.error(apiErr?.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const expiry = sessionStorage.getItem('token_expiry');

    console.log('Login useEffect - token:', token, 'expiry:', expiry);

    if (token && expiry && Date.now() < Number(expiry)) {
      window.location.href = '/dashboard';
    }
  }, []);

  return (
    <div className="h-screen bg-slate-950 flex items-center justify-center px-4 overflow-hidden relative">
      {/* Background Blur */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl" />

      <div className="absolute bottom-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-5xl">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-2xl rounded-3xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 min-h-[560px]">
            {/* LEFT SIDE */}
            <div className="hidden md:flex flex-col justify-center px-10 bg-slate-900 border-r border-slate-800">
              <div>
                {/* Logo */}
                <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-2xl">
                  <img
                    src={gamruLogo}
                    alt="Gamru Logo"
                    className="w-[52px] h-[52px] object-contain"
                  />
                </div>

                {/* Heading */}
                <h1 className="flex gap-2 text-4xl font-bold text-white mt-6 leading-tight">
                  Welcome to
                  <span className="block text-blue-400">Gamru</span>
                </h1>

                {/* Description */}
                <p className="text-slate-300 text-base mt-4 leading-7">
                  Manage ranks, missions, XP points, rewards, and player engagement all in one
                  powerful dashboard platform.
                </p>

                {/* Features */}
                <div className="mt-7 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />

                    <p className="text-slate-300 text-sm">Smart Gamification System</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />

                    <p className="text-slate-300 text-sm">XP, Rewards & Level Tracking</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />

                    <p className="text-slate-300 text-sm">Real-time Engagement Dashboard</p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex items-center justify-center p-6 md:p-10">
              <div className="w-full max-w-sm">
                {/* Mobile Logo */}
                <div className="flex md:hidden justify-center mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center border border-slate-700">
                    <img
                      src={gamruLogo}
                      alt="Gamru Logo"
                      className="w-[48px] h-[48px] object-contain"
                    />
                  </div>
                </div>

                {/* Heading */}
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-white">Sign In</h2>

                  <p className="text-slate-400 mt-2 text-sm">
                    Enter your credentials to access the dashboard
                  </p>
                </div>

                {/* Form */}
                <form className="space-y-4" onSubmit={handleLogin}>
                  {/* Email */}
                  <div>
                    <label htmlFor="login-email" className="text-sm text-slate-300 mb-1.5 block">
                      Email Address
                    </label>

                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full bg-slate-800/80 border border-slate-700 text-white px-4 py-2.5 rounded-lg outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-500"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="login-password" className="text-sm text-slate-300 mb-1.5 block">
                      Password
                    </label>

                    <div className="relative">
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full bg-slate-800/80 border border-slate-700 text-white px-4 py-2.5 pr-12 rounded-lg outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  {/* Forgot Password */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="text-sm text-blue-400 hover:text-blue-300 transition"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center shadow-lg disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    {loading ? <ButtonLoader /> : 'Login'}
                  </button>
                </form>

                {/* Footer */}
                <div className="mt-7 text-center">
                  <p className="text-slate-500 text-sm">
                    © 2026 Gamru Platform. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
