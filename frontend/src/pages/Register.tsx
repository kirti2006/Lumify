import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { setToken } from '../lib/auth';

export function Register() {
  const nav = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score; // 0 to 4
  };

  const strength = getPasswordStrength(password);
  
  const getStrengthLabel = () => {
    if (password.length === 0) return '';
    if (strength <= 2) return 'Weak';
    if (strength === 3) return 'Good';
    return 'Strong';
  };

  const getStrengthColor = () => {
    if (strength <= 2) return 'bg-red-500';
    if (strength === 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (strength < 3) {
      toast.error('Please choose a stronger password (must contain at least 8 chars, 1 uppercase, 1 number, and 1 special character)');
      return;
    }
    
    setLoading(true);
    try {
      const { api } = await import('../lib/api');
      await api.post('/auth/signup', { fullName: name, email, password });
      setStep(2);
      toast.success('Account created! Please check your email for the verification code.');
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Registration failed';
      toast.error(msg);
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

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter' && otp.every((d) => d)) {
      handleVerifyOtp();
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.some((d) => !d)) {
      toast.error('Please enter the full 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      const { api } = await import('../lib/api');
      const code = otp.join('');
      const res = await api.post('/auth/verify-email', { email, code });
      const token = res.data?.data?.accessToken;
      if (token) setToken(token);
      toast.success('Email verified successfully!');
      nav('/app');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const { api } = await import('../lib/api');
      await api.post('/auth/resend-verification', { email });
      toast.success('Verification code resent.');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={step === 1 ? "Create an Account" : "Verify Your Email"}>
      {step === 1 && (
        <>
          <p className="mb-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Join Lumify to start practicing and crafting your ideas.
          </p>
          <form onSubmit={handleRegister} className="grid gap-5">
            <label className="grid gap-1.5">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
                placeholder="Alex Stone"
              />
            </label>
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
              <div className="flex justify-between items-end">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</span>
                <span className={`text-xs font-medium ${strength <= 2 ? 'text-red-500 dark:text-red-400' : strength === 3 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                  {getStrengthLabel()}
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 pr-12 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
                  placeholder="Create a password"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {/* Strength Bar */}
              {password.length > 0 && (
                <div className="mt-1 flex gap-1 h-1 w-full rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                  <div className={`h-full ${getStrengthColor()} transition-all duration-300 ${strength >= 1 ? 'w-1/4' : 'w-0'}`} />
                  <div className={`h-full ${getStrengthColor()} transition-all duration-300 ${strength >= 2 ? 'w-1/4' : 'w-0'}`} />
                  <div className={`h-full ${getStrengthColor()} transition-all duration-300 ${strength >= 3 ? 'w-1/4' : 'w-0'}`} />
                  <div className={`h-full ${getStrengthColor()} transition-all duration-300 ${strength >= 4 ? 'w-1/4' : 'w-0'}`} />
                </div>
              )}
            </label>
            
            <label className="grid gap-1.5">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Confirm Password</span>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`min-h-12 w-full rounded-xl border bg-white dark:bg-slate-900/50 px-4 pr-12 text-sm text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 ${
                    confirmPassword && password !== confirmPassword 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                    : 'border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <span className="text-xs text-red-500 dark:text-red-400 mt-0.5">Passwords do not match</span>
              )}
            </label>
            
            <button
              type="submit"
              disabled={loading || (password.length > 0 && password !== confirmPassword)}
              className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create an Account'}
            </button>
            
            <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-500">
              By creating an account, you agree to our{' '}
              <Link to="/terms" target="_blank" className="text-blue-500 hover:underline">
                Terms & Conditions
              </Link>{' '}
              and{' '}
              <Link to="/privacy" target="_blank" className="text-blue-500 hover:underline">
                Privacy Policy
              </Link>.
            </p>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <p className="mb-8 text-center text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            We sent a 6-digit verification code to <b className="text-slate-900 dark:text-white">{email}</b>. Enter it below to verify your account.
          </p>
          
          <div className="flex justify-center gap-2 sm:gap-3 mb-8">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { otpRefs.current[idx] = el; }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                className="size-11 sm:size-12 rounded-xl border border-slate-300 bg-white text-center text-xl font-semibold text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white dark:focus:bg-slate-900"
              />
            ))}
          </div>
          
          <button
            onClick={handleVerifyOtp}
            disabled={otp.some(d => !d) || loading}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
          
          <div className="mt-6 flex flex-col items-center gap-4">
            <button 
              onClick={handleResendOtp}
              disabled={loading}
              className="text-sm font-medium text-blue-500 hover:text-blue-400 transition-colors"
            >
              Didn't get the code? Resend
            </button>
            <button 
              onClick={() => setStep(1)} 
              className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors dark:text-slate-400 dark:hover:text-white"
            >
              Wrong email? Go back
            </button>
          </div>
        </>
      )}
    </AuthLayout>
  );
}
