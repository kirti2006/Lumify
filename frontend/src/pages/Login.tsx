import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { setToken } from '../lib/auth';

export function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
      console.error("Login error:", err);
      let msg = 'Login failed';
      if (err.response?.status === 401) {
          msg = "Invalid email or password (User not found).";
      } else if (err.response?.data?.error?.message) {
          msg = err.response.data.error.message;
      } else if (err.response?.data?.message) {
          msg = err.response.data.message;
      } else if (err.message) {
          msg = err.message;
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

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