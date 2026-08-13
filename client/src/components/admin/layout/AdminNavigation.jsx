import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  getAdminNavigationGroupsForRole,
  isAdminNavigationBranchActive,
  isAdminNavigationItemActive,
} from "../../../config/adminNavigation";
import { AdminIcon } from "./adminIcons";

function collectInitiallyOpenKeys(groups, pathname) {
  const keys = new Set();

  const visit = (items = []) => {
    items.forEach((item) => {
      if (
        Array.isArray(item.children) &&
        item.children.length > 0 &&
        isAdminNavigationBranchActive(item, pathname)
      ) {
        keys.add(item.key);
      }

      if (Array.isArray(item.children)) {
        visit(item.children);
      }
    });
  };

  groups.forEach((group) => visit(group.items));
  return keys;
}

function AdminNavigationItem({
  item,
  pathname,
  depth = 0,
  isRailExpanded,
  openKeys,
  setOpenKeys,
  onNavigate,
}) {
  const hasChildren = Array.isArray(item.children) && item.children.length > 0;
  const isActive = isAdminNavigationItemActive(item, pathname);
  const hasActiveDescendant =
    hasChildren && isAdminNavigationBranchActive(item, pathname) && !isActive;
  const isOpen = hasChildren && openKeys.has(item.key);

  const toggleChildren = () => {
    if (!hasChildren) {
      return;
    }

    setOpenKeys((current) => {
      const next = new Set(current);

      if (next.has(item.key)) {
        next.delete(item.key);
      } else {
        next.add(item.key);
      }

      return next;
    });
  };

  const isNested = depth > 0;

  const linkLayoutClasses = isRailExpanded
    ? isNested
      ? depth === 1
        ? "pl-7 pr-3"
        : "pl-11 pr-3"
      : "px-3"
    : "justify-center px-2";

  const stateClasses = isActive
    ? "bg-brand-500/16 text-white shadow-sm shadow-black/10"
    : hasActiveDescendant
      ? "bg-white/[0.07] text-slate-100"
      : "text-slate-300 hover:bg-white/[0.07] hover:text-white";

  const iconClasses = isActive
    ? "text-brand-300"
    : hasActiveDescendant
      ? "text-slate-200"
      : "text-slate-400 group-hover:text-slate-200";

  return (
    <li>
      <div className="flex items-stretch gap-1">
        <Link
          aria-current={isActive ? "page" : undefined}
          className={`group relative flex min-h-11 min-w-0 flex-1 items-center rounded-xl text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${linkLayoutClasses} ${stateClasses}`}
          onClick={() => {
            if (typeof onNavigate === "function") {
              onNavigate(item);
            }
          }}
          to={item.route}
        >
          <span
            aria-hidden="true"
            className={`flex shrink-0 items-center justify-center ${
              isNested ? "h-7 w-7" : "h-8 w-8"
            }`}
          >
            <AdminIcon
              className={iconClasses}
              name={item.icon}
              size={isNested ? 17 : 20}
            />
          </span>

          <span
            className={`min-w-0 truncate text-left transition-[width,opacity,margin] duration-150 ${
              isRailExpanded
                ? "ml-2.5 w-auto flex-1 opacity-100"
                : "ml-0 w-0 overflow-hidden opacity-0"
            }`}
          >
            {item.label}
          </span>

          {isActive ? (
            <span
              aria-hidden="true"
              className="absolute inset-y-2 left-0 w-0.5 rounded-r-full bg-brand-400"
            />
          ) : null}

          {!isRailExpanded ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-[calc(100%+0.65rem)] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-xl group-hover:block group-focus-visible:block"
            >
              {item.label}
            </span>
          ) : null}
        </Link>

        {hasChildren && isRailExpanded ? (
          <button
            aria-controls={`admin-nav-children-${item.key}`}
            aria-expanded={isOpen}
            aria-label={`${isOpen ? "Collapse" : "Expand"} ${item.label}`}
            className={`flex w-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
              hasActiveDescendant
                ? "text-slate-200 hover:bg-white/[0.08] hover:text-white"
                : "text-slate-500 hover:bg-white/[0.07] hover:text-white"
            }`}
            onClick={toggleChildren}
            type="button"
          >
            <AdminIcon
              name={isOpen ? "chevronDown" : "chevronRight"}
              size={16}
            />
          </button>
        ) : null}
      </div>

      {hasChildren && isRailExpanded && isOpen ? (
        <ul
          className="mt-1 space-y-1 border-l border-slate-800/90 pl-1"
          id={`admin-nav-children-${item.key}`}
        >
          {item.children.map((child) => (
            <AdminNavigationItem
              depth={depth + 1}
              isRailExpanded={isRailExpanded}
              item={child}
              key={child.key}
              onNavigate={onNavigate}
              openKeys={openKeys}
              pathname={pathname}
              setOpenKeys={setOpenKeys}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function AdminNavigationContent({
  groups,
  pathname,
  isRailExpanded,
  onNavigate,
  className,
}) {
  const [openKeys, setOpenKeys] = useState(() =>
    collectInitiallyOpenKeys(groups, pathname),
  );

  return (
    <nav
      aria-label="Admin navigation"
      className={`min-w-0 ${className}`.trim()}
    >
      <div className={isRailExpanded ? "space-y-5" : "space-y-2"}>
        {groups.map((group, groupIndex) => (
          <section
            aria-labelledby={`admin-nav-group-${group.key}`}
            className={
              !isRailExpanded && groupIndex > 0
                ? "border-t border-slate-800/80 pt-2"
                : ""
            }
            key={group.key}
          >
            <h2
              className={
                isRailExpanded
                  ? "mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500"
                  : "sr-only"
              }
              id={`admin-nav-group-${group.key}`}
            >
              {group.label}
            </h2>

            <ul className="space-y-1">
              {group.items.map((item) => (
                <AdminNavigationItem
                  isRailExpanded={isRailExpanded}
                  item={item}
                  key={item.key}
                  onNavigate={onNavigate}
                  openKeys={openKeys}
                  pathname={pathname}
                  setOpenKeys={setOpenKeys}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  );
}

function AdminNavigation({
  role,
  isRailExpanded = true,
  onNavigate,
  className = "",
}) {
  const { pathname } = useLocation();
  const groups = useMemo(() => getAdminNavigationGroupsForRole(role), [role]);

  return (
    <AdminNavigationContent
      className={className}
      groups={groups}
      isRailExpanded={isRailExpanded}
      key={`${role || "authenticated"}:${pathname}`}
      onNavigate={onNavigate}
      pathname={pathname}
    />
  );
}

export default AdminNavigation;
