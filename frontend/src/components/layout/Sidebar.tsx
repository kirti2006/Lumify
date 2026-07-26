import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarPlus,
  Clock3,
  LineChart,
  FileText,
  UserRound,
  Settings,
  Zap,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react";
import { Logo } from "../layout";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";

const nav = [
  { to: "/app", icon: LayoutDashboard, label: "Overview", color: "text-blue-500 dark:text-blue-400" },
  { to: "/app/schedule", icon: CalendarPlus, label: "Schedule", color: "text-emerald-500 dark:text-emerald-400" },
  { to: "/app/history", icon: Clock3, label: "Interview history", color: "text-amber-500 dark:text-amber-400" },
  { to: "/app/analytics", icon: LineChart, label: "Analytics", color: "text-cyan-500 dark:text-cyan-400" },
  { to: "/app/reports", icon: FileText, label: "Reports", color: "text-rose-500 dark:text-rose-400" },
];

export function Sidebar({ open, close, collapsed, toggleCollapse }: { open: boolean; close: () => void; collapsed?: boolean; toggleCollapse?: () => void }) {
  return (
    <>
      {open && (
        <button
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={close}
          aria-label="Close navigation overlay"
        />
      )}
      <aside
        className={collapsed
          ? "fixed inset-y-0 left-0 z-40 flex w-20 flex-col border-r border-slate-200/60 bg-white transition-all duration-200 dark:border-white/[0.06] dark:bg-zinc-950 " + (open ? "translate-x-0 shadow-2xl md:shadow-none" : "-translate-x-full md:translate-x-0")
          : "fixed inset-y-0 left-0 z-40 flex w-[268px] flex-col border-r border-slate-200/60 bg-white transition-all duration-200 dark:border-white/[0.06] dark:bg-zinc-950 " + (open ? "translate-x-0 shadow-2xl md:shadow-none" : "-translate-x-full md:translate-x-0")
        }
      >
        <div className={`flex items-center p-4 pb-7 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed ? (
            <Link to="/app" className="no-underline">
              <Logo disableLink />
            </Link>
          ) : (
            <Link to="/app" className="grid size-[30px] place-items-center rounded-[9px] bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm">
              <Zap size={15} fill="currentColor" />
            </Link>
          )}
          <div className="flex gap-2">
            {!collapsed && toggleCollapse && (
              <button
                className="hidden grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900 md:grid dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white"
                onClick={toggleCollapse}
                aria-label="Collapse sidebar"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            <button
              className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900 md:hidden dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white"
              onClick={close}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {collapsed && toggleCollapse && (
          <button
             className="mx-auto mb-4 hidden grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900 md:grid dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white"
             onClick={toggleCollapse}
             aria-label="Expand sidebar"
          >
             <ChevronRight size={16} />
          </button>
        )}

        {!collapsed && (
          <p className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Workspace
          </p>
        )}
        <nav className={`mt-2 flex flex-col items-center gap-1 ${collapsed ? '' : 'px-2'}`}>
          {nav.map((item) => {
            const link = (
              <NavLink
                onClick={close}
                end={item.to === "/app"}
                key={item.to}
                to={item.to}
                className={
                  collapsed 
                    ? "flex items-center justify-center size-10 mx-auto rounded-xl font-semibold no-underline transition-all text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    : ({ isActive }) =>
                        `flex min-h-10 items-center rounded-xl font-semibold no-underline transition-all gap-3 px-3 w-full text-[13px] ${
                          isActive
                            ? "bg-blue-50/80 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
                        }`
                }
              >
                <item.icon size={17} className={item.color} />
                {!collapsed && item.label}
              </NavLink>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.to}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }
            return link;
          })}
        </nav>

        {!collapsed && (
          <p className="mt-6 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Account
          </p>
        )}
        <nav className={`mt-2 flex flex-col items-center gap-1 ${collapsed ? '' : 'px-2'}`}>
          {(() => {
            const profileLink = (
              <NavLink
                onClick={close}
                to="/app/profile"
                className={
                  collapsed 
                    ? "flex items-center justify-center size-10 mx-auto rounded-xl font-semibold no-underline transition-all text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    : ({ isActive }) =>
                        `flex min-h-10 items-center rounded-xl font-semibold no-underline transition-all gap-3 px-3 w-full text-[13px] ${
                          isActive
                            ? "bg-blue-50/80 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
                        }`
                }
              >
                <UserRound size={17} className="text-violet-500 dark:text-violet-400" />
                {!collapsed && "Profile"}
              </NavLink>
            );
            
            const settingsLink = (
              <NavLink
                onClick={close}
                to="/app/settings"
                className={
                  collapsed 
                    ? "flex items-center justify-center size-10 mx-auto rounded-xl font-semibold no-underline transition-all text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    : ({ isActive }) =>
                        `flex min-h-10 items-center rounded-xl font-semibold no-underline transition-all gap-3 px-3 w-full text-[13px] ${
                          isActive
                            ? "bg-blue-50/80 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
                        }`
                }
              >
                <Settings size={17} className="text-slate-400 dark:text-slate-500" />
                {!collapsed && "Settings"}
              </NavLink>
            );

            if (collapsed) {
              return (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>{profileLink}</TooltipTrigger>
                    <TooltipContent side="right">Profile</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>{settingsLink}</TooltipTrigger>
                    <TooltipContent side="right">Settings</TooltipContent>
                  </Tooltip>
                </>
              );
            }
            return (
              <>
                {profileLink}
                {settingsLink}
              </>
            );
          })()}
        </nav>

        {!collapsed && (
          <div className="mt-auto mx-4 mb-4 rounded-2xl border border-slate-200/60 bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 dark:border-white/[0.06] dark:from-white/[0.03] dark:to-blue-500/[0.03]">
            <div className="flex gap-3 text-blue-600 dark:text-blue-400">
              <Zap size={16} />
              <div>
                <b className="block text-sm text-slate-900 dark:text-white">Free plan</b>
                <small className="text-xs text-slate-500 dark:text-slate-400">2 of 3 sessions used</small>
              </div>
            </div>
            <Link
              to="/app/pricing"
              className="mt-3 flex items-center text-sm font-semibold text-blue-600 no-underline transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Upgrade plan <ChevronRight size={15} />
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
