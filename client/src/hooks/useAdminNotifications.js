import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  fetchAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "../services/adminNotificationsApi";

const DEFAULT_NOTIFICATION_LIMIT = 12;
const NOTIFICATION_REFRESH_INTERVAL_MS = 30000;

function createInitialResult() {
  return {
    scope: "",
    requestKey: "",
    notifications: [],
    unreadCount: 0,
    error: null,
  };
}

export default function useAdminNotifications(
  accessToken,
  {
    enabled = true,
    limit = DEFAULT_NOTIFICATION_LIMIT,
  } = {},
) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [result, setResult] = useState(createInitialResult);
  const [actionError, setActionError] = useState(null);
  const [
    pendingNotificationId,
    setPendingNotificationId,
  ] = useState("");
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const activeRequestRef = useRef({
    controller: null,
    requestId: 0,
  });

  const canLoad = Boolean(
    enabled &&
      accessToken,
  );

  const cleanLimit =
    Number.isSafeInteger(Number(limit)) &&
    Number(limit) > 0
      ? Number(limit)
      : DEFAULT_NOTIFICATION_LIMIT;

  const requestKey = JSON.stringify([
    accessToken || "",
    cleanLimit,
    refreshKey,
  ]);

  useEffect(() => {
    const previousRequest = activeRequestRef.current;

    previousRequest.controller?.abort();

    if (!canLoad) {
      activeRequestRef.current = {
        controller: null,
        requestId: previousRequest.requestId + 1,
      };

      return undefined;
    }

    const controller = new AbortController();
    const requestId = previousRequest.requestId + 1;

    activeRequestRef.current = {
      controller,
      requestId,
    };

    fetchAdminNotifications(
      accessToken,
      {
        limit: cleanLimit,
        signal: controller.signal,
      },
    )
      .then((response) => {
        if (
          controller.signal.aborted ||
          activeRequestRef.current.requestId !==
            requestId
        ) {
          return;
        }

        setResult({
          scope: accessToken,
          requestKey,
          notifications: response.notifications,
          unreadCount: response.unreadCount,
          error: null,
        });
      })
      .catch((requestError) => {
        if (
          controller.signal.aborted ||
          requestError?.name === "AbortError" ||
          activeRequestRef.current.requestId !==
            requestId
        ) {
          return;
        }

        setResult({
          scope: accessToken,
          requestKey,
          notifications: [],
          unreadCount: 0,
          error:
            requestError instanceof Error
              ? requestError
              : new Error(
                  "Notifications could not be loaded.",
                ),
        });
      })
      .finally(() => {
        if (
          !controller.signal.aborted &&
          activeRequestRef.current.requestId ===
            requestId
        ) {
          activeRequestRef.current = {
            controller: null,
            requestId,
          };
        }
      });

    return () => {
      const currentRequest = activeRequestRef.current;

      currentRequest.controller?.abort();

      activeRequestRef.current = {
        controller: null,
        requestId:
          currentRequest.requestId + 1,
      };
    };
  }, [
    accessToken,
    canLoad,
    cleanLimit,
    requestKey,
  ]);

  useEffect(() => {
    if (!canLoad) {
      return undefined;
    }

    const requestRefresh = () => {
      setRefreshKey(
        (currentKey) => currentKey + 1,
      );
    };

    const handleWindowFocus = () => {
      requestRefresh();
    };

    const intervalId = window.setInterval(
      requestRefresh,
      NOTIFICATION_REFRESH_INTERVAL_MS,
    );

    window.addEventListener(
      "focus",
      handleWindowFocus,
    );

    return () => {
      window.clearInterval(intervalId);

      window.removeEventListener(
        "focus",
        handleWindowFocus,
      );
    };
  }, [canLoad]);

  const refreshNotifications = useCallback(() => {
    if (!canLoad) {
      return;
    }

    setRefreshKey(
      (currentKey) => currentKey + 1,
    );
  }, [canLoad]);

  const clearActionError = useCallback(() => {
    setActionError(null);
  }, []);

  const markAsRead = useCallback(
    async (notificationId) => {
      if (!canLoad || !notificationId) {
        return null;
      }

      setPendingNotificationId(
        String(notificationId),
      );
      setActionError(null);

      try {
        const response =
          await markAdminNotificationRead(
            accessToken,
            notificationId,
          );

        setResult((currentResult) => {
          if (
            currentResult.scope !== accessToken
          ) {
            return currentResult;
          }

          return {
            ...currentResult,
            notifications:
              currentResult.notifications.map(
                (notification) =>
                  String(notification?._id) ===
                  String(notificationId)
                    ? {
                        ...notification,
                        ...(response.notification ||
                          {}),
                        isRead: true,
                      }
                    : notification,
              ),
            unreadCount:
              response.unreadCount,
          };
        });

        return response.notification;
      } catch (requestError) {
        const normalizedError =
          requestError instanceof Error
            ? requestError
            : new Error(
                "Notification could not be marked as read.",
              );

        setActionError(normalizedError);

        throw normalizedError;
      } finally {
        setPendingNotificationId("");
      }
    },
    [
      accessToken,
      canLoad,
    ],
  );

  const markAllAsRead = useCallback(async () => {
    if (!canLoad) {
      return;
    }

    setIsMarkingAll(true);
    setActionError(null);

    try {
      const response =
        await markAllAdminNotificationsRead(
          accessToken,
        );

      setResult((currentResult) => {
        if (
          currentResult.scope !== accessToken
        ) {
          return currentResult;
        }

        return {
          ...currentResult,
          notifications:
            currentResult.notifications.map(
              (notification) => ({
                ...notification,
                isRead: true,
              }),
            ),
          unreadCount:
            response.unreadCount,
        };
      });
    } catch (requestError) {
      const normalizedError =
        requestError instanceof Error
          ? requestError
          : new Error(
              "Notifications could not be marked as read.",
            );

      setActionError(normalizedError);

      throw normalizedError;
    } finally {
      setIsMarkingAll(false);
    }
  }, [
    accessToken,
    canLoad,
  ]);

  const hasScopedData =
    canLoad &&
    result.scope === accessToken;

  return {
    notifications: hasScopedData
      ? result.notifications
      : [],

    unreadCount: hasScopedData
      ? result.unreadCount
      : 0,

    isLoading:
      canLoad &&
      (
        !hasScopedData ||
        result.requestKey !== requestKey
      ),

    error:
      hasScopedData &&
      result.requestKey === requestKey
        ? result.error
        : null,

    actionError,
    pendingNotificationId,
    isMarkingAll,

    refreshNotifications,
    clearActionError,
    markAsRead,
    markAllAsRead,
  };
}
