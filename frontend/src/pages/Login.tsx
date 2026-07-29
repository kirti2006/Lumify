import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail } from 'lucide-react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { setToken } from '../lib/auth';

export function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // OTP verification state
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resending, setResending] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { api } = await import('../lib/api');
      const res = await api.post('/auth/login', { email, password });
      const token = res.data?.data?.accessToken;
      if (token) setToken(token);
      nav('/app');
    } catch (err: any) {
      const code = err.response?.data?.error?.code;
      if (code === 'UNVERIFIED_EMAIL') {
        // Show OTP panel instead of just an error toast
        setShowOtp(true);
        toast.info('Please verify your email. Enter the OTP sent to your inbox.');
      } else {
        let msg = 'Login failed';
        if (err.response?.status === 401) {
          msg = 'Invalid email or password.';
        } else if (err.response?.data?.error?.message) {
          msg = err.response.data.error.message;
        } else if (err.response?.data?.message) {
          msg = err.response.data.message;
        } else if (err.message) {
          msg = err.message;
        }
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^[a-zA-Z0-9]*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter' && otp.every((d) => d)) {
      handleVerifyOtp();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }
    setLoading(true);
    try {
      const { api } = await import('../lib/api');
      const res = await api.post('/auth/verify-email', { email, code });
      const token = res.data?.data?.accessToken;
      if (token) setToken(token);
      toast.success('Email verified! Welcome to Lumify 🎉');
      nav('/app');
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Invalid or expired code';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Please enter your email first');
      return;
    }
    setResending(true);
    try {
      const { api } = await import('../lib/api');
      await api.post('/auth/resend-verification', { email });
      toast.success('Verification email sent! Check your inbox.');
    } catch (err: any) {
      toast.error('Failed to resend email. Try again.');
    } finally {
      setResending(false);
    }
  };

  // ── OTP Verification Panel ──────────────────────────────────────────────
  if (showOtp) {
    return (
      <AuthLayout title="Verify your email">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <Mail className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            We sent a 6-digit code to <span className="font-semibold text-slate-700 dark:text-slate-200">{email}</span>
          </p>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { otpRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(i, e)}
              className="h-12 w-12 rounded-xl border-2 border-slate-300 bg-white text-center text-lg font-bold text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-800"
            />
          ))}
        </div>

        <button
          onClick={handleVerifyOtp}
          disabled={loading || otp.some((d) => !d)}
          className="mt-2 flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify & Sign In'}
        </button>

        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => setShowOtp(false)}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            ← Back to login
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="font-medium text-blue-500 hover:text-blue-400 disabled:opacity-50"
          >
            {resending ? 'Sending...' : 'Resend code'}
          </button>
        </div>
      </AuthLayout>
    );
  }

  // ── Normal Login Form ───────────────────────────────────────────────────
  return (
    <AuthLayout title="Welcome back">
      <p className="mb-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Welcome back! Please enter your details to sign in.
      </p>
      <form onSubmit={handleLogin} className="grid gap-5">
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
            placeholder="you@company.com"
          />
        </label>
        <label className="grid gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</span>
            <Link to="/forgot-password" className="text-xs font-medium text-blue-500 hover:text-blue-400">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 pr-12 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </AuthLayout>
  );
}