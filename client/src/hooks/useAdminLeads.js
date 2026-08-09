import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  buildAdminLeadsQuery,
  fetchAdminLeads,
} from "../services/adminLeadsApi";

const initialStatusCounts = {
  new: 0,
  qualified: 0,
  contacted: 0,
  proposal: 0,
  negotiation: 0,
  won: 0,
  lost: 0,
  archived: 0,
};

const initialFollowUpCounts = {
  overdue: 0,
  today: 0,
};

function createRequestFilters(queryString) {
  const normalizedQuery = queryString.startsWith("?")
    ? queryString.slice(1)
    : queryString;

  return Object.fromEntries(new URLSearchParams(normalizedQuery).entries());
}

function useAdminLeads({
  accessToken = "",
  filters = {},
  onUnauthorized,
  enabled = true,
} = {}) {
  const [leads, setLeads] = useState([]);
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [statusCounts, setStatusCounts] = useState(initialStatusCounts);
  const [followUpCounts, setFollowUpCounts] = useState(initialFollowUpCounts);
  const [isLoading, setIsLoading] = useState(Boolean(enabled && accessToken));
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const onUnauthorizedRef = useRef(onUnauthorized);

  useEffect(() => {
    onUnauthorizedRef.current = onUnauthorized;
  }, [onUnauthorized]);

  const queryString = useMemo(
    () => buildAdminLeadsQuery(filters),
    [filters],
  );

  const requestFilters = useMemo(
    () => createRequestFilters(queryString),
    [queryString],
  );

  const refresh = useCallback(() => {
    setRefreshKey((currentKey) => currentKey + 1);
  }, []);

  useEffect(() => {
    if (!enabled || !accessToken) {
      setIsLoading(false);

      return undefined;
    }

    const controller = new AbortController();

    async function loadLeads() {
      try {
        setIsLoading(true);

        const response = await fetchAdminLeads(
          accessToken,
          requestFilters,
          {
            signal: controller.signal,
          },
        );

        if (controller.signal.aborted) {
          return;
        }

        setLeads(response.leads);
        setCount(response.count);
        setTotal(response.total);
        setPage(response.page);
        setLimit(response.limit);
        setTotalPages(response.totalPages);
        setStatusCounts(response.statusCounts);
        setFollowUpCounts(response.followUpCounts);
        setError("");
      } catch (requestError) {
        if (
          controller.signal.aborted ||
          requestError?.name === "AbortError"
        ) {
          return;
        }

        if (requestError?.status === 401) {
          if (typeof onUnauthorizedRef.current === "function") {
            onUnauthorizedRef.current(requestError);
          }

          return;
        }

        console.error("Admin leads loading failed:", requestError);

        setLeads([]);
        setCount(0);
        setTotal(0);
        setPage(1);
        setLimit(20);
        setTotalPages(1);
        setStatusCounts(initialStatusCounts);
        setFollowUpCounts(initialFollowUpCounts);

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Leads could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadLeads();

    return () => {
      controller.abort();
    };
  }, [
    accessToken,
    enabled,
    queryString,
    refreshKey,
    requestFilters,
  ]);

  return {
    leads,
    count,
    total,
    page,
    limit,
    totalPages,
    statusCounts,
    followUpCounts,
    isLoading,
    error,
    refresh,
  };
}

export default useAdminLeads;
