import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  deleteAdminPushSubscription,
  fetchAdminPushStatus,
  saveAdminPushSubscription,
  sendAdminPushTest,
} from "../services/adminPushApi";

const SERVICE_WORKER_PATH =
  "/rnx-admin-push-sw.js";
const SERVICE_WORKER_SCOPE = "/";

function isBrowserPushSupported() {
  return Boolean(
    typeof window !== "undefined" &&
      typeof navigator !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window,
  );
}

function getCurrentPermission() {
  return isBrowserPushSupported()
    ? Notification.permission
    : "unsupported";
}

function isIosBrowserOutsideHomeScreen() {
  if (
    typeof navigator === "undefined" ||
    typeof window === "undefined"
  ) {
    return false;
  }

  const isIos =
    /iPad|iPhone|iPod/i.test(
      navigator.userAgent,
    );

  if (!isIos) {
    return false;
  }

  const standalone =
    window.matchMedia(
      "(display-mode: standalone)",
    ).matches ||
    window.navigator.standalone === true;

  return !standalone;
}

function urlBase64ToUint8Array(base64String) {
  const padding =
    "=".repeat(
      (4 - (base64String.length % 4)) % 4,
    );

  const base64 = (
    base64String + padding
  )
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from(
    rawData,
    (character) =>
      character.charCodeAt(0),
  );
}

async function getExistingPushSubscription() {
  if (!isBrowserPushSupported()) {
    return null;
  }

  const registration =
    await navigator.serviceWorker.getRegistration(
      SERVICE_WORKER_SCOPE,
    );

  if (!registration) {
    return null;
  }

  return registration.pushManager.getSubscription();
}

async function getOrCreateServiceWorkerRegistration() {
  const registration =
    await navigator.serviceWorker.register(
      SERVICE_WORKER_PATH,
      {
        scope: SERVICE_WORKER_SCOPE,
      },
    );

  await navigator.serviceWorker.ready;

  return registration;
}

function createInitialState() {
  return {
    scope: "",
    configured: false,
    publicKey: "",
    subscriptionCount: 0,
    deviceEnabled: false,
    permission:
      getCurrentPermission(),
    error: null,
  };
}

export default function useAdminPushNotifications(
  accessToken,
  {
    enabled = true,
  } = {},
) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [state, setState] = useState(
    createInitialState,
  );
  const [isBusy, setIsBusy] = useState(false);
  const requestRef = useRef({
    controller: null,
    requestId: 0,
  });

  const isSupported =
    isBrowserPushSupported();

  const canLoad = Boolean(
    enabled &&
      accessToken,
  );

  const requestKey = JSON.stringify([
    accessToken || "",
    refreshKey,
  ]);

  useEffect(() => {
    const previousRequest = requestRef.current;

    previousRequest.controller?.abort();

    if (!canLoad) {
      requestRef.current = {
        controller: null,
        requestId:
          previousRequest.requestId + 1,
      };

      return undefined;
    }

    const controller = new AbortController();
    const requestId =
      previousRequest.requestId + 1;

    requestRef.current = {
      controller,
      requestId,
    };

    Promise.all([
      fetchAdminPushStatus(
        accessToken,
        {
          signal: controller.signal,
        },
      ),
      isSupported
        ? getExistingPushSubscription()
        : Promise.resolve(null),
    ])
      .then(
        ([
          serverStatus,
          localSubscription,
        ]) => {
          if (
            controller.signal.aborted ||
            requestRef.current.requestId !==
              requestId
          ) {
            return;
          }

          setState({
            scope: accessToken,
            configured:
              serverStatus.configured,
            publicKey:
              serverStatus.publicKey,
            subscriptionCount:
              serverStatus.subscriptionCount,
            deviceEnabled:
              Boolean(localSubscription),
            permission:
              getCurrentPermission(),
            error: null,
          });
        },
      )
      .catch((requestError) => {
        if (
          controller.signal.aborted ||
          requestError?.name ===
            "AbortError" ||
          requestRef.current.requestId !==
            requestId
        ) {
          return;
        }

        setState({
          scope: accessToken,
          configured: false,
          publicKey: "",
          subscriptionCount: 0,
          deviceEnabled: false,
          permission:
            getCurrentPermission(),
          error:
            requestError instanceof Error
              ? requestError
              : new Error(
                  "Phone alert status could not be loaded.",
                ),
        });
      })
      .finally(() => {
        if (
          !controller.signal.aborted &&
          requestRef.current.requestId ===
            requestId
        ) {
          requestRef.current = {
            controller: null,
            requestId,
          };
        }
      });

    return () => {
      const currentRequest = requestRef.current;

      currentRequest.controller?.abort();

      requestRef.current = {
        controller: null,
        requestId:
          currentRequest.requestId + 1,
      };
    };
  }, [
    accessToken,
    canLoad,
    isSupported,
    requestKey,
  ]);

  const refreshStatus = useCallback(() => {
    if (!canLoad) {
      return;
    }

    setRefreshKey(
      (currentKey) => currentKey + 1,
    );
  }, [canLoad]);

  const clearError = useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      error: null,
    }));
  }, []);

  const enablePush = useCallback(async () => {
    if (!canLoad) {
      throw new Error(
        "Admin authentication is required.",
      );
    }

    if (!isSupported) {
      throw new Error(
        "This browser does not support Web Push notifications.",
      );
    }

    if (!state.configured || !state.publicKey) {
      throw new Error(
        "Web Push is not configured on the server yet.",
      );
    }

    if (isIosBrowserOutsideHomeScreen()) {
      const error = new Error(
        "On iPhone/iPad, add RakeshNexify to the Home Screen first, then enable alerts from the installed web app.",
      );

      setState((currentState) => ({
        ...currentState,
        error,
      }));

      throw error;
    }

    setIsBusy(true);

    try {
      let permission =
        Notification.permission;

      if (permission !== "granted") {
        permission =
          await Notification.requestPermission();
      }

      if (permission !== "granted") {
        throw new Error(
          permission === "denied"
            ? "Notification permission is blocked. Enable it in your browser/site settings."
            : "Notification permission was not granted.",
        );
      }

      const registration =
        await getOrCreateServiceWorkerRegistration();

      let subscription =
        await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription =
          await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey:
              urlBase64ToUint8Array(
                state.publicKey,
              ),
          });
      }

      await saveAdminPushSubscription(
        accessToken,
        subscription.toJSON(),
      );

      setState((currentState) => ({
        ...currentState,
        deviceEnabled: true,
        permission,
        subscriptionCount:
          Math.max(
            1,
            currentState.subscriptionCount,
          ),
        error: null,
      }));

      return subscription;
    } catch (requestError) {
      const normalizedError =
        requestError instanceof Error
          ? requestError
          : new Error(
              "Phone alerts could not be enabled.",
            );

      setState((currentState) => ({
        ...currentState,
        permission:
          getCurrentPermission(),
        error: normalizedError,
      }));

      throw normalizedError;
    } finally {
      setIsBusy(false);
    }
  }, [
    accessToken,
    canLoad,
    isSupported,
    state.configured,
    state.publicKey,
  ]);

  const disablePush = useCallback(async () => {
    if (!canLoad) {
      throw new Error(
        "Admin authentication is required.",
      );
    }

    setIsBusy(true);

    try {
      const subscription =
        await getExistingPushSubscription();

      if (subscription) {
        await deleteAdminPushSubscription(
          accessToken,
          subscription.endpoint,
        );

        await subscription.unsubscribe();
      }

      setState((currentState) => ({
        ...currentState,
        deviceEnabled: false,
        subscriptionCount:
          Math.max(
            0,
            currentState.subscriptionCount - 1,
          ),
        error: null,
      }));
    } catch (requestError) {
      const normalizedError =
        requestError instanceof Error
          ? requestError
          : new Error(
              "Phone alerts could not be disabled.",
            );

      setState((currentState) => ({
        ...currentState,
        error: normalizedError,
      }));

      throw normalizedError;
    } finally {
      setIsBusy(false);
    }
  }, [
    accessToken,
    canLoad,
  ]);

  const sendTestPush = useCallback(async () => {
    if (!canLoad) {
      throw new Error(
        "Admin authentication is required.",
      );
    }

    if (!state.deviceEnabled) {
      throw new Error(
        "Enable phone alerts on this device first.",
      );
    }

    setIsBusy(true);

    try {
      const result =
        await sendAdminPushTest(accessToken);

      if (result.delivered < 1) {
        throw new Error(
          "The test push was not delivered to an active device.",
        );
      }

      setState((currentState) => ({
        ...currentState,
        error: null,
      }));

      return result;
    } catch (requestError) {
      const normalizedError =
        requestError instanceof Error
          ? requestError
          : new Error(
              "Test push could not be sent.",
            );

      setState((currentState) => ({
        ...currentState,
        error: normalizedError,
      }));

      throw normalizedError;
    } finally {
      setIsBusy(false);
    }
  }, [
    accessToken,
    canLoad,
    state.deviceEnabled,
  ]);

  const hasScopedState =
    canLoad &&
    state.scope === accessToken;

  const permission = hasScopedState
    ? state.permission
    : getCurrentPermission();

  let statusMessage =
    "Checking phone alert status...";

  if (!isSupported) {
    statusMessage =
      "Web Push is not supported by this browser.";
  } else if (
    hasScopedState &&
    state.error &&
    !state.configured
  ) {
    statusMessage =
      "Phone alert status is unavailable.";
  } else if (
    hasScopedState &&
    !state.configured
  ) {
    statusMessage =
      "Server setup is required before alerts can be enabled.";
  } else if (permission === "denied") {
    statusMessage =
      "Notifications are blocked in browser/site settings.";
  } else if (
    hasScopedState &&
    state.deviceEnabled
  ) {
    statusMessage =
      "Alerts are enabled on this device.";
  } else if (isIosBrowserOutsideHomeScreen()) {
    statusMessage =
      "On iPhone/iPad, add this site to Home Screen first.";
  } else if (hasScopedState) {
    statusMessage =
      "Enable alerts to receive new enquiries on this device.";
  }

  return {
    isSupported,
    isConfigured:
      hasScopedState
        ? state.configured
        : false,
    isEnabled:
      hasScopedState
        ? state.deviceEnabled
        : false,
    isBusy,
    permission,
    subscriptionCount:
      hasScopedState
        ? state.subscriptionCount
        : 0,
    error:
      hasScopedState
        ? state.error
        : null,
    statusMessage,
    enablePush,
    disablePush,
    sendTestPush,
    clearError,
    refreshStatus,
  };
}
