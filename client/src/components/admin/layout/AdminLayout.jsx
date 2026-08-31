import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";

import useAdminAuth from "../../../hooks/useAdminAuth";
import { useAdminSidebarState } from "../../../hooks/useAdminSidebarState";
import AdminMobileDrawer from "./AdminMobileDrawer";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

function AdminLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { admin, logout } = useAdminAuth();
  const { isPinned, togglePinned } = useAdminSidebarState();

  const [isHovered, setIsHovered] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const mobileTriggerRef = useRef(null);
  const sidebarRef = useRef(null);

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

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const sidebar = sidebarRef.current;
    const activeElement = document.activeElement;

    if (
      sidebar &&
      (!activeElement || !sidebar.contains(activeElement))
    ) {
      setIsFocusWithin(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (
      isPinned ||
      !isRailExpanded ||
      typeof document === "undefined"
    ) {
      return undefined;
    }

    const handleOutsidePointerDown = (event) => {
      const sidebar = sidebarRef.current;

      if (!sidebar || sidebar.contains(event.target)) {
        return;
      }

      setIsHovered(false);
      setIsFocusWithin(false);

      const activeElement = document.activeElement;

      if (
        activeElement instanceof HTMLElement &&
        sidebar.contains(activeElement)
      ) {
        activeElement.blur();
      }
    };

    document.addEventListener(
      "pointerdown",
      handleOutsidePointerDown,
      true,
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleOutsidePointerDown,
        true,
      );
    };
  }, [isPinned, isRailExpanded]);

  const handleLogout = useCallback(async () => {
    setIsMobileOpen(false);

    try {
      await Promise.resolve(logout());
    } finally {
      navigate("/admin/login", { replace: true });
    }
  }, [logout, navigate]);

  return (
    <div className="admin-reference-shell min-h-screen overflow-x-clip">
      <AdminSidebar
        admin={admin}
        isPinned={isPinned}
        isRailExpanded={isRailExpanded}
        onBlurCapture={handleSidebarBlurCapture}
        onFocusCapture={handleSidebarFocusCapture}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTogglePinned={togglePinned}
        sidebarRef={sidebarRef}
      />

      <div
        className={`min-w-0 transition-[padding-left] duration-200 ease-out motion-reduce:transition-none lg:min-h-screen ${
          isPinned ? "lg:pl-[212px]" : "lg:pl-[68px]"
        }`}
      >
        <AdminTopbar
          admin={admin}
          onLogout={handleLogout}
          onOpenNavigation={handleOpenMobileNavigation}
        />

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>

      <AdminMobileDrawer
        admin={admin}
        isOpen={isMobileOpen}
        onClose={handleCloseMobileNavigation}
        onLogout={handleLogout}
        returnFocusRef={mobileTriggerRef}
      />
    </div>
  );
}

export default AdminLayout;
