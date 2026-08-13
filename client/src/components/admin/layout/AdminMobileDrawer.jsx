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

    const previousOverflow = document.body.style.overflow;
    const returnFocusElement = returnFocusRef?.current || null;

    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

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

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;

      window.setTimeout(() => {
        returnFocusElement?.focus();
      }, 0);
    };
  }, [isOpen, onClose, returnFocusRef]);

  if (!isOpen) {
    return null;
  }

  const adminName = admin?.name || "Admin";
  const adminEmail = admin?.email || "";
  const adminRole = admin?.role || "authenticated";

  return (
    <div className="fixed inset-0 z-[70] lg:hidden">
      <button
        aria-label="Close admin navigation"
        className="absolute inset-0 cursor-default bg-slate-950/60 backdrop-blur-[2px]"
        onClick={onClose}
        type="button"
      />

      <aside
        aria-labelledby="admin-mobile-drawer-title"
        aria-modal="true"
        className="absolute inset-y-0 left-0 z-[80] flex w-[min(90vw,340px)] flex-col overflow-hidden border-r border-slate-800/90 bg-slate-950 text-slate-100 shadow-2xl shadow-black/40"
        ref={drawerRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-800/90 px-4">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-sm font-black tracking-wide text-white shadow-lg shadow-brand-950/30"
          >
            RN
          </span>

          <div className="min-w-0 flex-1">
            <p
              className="truncate text-sm font-bold tracking-tight text-white"
              id="admin-mobile-drawer-title"
            >
              RakeshNexify
            </p>
            <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Admin CMS
            </p>
          </div>

          <button
            aria-label="Close admin navigation"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-transparent text-slate-400 transition-colors hover:border-slate-700 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            onClick={onClose}
            ref={closeButtonRef}
            title="Close navigation"
            type="button"
          >
            <AdminIcon name="close" size={21} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 [scrollbar-color:rgb(51_65_85)_transparent] [scrollbar-width:thin]">
          <AdminNavigation
            isRailExpanded
            onNavigate={onClose}
            role={adminRole}
          />
        </div>

        <div className="shrink-0 border-t border-slate-800/90 bg-slate-950/95 p-3">
          <div className="mb-2.5 flex items-center gap-3 rounded-2xl border border-slate-800/80 bg-white/[0.035] px-3 py-3">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-300"
            >
              <AdminIcon name="account" size={19} />
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-100">
                {adminName}
              </p>
              <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                {adminRole}
              </p>
              {adminEmail ? (
                <p className="mt-0.5 truncate text-[10px] text-slate-600">
                  {adminEmail}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              href="/"
            >
              <AdminIcon name="external" size={17} />
              Website
            </a>

            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-semibold text-slate-300 transition-colors hover:border-rose-900/60 hover:bg-rose-500/10 hover:text-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              onClick={onLogout}
              type="button"
            >
              <AdminIcon name="logout" size={17} />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default AdminMobileDrawer;
