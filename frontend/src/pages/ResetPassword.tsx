import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthLayout } from '../components/auth/AuthLayout';

export function ResetPassword() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Invalid or missing reset token.');
      return;
    }
    setLoading(true);
    try {
      const { api } = await import('../lib/api');
      await api.post('/auth/reset-password', { token, newPassword: password });
      setSuccess(true);
      toast.success('Password reset successfully!');
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Failed to reset password';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title="All Done!">
        <p className="mb-6 text-center text-sm leading-relaxed text-slate-400">
          Your password has been reset successfully. You can now log in with your new password.
        </p>
        <button
          onClick={() => nav('/login')}
          className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]"
        >
          Proceed to Log In
        </button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password">
      <p className="mb-6 text-center text-sm text-slate-400">
        Make sure it's at least 8 characters long.
      </p>
      <form onSubmit={handleReset} className="grid gap-5">
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold text-slate-300">New Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="min-h-12 w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-blue-500 focus:bg-slate-900 focus:ring-1 focus:ring-blue-500"
            placeholder="Enter new password"
            minLength={8}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:opacity-50"
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </AuthLayout>
  );
}
