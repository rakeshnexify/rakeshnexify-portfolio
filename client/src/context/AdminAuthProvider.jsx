import { useCallback, useEffect, useMemo, useState } from "react";

import {
  fetchCurrentAdmin,
  loginAdmin as requestAdminLogin,
} from "../services/adminAuthApi";
import AdminAuthContext from "./adminAuthContext";

const ADMIN_ACCESS_TOKEN_KEY = "rakeshnexify_admin_access_token";

function readStoredAccessToken() {
  try {
    return window.sessionStorage.getItem(ADMIN_ACCESS_TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

function saveAccessToken(accessToken) {
  try {
    window.sessionStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, accessToken);
  } catch {
    // Authentication state will still work until page refresh.
  }
}

function removeStoredAccessToken() {
  try {
    window.sessionStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
  } catch {
    // Nothing else is required when browser storage is unavailable.
  }
}

function getErrorMessage(
  error,
  fallbackMessage = "Admin authentication failed.",
) {
  return error instanceof Error ? error.message : fallbackMessage;
}

function AdminAuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(readStoredAccessToken);

  const [admin, setAdmin] = useState(null);

  const [isCheckingSession, setIsCheckingSession] = useState(() =>
    Boolean(readStoredAccessToken()),
  );

  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    const controller = new AbortController();

    async function restoreAdminSession() {
      try {
        const currentAdmin = await fetchCurrentAdmin(accessToken, {
          signal: controller.signal,
        });

        setAdmin(currentAdmin);
        setAuthError("");
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        console.error("Admin session restoration failed:", error);

        removeStoredAccessToken();
        setAccessToken("");
        setAdmin(null);

        setAuthError(
          getErrorMessage(error, "Your admin session is no longer valid."),
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsCheckingSession(false);
        }
      }
    }

    restoreAdminSession();

    return () => {
      controller.abort();
    };
  }, [accessToken]);

  const login = useCallback(async (credentials) => {
    const loginData = await requestAdminLogin(credentials);

    const newAccessToken = loginData?.accessToken || "";

    const loggedInAdmin = loginData?.admin || null;

    if (!newAccessToken || !loggedInAdmin) {
      throw new Error("Admin login response is incomplete.");
    }

    saveAccessToken(newAccessToken);

    setAccessToken(newAccessToken);
    setAdmin(loggedInAdmin);
    setAuthError("");

    return loggedInAdmin;
  }, []);

  const logout = useCallback(() => {
    removeStoredAccessToken();

    setAccessToken("");
    setAdmin(null);
    setAuthError("");
    setIsCheckingSession(false);
  }, []);

  const refreshAdmin = useCallback(async () => {
    if (!accessToken) {
      return null;
    }

    const currentAdmin = await fetchCurrentAdmin(accessToken);

    setAdmin(currentAdmin);

    return currentAdmin;
  }, [accessToken]);

  const clearAuthError = useCallback(() => {
    setAuthError("");
  }, []);

  const isAuthenticated = Boolean(accessToken && admin);

  const contextValue = useMemo(
    () => ({
      admin,
      accessToken,
      isAuthenticated,
      isCheckingSession,
      authError,
      login,
      logout,
      refreshAdmin,
      clearAuthError,
    }),
    [
      admin,
      accessToken,
      isAuthenticated,
      isCheckingSession,
      authError,
      login,
      logout,
      refreshAdmin,
      clearAuthError,
    ],
  );

  return (
    <AdminAuthContext.Provider value={contextValue}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export default AdminAuthProvider;
