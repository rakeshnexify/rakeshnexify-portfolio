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

  useEffect(() => {
    if (!enabled || !accessToken) {
      setData(null);
      setIsLoading(false);
      setError(null);
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
  }, [accessToken, enabled, normalizedRange, refreshKey]);

  const refresh = useCallback(() => {
    setRefreshKey((currentKey) => currentKey + 1);
  }, []);

  const hasCurrentRangeData =
    data?.range?.key === normalizedRange;

  return {
    data,
    hasCurrentRangeData,
    isLoading,
    error,
    refresh,
  };
}

export default useAdminAnalytics;
