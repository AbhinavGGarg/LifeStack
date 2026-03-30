"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProductApp } from "@/components/ProductAppProvider";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Trajectory", href: "/trajectory" },
  { label: "Opportunities", href: "/opportunities" },
  { label: "Tracker", href: "/tracker" },
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
    <aside className="w-full border-b border-white/10 bg-slate-950/80 px-4 py-4 backdrop-blur-xl md:sticky md:top-0 md:h-screen md:w-72 md:border-b-0 md:border-r">
      <div className="flex h-full flex-col">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/70">LifeStack</p>
          <h1 className="mt-1 text-lg font-semibold text-white">Student OS</h1>
          <p className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
            {user.profile.name} • {user.profile.grade}
          </p>
        </div>

        <nav className="grid grid-cols-2 gap-2 md:grid-cols-1">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "border border-cyan-300/40 bg-cyan-300/15 text-cyan-100"
                    : "border border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white"
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
          className="mt-6 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-rose-300/35 hover:bg-rose-300/10 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-65 md:mt-auto"
        >
          {loggingOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </aside>
  );
}
