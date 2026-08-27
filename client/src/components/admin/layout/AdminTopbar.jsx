import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";

import { getAdminNavigationGroupsForRole } from "../../../config/adminNavigation";
import { AdminIcon } from "./adminIcons";
import AdminThemeToggle from "./AdminThemeToggle";

const CREATE_ACTIONS = [
  {
    label: "New Project",
    route: "/admin/projects/new",
    icon: "projects",
  },
  {
    label: "New Service",
    route: "/admin/services/new",
    icon: "services",
  },
  {
    label: "New Blog Post",
    route: "/admin/posts/new",
    icon: "posts",
  },
  {
    label: "Add Team Member",
    route: "/admin/team/new",
    icon: "team",
  },
];

function flattenNavigation(items = []) {
  return items.flatMap((item) => [
    item,
    ...(Array.isArray(item.children)
      ? flattenNavigation(item.children)
      : []),
  ]);
}

function createInitials(name) {
  const initials = String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return initials || "AD";
}

function formatRole(role) {
  return String(role || "admin")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function AdminTopbar({ admin, onOpenNavigation, onLogout }) {
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const [searchValue, setSearchValue] = useState("");

  const adminName = admin?.name || "Admin";
  const adminRole = admin?.role || "admin";

  const searchableItems = useMemo(
    () =>
      getAdminNavigationGroupsForRole(adminRole).flatMap((group) =>
        flattenNavigation(group.items),
      ),
    [adminRole],
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function handleSearchSubmit(event) {
    event.preventDefault();

    const query = searchValue.trim().toLowerCase();

    if (!query) {
      searchInputRef.current?.focus();
      return;
    }

    const match = searchableItems.find((item) => {
      const haystack = `${item.label || ""} ${item.description || ""}`.toLowerCase();

      return haystack.includes(query);
    });

    if (match?.route) {
      navigate(match.route);
      setSearchValue("");
    }
  }

  return (
    <header className="admin-reference-topbar sticky top-0 z-30">
      <div className="flex h-[62px] items-center gap-3 px-3 sm:px-5 lg:px-8">
        <button
          aria-label="Open admin navigation"
          className="admin-reference-icon-button inline-flex size-10 shrink-0 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:hidden"
          onClick={onOpenNavigation}
          title="Open navigation"
          type="button"
        >
          <AdminIcon name="menu" size={19} />
        </button>

        <form
          className="admin-reference-search relative hidden w-full max-w-[372px] md:block"
          onSubmit={handleSearchSubmit}
          role="search"
        >
          <AdminIcon
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
            name="search"
            size={17}
          />

          <input
            aria-label="Search Admin pages"
            className="h-10 w-full rounded-xl pl-10 pr-20 text-sm outline-none"
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search anything..."
            ref={searchInputRef}
            type="search"
            value={searchValue}
          />

          <span
            aria-hidden="true"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold"
          >
            Ctrl + K
          </span>
        </form>

        <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
          <details className="admin-reference-create-menu relative hidden sm:block">
            <summary className="admin-reference-create-button inline-flex h-10 cursor-pointer list-none items-center gap-2 rounded-xl px-4 text-xs font-black text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
              <AdminIcon name="plus" size={17} />
              Create New
            </summary>

            <div className="admin-reference-popover absolute right-0 top-[calc(100%+0.65rem)] z-50 w-52 rounded-2xl p-2">
              {CREATE_ACTIONS.map((action) => (
                <Link
                  className="admin-reference-popover-link flex min-h-10 items-center gap-3 rounded-xl px-3 text-xs font-semibold"
                  key={action.route}
                  to={action.route}
                >
                  <AdminIcon name={action.icon} size={16} />
                  {action.label}
                </Link>
              ))}
            </div>
          </details>

          <AdminThemeToggle />

          <Link
            aria-label="Open Contact Messages"
            className="admin-reference-icon-button relative inline-flex size-10 shrink-0 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Contact Messages"
            to="/admin/contact-messages"
          >
            <AdminIcon name="messages" size={17} />
          </Link>

          <div className="admin-reference-profile hidden min-w-0 items-center gap-2.5 pl-1 sm:flex">
            <span
              aria-hidden="true"
              className="admin-reference-avatar flex size-9 shrink-0 items-center justify-center rounded-full text-[11px] font-black"
            >
              {createInitials(adminName)}
            </span>

            <div className="hidden min-w-0 lg:block">
              <p className="max-w-28 truncate text-xs font-bold text-white">
                {adminName}
              </p>

              <p className="mt-0.5 max-w-28 truncate text-[10px] text-slate-400">
                {formatRole(adminRole)}
              </p>
            </div>
          </div>

          <button
            aria-label="Logout"
            className="admin-reference-icon-button hidden size-10 shrink-0 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 md:inline-flex"
            onClick={onLogout}
            title="Logout"
            type="button"
          >
            <AdminIcon name="logout" size={17} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default AdminTopbar;