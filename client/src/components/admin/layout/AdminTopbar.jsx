import { Link } from "react-router";
import { AdminIcon } from "./adminIcons";
import AdminThemeToggle from "./AdminThemeToggle";

function AdminTopbar({ admin, onOpenNavigation, onLogout }) {
  const adminName = admin?.name || "Admin";
  const adminRole = admin?.role || "authenticated";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 shadow-sm shadow-slate-900/[0.03] backdrop-blur-xl lg:hidden">
      <div className="flex h-16 items-center gap-2.5 px-3 sm:gap-3 sm:px-5">
        <button
          aria-label="Open admin navigation"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors duration-150 motion-reduce:transition-none hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          onClick={onOpenNavigation}
          title="Open navigation"
          type="button"
        >
          <AdminIcon name="menu" size={21} />
        </button>

        <Link
          aria-label="RN — RakeshNexify Admin CMS dashboard"
          className="flex min-w-0 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          to="/admin/dashboard"
        >
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-xs font-black tracking-wide text-white shadow-sm shadow-brand-950/20"
          >
            RN
          </span>

          <span className="hidden min-w-0 sm:block">
            <span className="block truncate text-sm font-bold tracking-tight text-slate-950">
              RakeshNexify
            </span>

            <span className="block truncate text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Admin CMS
            </span>
          </span>
        </Link>

        <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2">
          <AdminThemeToggle />
          <div className="hidden min-w-0 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-1.5 text-right md:block">
            <p className="max-w-44 truncate text-xs font-semibold leading-4 text-slate-800">
              {adminName}
            </p>

            <p className="max-w-44 truncate text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">
              {adminRole}
            </p>
          </div>

          <a
            aria-label="View public website"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors duration-150 motion-reduce:transition-none hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            href="/"
            title="View Website"
          >
            <AdminIcon name="external" size={18} />
          </a>

          <button
            aria-label="Log out of admin"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors duration-150 motion-reduce:transition-none hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2"
            onClick={onLogout}
            title="Logout"
            type="button"
          >
            <AdminIcon name="logout" size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default AdminTopbar;