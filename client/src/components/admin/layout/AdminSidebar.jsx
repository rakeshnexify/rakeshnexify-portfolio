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
  sidebarRef,
}) {
  const adminRole = admin?.role || "admin";

  return (
    <aside
      aria-label="Admin sidebar"
      className={`rnx-admin-sidebar-clean-v499 admin-reference-sidebar fixed inset-y-0 left-0 z-40 hidden text-white transition-[width,box-shadow] duration-200 ease-out motion-reduce:transition-none lg:flex lg:flex-col ${
        isRailExpanded ? "w-[212px]" : "w-[68px]"
      }`}
      onBlurCapture={onBlurCapture}
      onFocusCapture={onFocusCapture}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      ref={sidebarRef}
    >
      <div
        className={`admin-reference-sidebar-brand flex h-14 shrink-0 items-center ${
          isRailExpanded ? "px-3.5" : "justify-center px-2"
        }`}
      >
        <Link
          aria-label="RakeshNexify Admin CMS dashboard"
          className={`group flex min-w-0 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            isRailExpanded ? "gap-2.5" : "justify-center"
          }`}
          to="/admin/dashboard"
        >
          <span
            aria-hidden="true"
            className="admin-reference-logo flex size-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-black tracking-[0.06em]"
          >
            RN
          </span>

          <span
            className={`min-w-0 overflow-hidden transition-[width,opacity] duration-150 motion-reduce:transition-none ${
              isRailExpanded ? "w-36 opacity-100" : "w-0 opacity-0"
            }`}
          >
            <span className="block truncate text-[14px] font-black tracking-tight text-white">
              Rakesh<span className="text-blue-500">Nexify</span>
            </span>
          </span>
        </Link>
      </div>

      <div className="min-h-0 flex-1 overscroll-contain overflow-x-visible overflow-y-auto py-1.5 [scrollbar-color:rgb(49_64_83)_transparent] [scrollbar-width:thin]">
        <AdminNavigation
          className={isRailExpanded ? "px-2" : "px-2"}
          isRailExpanded={isRailExpanded}
          role={adminRole}
        />
      </div>

      <div className="admin-reference-sidebar-footer shrink-0 p-2">
        <button
          aria-label={isPinned ? "Collapse sidebar" : "Keep sidebar open"}
          aria-pressed={isPinned}
          className={`admin-reference-collapse group relative flex min-h-9 w-full items-center rounded-lg text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            isRailExpanded ? "px-2" : "justify-center px-1.5"
          }`}
          onClick={onTogglePinned}
          title={!isRailExpanded ? "Keep sidebar open" : undefined}
          type="button"
        >
          <span
            aria-hidden="true"
            className="flex size-6 shrink-0 items-center justify-center"
          >
            <AdminIcon
              name={isPinned ? "chevronLeft" : "pin"}
              size={15}
            />
          </span>

          <span
            className={`min-w-0 truncate transition-[width,opacity,margin] duration-150 motion-reduce:transition-none ${
              isRailExpanded
                ? "ml-1.5 w-auto flex-1 opacity-100"
                : "ml-0 w-0 overflow-hidden opacity-0"
            }`}
          >
            {isPinned ? "Collapse sidebar" : "Keep Open"}
          </span>

          {!isRailExpanded ? (
            <span
              aria-hidden="true"
              className="admin-reference-tooltip pointer-events-none absolute left-[calc(100%+0.55rem)] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap px-2.5 py-1.5 text-[10px] font-semibold group-hover:block group-focus-visible:block"
            >
              Keep sidebar open
            </span>
          ) : null}
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;
