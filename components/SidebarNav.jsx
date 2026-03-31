"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProductApp } from "@/components/ProductAppProvider";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Trajectory", href: "/trajectory" },
  { label: "Opportunities", href: "/opportunities" },
  { label: "Tracker", href: "/tracker" },
  { label: "Aria", href: "/aria", newTab: true },
  { label: "Profile", href: "/profile" },
];

function isActive(pathname, href) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname.startsWith(href);
}

export default function SidebarNav() {
  const pathname = usePathname();
  const { user, logout, loggingOut } = useProductApp();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur-xl md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-sky-600/80">LifeStack</p>
            <h1 className="mt-1 text-lg font-semibold text-slate-900">Student OS</h1>
          </div>
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {user.profile.name} • {user.profile.grade}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav className="flex flex-wrap gap-2">
          {navItems.map((item) => {
            if (item.newTab) {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                >
                  {item.label}
                </a>
              );
            }

            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "border border-sky-300 bg-sky-50 text-sky-800"
                    : "border border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          </nav>

          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-65"
          >
            {loggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </div>
    </header>
  );
}
