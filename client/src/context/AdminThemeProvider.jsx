import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { useLocation } from "react-router";

import AdminThemeContext from "./adminThemeContext";

const ADMIN_THEME_STORAGE_KEY = "rakeshnexify-admin-theme";

function getInitialAdminTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  try {
    const savedTheme = window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY);

    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function AdminThemeProvider({ children }) {
  const { pathname } = useLocation();
  const [theme, setTheme] = useState(getInitialAdminTheme);

  const isAdminRoute =
    pathname === "/admin" || pathname.startsWith("/admin/");

  useLayoutEffect(() => {
    try {
      window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, theme);
    } catch {
      // Keep the in-memory theme functional when storage is unavailable.
    }
  }, [theme]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (!isAdminRoute) {
      delete root.dataset.adminTheme;
      body.classList.remove("admin-theme-active");
      delete body.dataset.adminTheme;

      return undefined;
    }

    root.dataset.adminTheme = theme;
    body.classList.add("admin-theme-active");
    body.dataset.adminTheme = theme;

    return () => {
      delete root.dataset.adminTheme;
      body.classList.remove("admin-theme-active");
      delete body.dataset.adminTheme;
    };
  }, [isAdminRoute, theme]);

  const setAdminTheme = useCallback((nextTheme) => {
    if (nextTheme !== "light" && nextTheme !== "dark") {
      return;
    }

    setTheme(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) =>
      currentTheme === "dark" ? "light" : "dark",
    );
  }, []);

  const contextValue = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      setTheme: setAdminTheme,
      toggleTheme,
    }),
    [setAdminTheme, theme, toggleTheme],
  );

  return (
    <AdminThemeContext.Provider value={contextValue}>
      {children}
    </AdminThemeContext.Provider>
  );
}

export default AdminThemeProvider;
