import { useCallback, useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import useAdminAuth from "../../../hooks/useAdminAuth";
import { useAdminSidebarState } from "../../../hooks/useAdminSidebarState";
import AdminMobileDrawer from "./AdminMobileDrawer";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

function AdminLayout() {
  const navigate = useNavigate();
  const { admin, logout } = useAdminAuth();
  const { isPinned, togglePinned } = useAdminSidebarState();

  const [isHovered, setIsHovered] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const mobileTriggerRef = useRef(null);

  const isRailExpanded = isPinned || isHovered || isFocusWithin;

  const handleOpenMobileNavigation = useCallback(() => {
    if (typeof document !== "undefined") {
      mobileTriggerRef.current = document.activeElement;
    }

    setIsMobileOpen(true);
  }, []);

  const handleCloseMobileNavigation = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  const handleSidebarFocusCapture = useCallback(() => {
    setIsFocusWithin(true);
  }, []);

  const handleSidebarBlurCapture = useCallback((event) => {
    const nextFocusedElement = event.relatedTarget;

    if (
      nextFocusedElement &&
      event.currentTarget.contains(nextFocusedElement)
    ) {
      return;
    }

    setIsFocusWithin(false);
  }, []);

  const handleLogout = useCallback(async () => {
    setIsMobileOpen(false);

    try {
      await Promise.resolve(logout());
    } finally {
      navigate("/admin/login", { replace: true });
    }
  }, [logout, navigate]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <AdminSidebar
        admin={admin}
        isPinned={isPinned}
        isRailExpanded={isRailExpanded}
        onBlurCapture={handleSidebarBlurCapture}
        onFocusCapture={handleSidebarFocusCapture}
        onLogout={handleLogout}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTogglePinned={togglePinned}
      />

      <AdminTopbar
        admin={admin}
        onLogout={handleLogout}
        onOpenNavigation={handleOpenMobileNavigation}
      />

      <AdminMobileDrawer
        admin={admin}
        isOpen={isMobileOpen}
        onClose={handleCloseMobileNavigation}
        onLogout={handleLogout}
        returnFocusRef={mobileTriggerRef}
      />

      <div
        className={`min-w-0 transition-[padding-left] duration-200 ease-out lg:min-h-screen ${
          isPinned ? "lg:pl-64" : "lg:pl-[72px]"
        }`}
      >
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
