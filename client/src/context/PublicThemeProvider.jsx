import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

import PublicThemeContext from "./publicThemeContext";

const PUBLIC_THEME_STORAGE_KEY = "rakeshnexify-public-theme";

function getInitialPublicTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  try {
    const savedTheme = window.localStorage.getItem(PUBLIC_THEME_STORAGE_KEY);

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

function PublicThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialPublicTheme);

  useLayoutEffect(() => {
    document.documentElement.dataset.publicTheme = theme;

    try {
      window.localStorage.setItem(PUBLIC_THEME_STORAGE_KEY, theme);
    } catch {
      // Keep the in-memory theme functional when storage is unavailable.
    }
  }, [theme]);

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
