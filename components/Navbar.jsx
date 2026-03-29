export default function Navbar({ user, onLogout, isLoggingOut }) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/70">LifeStack</p>
          <h1 className="text-lg font-semibold text-white">Student Operating System</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-right md:block">
            <p className="text-sm font-medium text-white">{user?.profile?.name || "Student"}</p>
            <p className="text-xs text-slate-300">
              {user?.profile?.grade || "N/A"} • {user?.email}
            </p>
          </div>

          <button
            type="button"
            onClick={onLogout}
            disabled={isLoggingOut}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-rose-300/40 hover:bg-rose-300/10 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </div>
    </header>
  );
}
