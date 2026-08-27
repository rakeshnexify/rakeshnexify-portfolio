import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { useLocation } from "react-router";

import PublicThemeContext from "./publicThemeContext";

const PUBLIC_THEME_STORAGE_KEY = "rakeshnexify-public-theme";

function getInitialPublicTheme() {
  if (typeof window === "undefined") {
    return "dark";
  }

  try {
    const savedTheme = window.localStorage.getItem(PUBLIC_THEME_STORAGE_KEY);

    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }

  return "dark";
}

function PublicThemeProvider({ children }) {
  const { pathname } = useLocation();
  const [theme, setTheme] = useState(getInitialPublicTheme);

  const isAdminRoute =
    pathname === "/admin" || pathname.startsWith("/admin/");

  useLayoutEffect(() => {
    try {
      window.localStorage.setItem(PUBLIC_THEME_STORAGE_KEY, theme);
    } catch {
      // Keep the in-memory theme functional when storage is unavailable.
    }
  }, [theme]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (isAdminRoute) {
      delete root.dataset.publicTheme;
      body.classList.remove("public-theme-active");
      delete body.dataset.publicTheme;

      return undefined;
    }

    root.dataset.publicTheme = theme;
    body.classList.add("public-theme-active");
    body.dataset.publicTheme = theme;

    return () => {
      body.classList.remove("public-theme-active");
      delete body.dataset.publicTheme;
    };
  }, [isAdminRoute, theme]);

  const setPublicTheme = useCallback((nextTheme) => {
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
      setTheme: setPublicTheme,
      toggleTheme,
    }),
    [setPublicTheme, theme, toggleTheme],
  );

  return (
    <PublicThemeContext.Provider value={contextValue}>
      {children}
    </PublicThemeContext.Provider>
  );
}

export default PublicThemeProvider;
