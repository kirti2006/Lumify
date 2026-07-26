import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layers } from 'lucide-react';
import { ThemeToggle } from '../layout/ThemeToggle';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AuthLayout({ children, title }: AuthLayoutProps) {
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  return (
    <div className="flex h-screen overflow-hidden bg-white text-slate-900 selection:bg-blue-500/30 dark:bg-[#0A0A0B] dark:text-white">
      {/* Top Left Logo */}
      <Link 
        to="/" 
        className="absolute left-6 top-6 z-50 flex items-center gap-2 transition-transform hover:scale-105 hover:opacity-80"
      >
        <div className="grid size-8 place-items-center rounded-lg bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]">
          <Layers size={18} className="text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white lg:text-white lg:dark:text-white">Lumify</span>
      </Link>

      {/* Top Right Theme Toggle */}
      <div className="absolute right-6 top-6 z-50">
        <ThemeToggle />
      </div>

      {/* Left Column: Image Background */}
      <div className="relative hidden h-full w-1/2 lg:block">
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <img
          src="/images/auth-bg.png"
          alt="AI Abstract Mesh"
          className="h-full w-full object-cover"
        />
        
        {/* Overlay Content */}
        <div className="absolute bottom-12 left-12 z-20 max-w-lg">
          <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
            Create Your Vision
          </h1>
          <p className="text-lg text-slate-300">
            AI-assisted workspace to craft, analyze, and elevate your interview skills and technical ideas.
          </p>
        </div>
      </div>

      {/* Right Column: Form Area */}
      <div className="flex h-full w-full flex-col items-center px-6 py-12 lg:w-1/2 overflow-y-auto">
        <div className="w-full max-w-md my-auto">
          {/* Top Nav Toggle */}
          <div className="mb-12 flex justify-center">
            <div className="flex rounded-full bg-slate-100 p-1 shadow-inner border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
              <Link
                to="/register"
                className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
                  !isLogin
                    ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Sign Up
              </Link>
              <Link
                to="/login"
                className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
                  isLogin
                    ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Log In
              </Link>
            </div>
          </div>

          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h2>

          <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-8 shadow-2xl backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/50">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
