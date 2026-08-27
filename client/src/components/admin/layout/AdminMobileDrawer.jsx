import { useEffect, useRef } from "react";

import AdminNavigation from "./AdminNavigation";
import { AdminIcon } from "./adminIcons";

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const DESKTOP_MEDIA_QUERY = "(min-width: 64rem)";

function AdminMobileDrawer({
  admin,
  isOpen,
  onClose,
  onLogout,
  returnFocusRef,
}) {
  const drawerRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") {
      return undefined;
    }

    const desktopMediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);

    if (desktopMediaQuery.matches) {
      onClose?.();
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const returnFocusElement = returnFocusRef?.current || null;

    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    const handleDesktopViewportChange = (event) => {
      if (event.matches) {
        onClose?.();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const drawer = drawerRef.current;

      if (!drawer) {
        return;
      }

      const focusableElements = Array.from(
        drawer.querySelectorAll(FOCUSABLE_SELECTOR),
      ).filter(
        (element) =>
          !element.hasAttribute("disabled") &&
          element.getAttribute("aria-hidden") !== "true",
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        drawer.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    desktopMediaQuery.addEventListener(
      "change",
      handleDesktopViewportChange,
    );

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);

      desktopMediaQuery.removeEventListener(
        "change",
        handleDesktopViewportChange,
      );

      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;

      window.setTimeout(() => {
        const canRestoreFocus =
          returnFocusElement?.isConnected &&
          returnFocusElement.getClientRects().length > 0 &&
          !returnFocusElement.hasAttribute("disabled");

        if (canRestoreFocus) {
          returnFocusElement.focus();
        }
      }, 0);
    };
  }, [isOpen, onClose, returnFocusRef]);

  if (!isOpen) {
    return null;
  }

  const adminName = admin?.name || "Admin";
  const adminRole = admin?.role || "admin";

  return (
    <div className="fixed inset-0 z-[70] lg:hidden">
      <button
        aria-label="Close admin navigation"
        className="admin-reference-drawer-backdrop absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />

      <aside
        aria-labelledby="admin-mobile-drawer-title"
        aria-modal="true"
        className="admin-reference-mobile-drawer absolute inset-y-0 left-0 z-[80] flex w-[min(88vw,330px)] flex-col overflow-hidden text-white"
        ref={drawerRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="admin-reference-sidebar-brand flex h-[62px] shrink-0 items-center gap-3 px-4">
          <span
            aria-hidden="true"
            className="admin-reference-logo flex size-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-black tracking-[0.06em]"
          >
            RN
          </span>

          <p
            className="min-w-0 flex-1 truncate text-[15px] font-black tracking-tight"
            id="admin-mobile-drawer-title"
          >
            Rakesh<span className="text-blue-500">Nexify</span>
          </p>

          <button
            aria-label="Close admin navigation"
            className="admin-reference-icon-button inline-flex size-9 shrink-0 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            onClick={onClose}
            ref={closeButtonRef}
            title="Close navigation"
            type="button"
          >
            <AdminIcon name="close" size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overscroll-contain overflow-y-auto px-3 py-2 [scrollbar-color:rgb(49_64_83)_transparent] [scrollbar-width:thin]">
          <AdminNavigation
            isRailExpanded
            onNavigate={onClose}
            role={adminRole}
          />
        </div>

        <div className="admin-reference-sidebar-footer shrink-0 p-3">
          <div className="admin-reference-mobile-profile flex items-center gap-3 rounded-xl px-3 py-3">
            <span
              aria-hidden="true"
              className="admin-reference-avatar flex size-9 shrink-0 items-center justify-center rounded-full text-[11px] font-black"
            >
              {String(adminName)
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part.charAt(0))
                .join("")
                .toUpperCase() || "AD"}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">
                {adminName}
              </p>

              <p className="mt-0.5 truncate text-[10px] capitalize text-slate-400">
                {adminRole.replace("-", " ")}
              </p>
            </div>

            <button
              aria-label="Logout"
              className="admin-reference-icon-button inline-flex size-9 shrink-0 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              onClick={onLogout}
              title="Logout"
              type="button"
            >
              <AdminIcon name="logout" size={17} />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default AdminMobileDrawer;