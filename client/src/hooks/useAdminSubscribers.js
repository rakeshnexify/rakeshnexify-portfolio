import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { fetchAdminSubscribers } from "../services/adminSubscribersApi";

const EMPTY_LIST_STATE = {
  subscribers: [],
  count: 0,
  total: 0,
  page: 1,
  limit: 10,
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
) {
  const parsedValue = Number(value);

  if (
    Number.isInteger(parsedValue) &&
    parsedValue > 0
  ) {
    return parsedValue;
  }

  return fallback;
}

function useAdminSubscribers({
  accessToken = "",
  filters = {},
  onUnauthorized,
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

  useEffect(() => {
    onUnauthorizedRef.current =
      onUnauthorized;
  }, [onUnauthorized]);

  const normalizedFilters = useMemo(
    () => ({
      page: normalizePositiveInteger(
        filters.page,
        1,
      ),
      limit: normalizePositiveInteger(
        filters.limit,
        10,
      ),
      search: normalizeString(
        filters.search,
      ),
      status: normalizeString(
        filters.status,
      ),
    }),
    [
      filters.page,
      filters.limit,
      filters.search,
      filters.status,
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

    async function loadSubscribers() {
      try {
        setIsLoading(true);
        setError(null);

        const result =
          await fetchAdminSubscribers(
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
          subscribers:
            Array.isArray(
              result.subscribers,
            )
              ? result.subscribers
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
          pages: Math.max(
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
          requestError?.status ===
          401
        ) {
          onUnauthorizedRef.current?.(
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
                "Unable to load newsletter subscribers.",
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

    loadSubscribers();

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

  return {
    subscribers:
      visibleListState.subscribers,
    count: visibleListState.count,
    total: visibleListState.total,
    page: visibleListState.page,
    limit: visibleListState.limit,
    pages: visibleListState.pages,
    isLoading: canLoad
      ? isLoading
      : false,
    error: canLoad
      ? error
      : null,
    refresh,
  };
}

export default useAdminSubscribers;
