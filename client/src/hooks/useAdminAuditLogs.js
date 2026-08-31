import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { fetchAdminAuditLogs } from "../services/adminAuditLogsApi";

const DEFAULT_LIMIT = 20;

const EMPTY_LIST_STATE = {
  auditLogs: [],
  count: 0,
  total: 0,
  page: 1,
  limit: DEFAULT_LIMIT,
  pages: 1,
};

function normalizeString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizePositiveInteger(
  value,
  fallback,
  maximum = Number.MAX_SAFE_INTEGER,
) {
  const parsedValue = Number(value);

  if (
    Number.isInteger(parsedValue) &&
    parsedValue > 0 &&
    parsedValue <= maximum
  ) {
    return parsedValue;
  }

  return fallback;
}

function useAdminAuditLogs({
  accessToken = "",
  filters = {},
  onUnauthorized,
  onForbidden,
  enabled = true,
} = {}) {
  const [listState, setListState] =
    useState(EMPTY_LIST_STATE);

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

  const normalizedFilters = useMemo(
    () => ({
      page:
        normalizePositiveInteger(
          filters.page,
          1,
        ),
      limit:
        normalizePositiveInteger(
          filters.limit,
          DEFAULT_LIMIT,
          100,
        ),
      search:
        normalizeString(
          filters.search,
        ),
      actorAdminId:
        normalizeString(
          filters.actorAdminId,
        ),
      actorRole:
        normalizeString(
          filters.actorRole,
        ),
      category:
        normalizeString(
          filters.category,
        ),
      action:
        normalizeString(
          filters.action,
        ),
      resourceType:
        normalizeString(
          filters.resourceType,
        ),
      resourceId:
        normalizeString(
          filters.resourceId,
        ),
      outcome:
        normalizeString(
          filters.outcome,
        ),
      dateFrom:
        normalizeString(
          filters.dateFrom,
        ),
      dateTo:
        normalizeString(
          filters.dateTo,
        ),
    }),
    [
      filters.page,
      filters.limit,
      filters.search,
      filters.actorAdminId,
      filters.actorRole,
      filters.category,
      filters.action,
      filters.resourceType,
      filters.resourceId,
      filters.outcome,
      filters.dateFrom,
      filters.dateTo,
    ],
  );

  const canLoad = Boolean(
    enabled &&
    accessToken,
  );

  useEffect(() => {
    if (!canLoad) {
      return undefined;
    }

    const controller =
      new AbortController();

    async function loadAuditLogs() {
      try {
        setIsLoading(true);
        setError(null);

        const result =
          await fetchAdminAuditLogs(
            accessToken,
            normalizedFilters,
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

        setListState({
          auditLogs:
            Array.isArray(
              result.auditLogs,
            )
              ? result.auditLogs
              : [],
          count:
            Number(result.count) || 0,
          total:
            Number(result.total) || 0,
          page:
            Number(result.page) ||
            normalizedFilters.page,
          limit:
            Number(result.limit) ||
            normalizedFilters.limit,
          pages:
            Math.max(
              1,
              Number(result.pages) || 1,
            ),
        });
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

        setListState({
          ...EMPTY_LIST_STATE,
          page:
            normalizedFilters.page,
          limit:
            normalizedFilters.limit,
        });

        setError(
          requestError instanceof Error
            ? requestError
            : new Error(
                "Unable to load Admin Audit Logs.",
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

    loadAuditLogs();

    return () => {
      controller.abort();
    };
  }, [
    accessToken,
    canLoad,
    normalizedFilters,
    refreshKey,
  ]);

  const refresh = useCallback(() => {
    setRefreshKey(
      (currentKey) =>
        currentKey + 1,
    );
  }, []);

  const visibleListState = canLoad
    ? listState
    : {
        ...EMPTY_LIST_STATE,
        page:
          normalizedFilters.page,
        limit:
          normalizedFilters.limit,
      };

  const visibleError = canLoad
    ? error
    : null;

  return {
    auditLogs:
      visibleListState.auditLogs,
    count:
      visibleListState.count,
    total:
      visibleListState.total,
    page:
      visibleListState.page,
    limit:
      visibleListState.limit,
    pages:
      visibleListState.pages,
    isLoading: canLoad
      ? isLoading
      : false,
    error: visibleError,
    isForbidden:
      visibleError?.status === 403,
    refresh,
  };
}

export default useAdminAuditLogs;
