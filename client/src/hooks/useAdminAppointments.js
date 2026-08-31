import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { fetchAdminAppointments } from "../services/adminAppointmentsApi";

const EMPTY_LIST_STATE = {
  appointments: [],
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

function useAdminAppointments({
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
      service: normalizeString(
        filters.service,
      ),
      assignedTo: normalizeString(
        filters.assignedTo,
      ),
      preferredDateFrom:
        normalizeString(
          filters.preferredDateFrom,
        ),
      preferredDateTo:
        normalizeString(
          filters.preferredDateTo,
        ),
      scheduledFrom:
        normalizeString(
          filters.scheduledFrom,
        ),
      scheduledTo:
        normalizeString(
          filters.scheduledTo,
        ),
    }),
    [
      filters.page,
      filters.limit,
      filters.search,
      filters.status,
      filters.service,
      filters.assignedTo,
      filters.preferredDateFrom,
      filters.preferredDateTo,
      filters.scheduledFrom,
      filters.scheduledTo,
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

    async function loadAppointments() {
      try {
        setIsLoading(true);
        setError(null);

        const result =
          await fetchAdminAppointments(
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
          appointments:
            Array.isArray(
              result.appointments,
            )
              ? result.appointments
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
                "Unable to load consultation requests.",
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

    loadAppointments();

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
    appointments:
      visibleListState.appointments,
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

export default useAdminAppointments;