import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  ANALYTICS_RANGES,
  fetchAdminAnalytics,
} from "../services/adminAnalyticsApi";

function normalizeRange(value) {
  const normalizedValue = typeof value === "string" ? value.trim() : "";
  return ANALYTICS_RANGES.has(normalizedValue) ? normalizedValue : "30d";
}

function useAdminAnalytics({
  accessToken = "",
  range = "30d",
  onUnauthorized,
  enabled = true,
} = {}) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const onUnauthorizedRef = useRef(onUnauthorized);

  useEffect(() => {
    onUnauthorizedRef.current = onUnauthorized;
  }, [onUnauthorized]);

  const normalizedRange = useMemo(() => normalizeRange(range), [range]);
  const canLoad = Boolean(enabled && accessToken);

  useEffect(() => {
    if (!canLoad) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadAnalytics() {
      try {
        setIsLoading(true);
        setError(null);
        setData(null);

        const result = await fetchAdminAnalytics(accessToken, normalizedRange, {
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setData(result);
        }
      } catch (requestError) {
        if (controller.signal.aborted || requestError?.name === "AbortError") {
          return;
        }

        if (requestError?.status === 401) {
          onUnauthorizedRef.current?.(requestError);
        }

        setData(null);
        setError(
          requestError instanceof Error
            ? requestError
            : new Error("Unable to load Admin analytics."),
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      controller.abort();
    };
  }, [accessToken, canLoad, normalizedRange, refreshKey]);

  const refresh = useCallback(() => {
    setRefreshKey((currentKey) => currentKey + 1);
  }, []);

  const visibleData = canLoad ? data : null;
  const visibleError = canLoad ? error : null;
  const hasCurrentRangeData =
    canLoad && visibleData?.range?.key === normalizedRange;

  return {
    data: visibleData,
    hasCurrentRangeData,
    isLoading: canLoad ? isLoading : false,
    error: visibleError,
    refresh,
  };
}

export default useAdminAnalytics;
