import { Link } from "react-router-dom";
import { Sparkles, Sun, Moon, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

export function Logo({ disableLink = false }: { disableLink?: boolean }) {
  const content = (
    <>
      <span className="logo-icon grid size-[30px] place-items-center rounded-[9px] bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm">
        <Sparkles size={15} fill="currentColor" />
      </span>
      <span>Lumify</span>
    </>
  );

  return disableLink ? (
    <div
      className="inline-flex items-center gap-2.5 text-[20px] font-bold tracking-tight text-slate-950 dark:text-white"
      style={{ cursor: "default" }}
    >
      {content}
    </div>
  ) : (
    <Link
      to="/"
      className="inline-flex items-center gap-2.5 text-[20px] font-bold tracking-tight text-slate-950 no-underline dark:text-white"
    >
      {content}
    </Link>
  );
}

/* ============================================================
   FLOATING PILL NAVBAR — Apple-minimal style
   ============================================================ */
export function PublicNav() {
  const [dark, setDark] = useState(
    localStorage.getItem("lumify-theme") === "dark" ||
      document.documentElement.classList.contains("dark"),
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("lumify-theme", dark ? "dark" : "light");
  }, [dark]);

  const navLinks = [
    ["#how", "How it works"],
    ["#features", "Features"],
    ["#pricing", "Pricing"],
  ];

  return (
    <div className="sticky top-0 z-50 flex justify-center px-4 pt-4">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between rounded-full border border-slate-200/60 bg-white/80 px-2 py-1.5 shadow-lg shadow-black/[0.03] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.03] dark:shadow-black/20">
        {/* Logo */}
        <div className="pl-3">
          <Logo />
        </div>

        {/* Center Nav — Desktop */}
        <nav
          aria-label="Primary"
          className="hidden items-center gap-0.5 md:flex"
        >
          {navLinks.map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="rounded-full px-4 py-2 text-[13px] font-semibold text-slate-600 no-underline transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setDark(!dark)}
            className="grid size-9 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Toggle color theme"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <Link
            className="hidden text-[13px] font-semibold text-slate-600 no-underline transition-colors hover:text-slate-950 sm:inline-flex sm:items-center sm:rounded-full sm:px-3 sm:py-2 dark:text-slate-300 dark:hover:text-white"
            to="/login"
          >
            Log in
          </Link>
          <Link
            className="inline-flex min-h-9 items-center justify-center rounded-full bg-slate-900 px-4 text-[13px] font-semibold text-white no-underline shadow-sm transition-colors hover:bg-slate-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-slate-200"
            to="/register"
          >
            Get started
          </Link>
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="grid size-9 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 md:hidden dark:text-slate-400 dark:hover:bg-white/10"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Dropdown */}
      {mobileOpen && (
        <div className="absolute left-4 right-4 top-[68px] z-50 rounded-2xl border border-slate-200/60 bg-white/95 p-4 shadow-xl backdrop-blur-xl md:hidden dark:border-white/[0.08] dark:bg-zinc-900/95">
          <nav className="grid gap-1">
            {navLinks.map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 no-underline transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/10"
              >
                {label}
              </a>
            ))}
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 no-underline transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/10"
            >
              Log in
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   FOOTER
   ============================================================ */
export function Footer() {
  const groups = [
    {
      title: "Product",
      links: [
        ["#features", "Features"],
        ["#how", "How it works"],
        ["#pricing", "Pricing"],
      ],
    },
    {
      title: "Resources",
      links: [
        ["#", "Blog"],
        ["#", "Interview Guides"],
        ["#", "Help Center"],
      ],
    },
    {
      title: "Legal",
      links: [
        ["#", "Privacy Policy"],
        ["#", "Terms of Service"],
        ["#", "Contact Us"],
      ],
    },
  ];

  return (
    <footer className="border-t border-slate-200/60 bg-white px-6 py-16 text-slate-500 dark:border-white/[0.06] dark:bg-zinc-950 dark:text-slate-400">
      <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2">
          <div className="mb-5">
            <Logo />
          </div>
          <p className="max-w-sm text-sm leading-relaxed">
            AI-powered interview practice that adapts to your career goals and
            helps you show up prepared.
          </p>
        </div>
        {groups.map((group) => (
          <div key={group.title}>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              {group.title}
            </h4>
            <ul className="grid gap-3">
              {group.links.map(([href, label]) => (
                <li key={label}>
                  <a
                    href={href}
                    className="text-sm no-underline transition-colors hover:text-slate-900 dark:hover:text-white"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-14 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-slate-200/60 pt-8 text-sm md:flex-row dark:border-white/[0.06]">
        <p>&copy; {new Date().getFullYear()} Lumify Inc. All rights reserved.</p>
        <div className="flex gap-5">
          <a
            href="#"
            aria-label="Twitter"
            className="transition-colors hover:text-slate-900 dark:hover:text-white"
          >
            Twitter
          </a>
          <a
            href="#"
            aria-label="GitHub"
            className="transition-colors hover:text-slate-900 dark:hover:text-white"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
