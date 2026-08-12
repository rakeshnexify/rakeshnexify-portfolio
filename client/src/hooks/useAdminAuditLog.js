import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { fetchAdminAuditLogById } from "../services/adminAuditLogsApi";

function normalizeAuditLogId(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function useAdminAuditLog({
  accessToken = "",
  auditLogId = "",
  onUnauthorized,
  onForbidden,
  enabled = true,
} = {}) {
  const [auditLog, setAuditLog] =
    useState(null);

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState(null);

  const [refreshKey, setRefreshKey] =
    useState(0);

  const onUnauthorizedRef =
    useRef(onUnauthorized);

  const onForbiddenRef =
    useRef(onForbidden);

  useEffect(() => {
    onUnauthorizedRef.current =
      onUnauthorized;
  }, [onUnauthorized]);

  useEffect(() => {
    onForbiddenRef.current =
      onForbidden;
  }, [onForbidden]);

  const normalizedAuditLogId =
    normalizeAuditLogId(
      auditLogId,
    );

  useEffect(() => {
    if (
      !enabled ||
      !accessToken ||
      !normalizedAuditLogId
    ) {
      setAuditLog(null);
      setIsLoading(false);
      setError(null);

      return undefined;
    }

    const controller =
      new AbortController();

    async function loadAuditLog() {
      try {
        setIsLoading(true);
        setError(null);
        setAuditLog(null);

        const result =
          await fetchAdminAuditLogById(
            accessToken,
            normalizedAuditLogId,
            {
              signal:
                controller.signal,
            },
          );

        if (
          controller.signal.aborted
        ) {
          return;
        }

        setAuditLog(result);
      } catch (requestError) {
        if (
          controller.signal.aborted ||
          requestError?.name ===
            "AbortError"
        ) {
          return;
        }

        if (
          requestError?.status === 401
        ) {
          onUnauthorizedRef.current?.(
            requestError,
          );
        } else if (
          requestError?.status === 403
        ) {
          onForbiddenRef.current?.(
            requestError,
          );
        }

        setAuditLog(null);

        setError(
          requestError instanceof Error
            ? requestError
            : new Error(
                "Unable to load the Audit Log record.",
              ),
        );
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setIsLoading(false);
        }
      }
    }

    loadAuditLog();

    return () => {
      controller.abort();
    };
  }, [
    accessToken,
    enabled,
    normalizedAuditLogId,
    refreshKey,
  ]);

  const refresh = useCallback(() => {
    setRefreshKey(
      (currentKey) =>
        currentKey + 1,
    );
  }, []);

  return {
    auditLog,
    isLoading,
    error,
    status:
      Number(error?.status) || 0,
    isNotFound:
      error?.status === 404,
    isForbidden:
      error?.status === 403,
    refresh,
  };
}

export default useAdminAuditLog;
