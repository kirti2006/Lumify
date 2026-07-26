import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { AuthLayout } from '../components/auth/AuthLayout';

export function ForgotPassword() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Handle Send Reset OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { api } = await import('../lib/api');
      await api.post('/auth/forgot-password', { email });
      setStep(2);
      toast.success('Reset code sent to your email.');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Input Change
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^[a-zA-Z0-9]*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter' && otp.every((d) => d)) {
      setStep(3);
    }
  };

  const handleVerifyOtp = () => {
    if (otp.some((d) => !d)) {
      toast.error('Please enter the full 6-digit code.');
      return;
    }
    setStep(3);
  };

  // Handle Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { api } = await import('../lib/api');
      const code = otp.join('');
      await api.post('/auth/reset-password', { email, code: code, newPassword: password });
      setStep(4);
      toast.success('Password reset successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={
      step === 1 ? "Reset Password" : 
      step === 2 ? "Enter Security Code" : 
      step === 3 ? "Choose New Password" : 
      "All Done!"
    }>
      
      {step === 1 && (
        <>
          <p className="mb-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Enter your email and we'll send you a 6-digit code to reset your password.
          </p>
          <form onSubmit={handleSendOtp} className="grid gap-5">
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
            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:opacity-50"
            >
              {loading ? 'Sending code...' : 'Send Reset Code'}
            </button>
          </form>
          <div className="mt-6 flex justify-center">
            <Link to="/login" className="text-sm font-medium text-blue-500 hover:text-blue-400">
              Back to Log In
            </Link>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <p className="mb-8 text-center text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            We sent a 6-digit code to <b className="text-slate-900 dark:text-white">{email}</b>. Enter it below to verify your identity.
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
            disabled={otp.some(d => !d)}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:opacity-50"
          >
            Verify Code
          </button>
          <div className="mt-6 flex justify-center">
            <button onClick={() => setStep(1)} className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors dark:text-slate-400 dark:hover:text-white">
              Wrong email? Go back
            </button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <p className="mb-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Code verified. Please choose a new, secure password.
          </p>
          <form onSubmit={handleResetPassword} className="grid gap-5">
            <label className="grid gap-1.5">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">New Password</span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 pr-12 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
                  placeholder="Enter new password"
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
            </label>
            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </>
      )}

      {step === 4 && (
        <div className="mt-4">
          <p className="mb-6 text-center text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Your password has been reset successfully. You can now securely log in to your account.
          </p>
          <Link
            to="/login"
            className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]"
          >
            Proceed to Log In
          </Link>
        </div>
      )}

    </AuthLayout>
  );
}
