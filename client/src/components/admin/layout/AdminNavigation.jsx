import { useId, useMemo, useState } from "react";
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
  idPrefix,
}) {
  const hasChildren =
    Array.isArray(item.children) && item.children.length > 0;

  const isActive = isAdminNavigationItemActive(item, pathname);

  const hasActiveDescendant =
    hasChildren && isAdminNavigationBranchActive(item, pathname) && !isActive;

  const isOpen = hasChildren && openKeys.has(item.key);
  const childrenId = `${idPrefix}-children-${item.key}`;

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

  const linkLayout = isRailExpanded
    ? depth > 0
      ? "pl-7 pr-1.5"
      : "px-1.5"
    : "justify-center px-1.5";

  return (
    <li>
      <div className="flex items-stretch gap-0.5">
        <Link
          aria-current={isActive ? "page" : undefined}
          className={`admin-reference-nav-link group relative flex min-h-[34px] min-w-0 flex-1 items-center rounded-lg text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${linkLayout} ${
            isActive ? "is-active" : ""
          } ${hasActiveDescendant ? "has-active-child" : ""}`}
          onClick={() => {
            if (typeof onNavigate === "function") {
              onNavigate(item);
            }
          }}
          title={!isRailExpanded ? item.label : undefined}
          to={item.route}
        >
          <span
            aria-hidden="true"
            className={`admin-reference-nav-icon flex shrink-0 items-center justify-center ${
              depth > 0 ? "size-5" : "size-6"
            }`}
          >
            <AdminIcon name={item.icon} size={depth > 0 ? 14 : 15} />
          </span>

          <span
            className={`min-w-0 truncate transition-[width,opacity,margin] duration-150 motion-reduce:transition-none ${
              isRailExpanded
                ? "ml-1.5 w-auto flex-1 opacity-100"
                : "ml-0 w-0 overflow-hidden opacity-0"
            }`}
          >
            {item.label}
          </span>

          {!isRailExpanded ? (
            <span
              aria-hidden="true"
              className="admin-reference-tooltip pointer-events-none absolute left-[calc(100%+0.55rem)] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap px-2.5 py-1.5 text-[10px] font-semibold group-hover:block group-focus-visible:block"
            >
              {item.label}
            </span>
          ) : null}
        </Link>

        {hasChildren && isRailExpanded ? (
          <button
            aria-controls={childrenId}
            aria-expanded={isOpen}
            aria-label={`${isOpen ? "Collapse" : "Expand"} ${item.label}`}
            className="admin-reference-nav-expand flex w-6 shrink-0 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            onClick={toggleChildren}
            type="button"
          >
            <AdminIcon
              name={isOpen ? "chevronDown" : "chevronRight"}
              size={12}
            />
          </button>
        ) : null}
      </div>

      {hasChildren && isRailExpanded && isOpen ? (
        <ul
          className="admin-reference-nav-children mt-0.5 space-y-0.5"
          id={childrenId}
        >
          {item.children.map((child) => (
            <AdminNavigationItem
              depth={depth + 1}
              idPrefix={idPrefix}
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
  idPrefix,
}) {
  const [openKeys, setOpenKeys] = useState(() =>
    collectInitiallyOpenKeys(groups, pathname),
  );

  return (
    <nav
      aria-label="Admin navigation"
      className={`min-w-0 ${className}`.trim()}
    >
      <div className={isRailExpanded ? "space-y-3" : "space-y-1.5"}>
        {groups.map((group) => (
          <section
            aria-labelledby={`${idPrefix}-group-${group.key}`}
            key={group.key}
          >
            <h2
              className={
                isRailExpanded
                  ? "admin-reference-nav-group mb-1 px-1.5 text-[8px] font-semibold uppercase tracking-[0.12em]"
                  : "sr-only"
              }
              id={`${idPrefix}-group-${group.key}`}
            >
              {group.label}
            </h2>

            <ul className="space-y-px">
              {group.items.map((item) => (
                <AdminNavigationItem
                  idPrefix={idPrefix}
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
  const reactId = useId();

  const idPrefix = `admin-navigation-${reactId.replace(/:/g, "")}`;

  const groups = useMemo(
    () => getAdminNavigationGroupsForRole(role),
    [role],
  );

  return (
    <AdminNavigationContent
      className={className}
      groups={groups}
      idPrefix={idPrefix}
      isRailExpanded={isRailExpanded}
      key={`${role || "authenticated"}:${pathname}`}
      onNavigate={onNavigate}
      pathname={pathname}
    />
  );
}

export default AdminNavigation;
