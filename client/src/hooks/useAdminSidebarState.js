import { useCallback, useState } from "react";

const ADMIN_SIDEBAR_PIN_STORAGE_KEY =
  "rakeshnexify_admin_sidebar_pinned_v1";

function readStoredPinnedState() {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    const savedValue = window.localStorage.getItem(
      ADMIN_SIDEBAR_PIN_STORAGE_KEY,
    );

    if (savedValue === "0") {
      return false;
    }

    if (savedValue === "1") {
      return true;
    }
  } catch {
    // Cosmetic preference persistence must never break the Admin shell.
  }

  return true;
}

function persistPinnedState(isPinned) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      ADMIN_SIDEBAR_PIN_STORAGE_KEY,
      isPinned ? "1" : "0",
    );
  } catch {
    // Cosmetic preference persistence must never break the Admin shell.
  }
}

function useAdminSidebarState() {
  const [isPinned, setIsPinnedState] = useState(readStoredPinnedState);

  const setIsPinned = useCallback((nextValue) => {
    setIsPinnedState((currentValue) => {
      const resolvedValue =
        typeof nextValue === "function"
          ? Boolean(nextValue(currentValue))
          : Boolean(nextValue);

      persistPinnedState(resolvedValue);

      return resolvedValue;
    });
  }, []);

  const togglePinned = useCallback(() => {
    setIsPinned((currentValue) => !currentValue);
  }, [setIsPinned]);

  return {
    isPinned,
    setIsPinned,
    togglePinned,
  };
}

export {
  ADMIN_SIDEBAR_PIN_STORAGE_KEY,
  readStoredPinnedState,
  useAdminSidebarState,
};