import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  DEFAULT_MEDIA_LIMIT,
  DEFAULT_MEDIA_PAGE,
  fetchAdminMedia,
} from "../services/adminMediaApi";

function normalizeStringFilter(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    return value;
  }

  const cleanValue = value.trim();

  return cleanValue || undefined;
}

function normalizePositiveIntegerFilter(value, fallbackValue) {
  if (value === undefined || value === null || value === "") {
    return fallbackValue;
  }

  const numericValue = Number(value);

  return Number.isSafeInteger(numericValue) ? numericValue : value;
}

function normalizeFiltersForHook(filters) {
  return {
    search: normalizeStringFilter(filters.search),

    mediaType: normalizeStringFilter(filters.mediaType),

    folder: normalizeStringFilter(filters.folder),

    tag: normalizeStringFilter(filters.tag),

    sort: normalizeStringFilter(filters.sort),

    page: normalizePositiveIntegerFilter(filters.page, DEFAULT_MEDIA_PAGE),

    limit: normalizePositiveIntegerFilter(filters.limit, DEFAULT_MEDIA_LIMIT),
  };
}

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Media could not be loaded.";
}

export default function useAdminMedia(accessToken, filters = {}) {
  const normalizedFilters = useMemo(
    () => normalizeFiltersForHook(filters),
    [
      filters.folder,
      filters.limit,
      filters.mediaType,
      filters.page,
      filters.search,
      filters.sort,
      filters.tag,
    ],
  );

  const [media, setMedia] = useState([]);

  const [count, setCount] = useState(0);

  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(
    normalizedFilters.page || DEFAULT_MEDIA_PAGE,
  );

  const [limit, setLimit] = useState(
    normalizedFilters.limit || DEFAULT_MEDIA_LIMIT,
  );

  const [totalPages, setTotalPages] = useState(0);

  const [isLoading, setIsLoading] = useState(Boolean(accessToken));

  const [error, setError] = useState(null);

  const activeRequestRef = useRef({
    controller: null,
    requestId: 0,
  });

  const loadMedia = useCallback(async () => {
    const previousRequest = activeRequestRef.current;

    previousRequest.controller?.abort();

    if (!accessToken) {
      activeRequestRef.current = {
        controller: null,
        requestId: previousRequest.requestId + 1,
      };

      setMedia([]);
      setCount(0);
      setTotal(0);
      setPage(normalizedFilters.page || DEFAULT_MEDIA_PAGE);
      setLimit(normalizedFilters.limit || DEFAULT_MEDIA_LIMIT);
      setTotalPages(0);
      setError(null);
      setIsLoading(false);

      return;
    }

    const controller = new AbortController();

    const requestId = previousRequest.requestId + 1;

    activeRequestRef.current = {
      controller,
      requestId,
    };

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchAdminMedia(accessToken, normalizedFilters, {
        signal: controller.signal,
      });

      if (
        controller.signal.aborted ||
        activeRequestRef.current.requestId !== requestId
      ) {
        return;
      }

      setMedia(Array.isArray(response.media) ? response.media : []);

      setCount(Number.isInteger(response.count) ? response.count : 0);

      setTotal(Number.isInteger(response.total) ? response.total : 0);

      setPage(
        Number.isInteger(response.page) ? response.page : DEFAULT_MEDIA_PAGE,
      );

      setLimit(
        Number.isInteger(response.limit) ? response.limit : DEFAULT_MEDIA_LIMIT,
      );

      setTotalPages(
        Number.isInteger(response.totalPages) ? response.totalPages : 0,
      );

      setError(null);
    } catch (requestError) {
      if (
        controller.signal.aborted ||
        requestError?.name === "AbortError" ||
        activeRequestRef.current.requestId !== requestId
      ) {
        return;
      }

      console.error("Admin Media loading failed:", requestError);

      setMedia([]);
      setCount(0);
      setTotal(0);
      setTotalPages(0);
      setError(
        requestError instanceof Error
          ? requestError
          : new Error("Media could not be loaded."),
      );
    } finally {
      if (
        !controller.signal.aborted &&
        activeRequestRef.current.requestId === requestId
      ) {
        activeRequestRef.current = {
          controller: null,
          requestId,
        };

        setIsLoading(false);
      }
    }
  }, [accessToken, normalizedFilters]);

  useEffect(() => {
    loadMedia();

    return () => {
      const currentRequest = activeRequestRef.current;

      currentRequest.controller?.abort();

      activeRequestRef.current = {
        controller: null,
        requestId: currentRequest.requestId + 1,
      };
    };
  }, [loadMedia]);

  const refreshMedia = useCallback(async () => {
    await loadMedia();
  }, [loadMedia]);

  return {
    media,
    count,
    total,
    page,
    limit,
    totalPages,

    hasPreviousPage: page > 1,

    hasNextPage: totalPages > 0 && page < totalPages,

    isLoading,

    error,

    errorMessage: error ? getErrorMessage(error) : "",

    refreshMedia,
  };
}

export {
  getErrorMessage,
  normalizeFiltersForHook,
  normalizePositiveIntegerFilter,
  normalizeStringFilter,
};
