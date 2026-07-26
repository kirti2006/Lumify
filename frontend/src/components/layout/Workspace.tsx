import { useState, useEffect, type ReactNode } from "react";
import { Bell, Moon, Sun, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { api } from "../../lib/api";

export function Workspace({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("lumify-theme");
    if (saved) return saved === "dark";
    if (typeof document !== 'undefined') return document.documentElement.classList.contains("dark");
    return true;
  });
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    api.get("/auth/profile").then(res => setProfile(res.data.data)).catch(console.error);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("lumify-theme", dark ? "dark" : "light");
  }, [dark]);

  const initials = profile?.fullName
    ? profile.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'US';

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-950 dark:bg-zinc-950 dark:text-white">
      <Sidebar open={open} close={() => setOpen(false)} collapsed={collapsed} toggleCollapse={() => setCollapsed(!collapsed)} />
      <div className={collapsed ? "min-h-screen transition-all duration-200 md:ml-20" : "min-h-screen transition-all duration-200 md:ml-[268px]"}>
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-200/60 bg-white/85 px-4 backdrop-blur-xl md:px-8 dark:border-white/[0.06] dark:bg-zinc-950/85">
          <button
            className="mr-3 grid size-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 md:hidden dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="top-title mr-auto">
            <h1 className="text-base font-bold tracking-tight md:text-lg">{title}</h1>
          </div>
          <div className="top-actions flex items-center gap-2">
            <button
              className="grid size-10 place-items-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
              onClick={() => setDark(!dark)}
              aria-label="Toggle theme"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link
              to="/app/notifications"
              className="notification relative grid size-10 place-items-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <i className="absolute right-2.5 top-2.5 size-1.5 rounded-full bg-red-500" />
            </Link>
            <Link
              className="user-chip flex items-center gap-2.5 border-l border-slate-200/60 pl-3 text-sm font-semibold text-slate-900 no-underline dark:border-white/[0.06] dark:text-white"
              to="/app/profile"
            >
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="size-8 rounded-full object-cover" />
              ) : (
                <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white">
                  {initials}
                </span>
              )}
              <b className="hidden sm:block">{profile?.fullName || 'User'}</b>
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
          <div>{children}</div>
        </main>
      </div>
    </div>
  );
}
