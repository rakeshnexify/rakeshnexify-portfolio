import { Link } from "react-router";
import AdminNavigation from "./AdminNavigation";
import { AdminIcon } from "./adminIcons";

function AdminSidebar({
  admin,
  isPinned,
  isRailExpanded,
  onMouseEnter,
  onMouseLeave,
  onFocusCapture,
  onBlurCapture,
  onTogglePinned,
  onLogout,
}) {
  const adminName = admin?.name || "Administrator";
  const adminEmail = admin?.email || "";
  const adminRole = admin?.role || "admin";

  return (
    <aside
      aria-label="Admin sidebar"
      className={`fixed inset-y-0 left-0 z-40 hidden border-r border-slate-800/90 bg-slate-950 text-white shadow-xl shadow-slate-950/20 transition-[width,box-shadow] duration-200 ease-out motion-reduce:transition-none lg:flex lg:flex-col ${
        isRailExpanded
          ? "w-64 shadow-slate-950/30"
          : "w-[72px] shadow-slate-950/10"
      }`}
      onBlurCapture={onBlurCapture}
      onFocusCapture={onFocusCapture}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className={`flex h-16 shrink-0 items-center border-b border-slate-800/90 ${
          isRailExpanded ? "justify-between px-3" : "justify-center px-2"
        }`}
      >
        <Link
          aria-label="RN — RakeshNexify Admin CMS dashboard"
          className={`group flex min-w-0 items-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
            isRailExpanded ? "gap-2.5" : "justify-center"
          }`}
          to="/admin/dashboard"
        >
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-sm font-extrabold tracking-tight text-white shadow-md shadow-brand-950/30"
          >
            RN
          </span>

          <span
            className={`min-w-0 overflow-hidden transition-[width,opacity] duration-150 motion-reduce:transition-none ${
              isRailExpanded ? "w-36 opacity-100" : "w-0 opacity-0"
            }`}
          >
            <span className="block truncate text-sm font-bold tracking-tight text-white">
              RakeshNexify
            </span>

            <span className="block truncate text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Admin CMS
            </span>
          </span>
        </Link>

        {isRailExpanded ? (
          <button
            aria-label={isPinned ? "Unpin admin sidebar" : "Pin admin sidebar"}
            aria-pressed={isPinned}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
              isPinned
                ? "bg-brand-500/15 text-brand-300 hover:bg-brand-500/20"
                : "text-slate-500 hover:bg-white/[0.07] hover:text-white"
            }`}
            onClick={onTogglePinned}
            title={isPinned ? "Unpin sidebar" : "Pin sidebar open"}
            type="button"
          >
            <AdminIcon name="pin" size={17} />
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overscroll-contain overflow-x-visible overflow-y-auto py-3 [scrollbar-color:rgb(51_65_85)_transparent] [scrollbar-width:thin]">
        <AdminNavigation
          className={isRailExpanded ? "px-2.5" : "px-2"}
          isRailExpanded={isRailExpanded}
          role={adminRole}
        />
      </div>

      <div className="shrink-0 border-t border-slate-800/90 bg-slate-950 p-2">
        <div className="space-y-1">
          <a
            className={`group relative flex min-h-10 items-center rounded-xl text-sm font-medium text-slate-300 transition-colors duration-150 motion-reduce:transition-none hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
              isRailExpanded ? "px-3" : "justify-center px-2"
            }`}
            href="/"
            title={!isRailExpanded ? "View Website" : undefined}
          >
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center text-slate-400 transition-colors duration-150 motion-reduce:transition-none group-hover:text-slate-200"
            >
              <AdminIcon name="external" size={18} />
            </span>

            <span
              className={`min-w-0 truncate transition-[width,opacity,margin] duration-150 motion-reduce:transition-none ${
                isRailExpanded
                  ? "ml-2.5 w-auto flex-1 opacity-100"
                  : "ml-0 w-0 overflow-hidden opacity-0"
              }`}
            >
              View Website
            </span>

            {!isRailExpanded ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-[calc(100%+0.65rem)] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-xl group-hover:block group-focus-visible:block"
              >
                View Website
              </span>
            ) : null}
          </a>

          <div
            className={`flex min-h-12 items-center rounded-xl border border-transparent bg-white/[0.035] ${
              isRailExpanded ? "px-3" : "justify-center px-2"
            }`}
          >
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-300"
            >
              <AdminIcon name="account" size={17} />
            </span>

            <div
              className={`min-w-0 transition-[width,opacity,margin] duration-150 motion-reduce:transition-none ${
                isRailExpanded
                  ? "ml-2.5 w-auto flex-1 opacity-100"
                  : "ml-0 w-0 overflow-hidden opacity-0"
              }`}
            >
              <p className="truncate text-xs font-semibold text-slate-100">
                {adminName}
              </p>

              <p className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                {adminRole}
              </p>

              {adminEmail ? (
                <p className="mt-0.5 truncate text-[10px] text-slate-600">
                  {adminEmail}
                </p>
              ) : null}
            </div>
          </div>

          <button
            className={`group relative flex min-h-10 w-full items-center rounded-xl text-sm font-medium text-slate-400 transition-colors duration-150 motion-reduce:transition-none hover:bg-red-500/10 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 ${
              isRailExpanded ? "px-3" : "justify-center px-2"
            }`}
            onClick={onLogout}
            title={!isRailExpanded ? "Logout" : undefined}
            type="button"
          >
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center"
            >
              <AdminIcon name="logout" size={18} />
            </span>

            <span
              className={`min-w-0 truncate text-left transition-[width,opacity,margin] duration-150 motion-reduce:transition-none ${
                isRailExpanded
                  ? "ml-2.5 w-auto flex-1 opacity-100"
                  : "ml-0 w-0 overflow-hidden opacity-0"
              }`}
            >
              Logout
            </span>

            {!isRailExpanded ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-[calc(100%+0.65rem)] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-xl group-hover:block group-focus-visible:block"
              >
                Logout
              </span>
            ) : null}
          </button>
        </div>
      </div>
    </aside>
  );
}

export default AdminSidebar;
