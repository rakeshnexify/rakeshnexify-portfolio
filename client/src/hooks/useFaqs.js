import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchFaqs } from "../services/faqsApi";

function createStableFilterKey(filters = {}) {
  return JSON.stringify({
    search: String(filters.search || "").trim(),
    category: String(filters.category || "").trim(),
    featured:
      filters.featured === true || filters.featured === false
        ? filters.featured
        : "",
  });
}

function useFaqs(filters = {}) {
  const filterKey = useMemo(() => createStableFilterKey(filters), [filters]);

  const normalizedFilters = useMemo(() => JSON.parse(filterKey), [filterKey]);

  const [faqs, setFaqs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshFaqs = useCallback(() => {
    setRefreshKey((currentKey) => currentKey + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadFaqs() {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetchFaqs(normalizedFilters, {
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setFaqs(response.faqs);
        }
      } catch (requestError) {
        if (
          controller.signal.aborted ||
          requestError?.name === "AbortError"
        ) {
          return;
        }

        setFaqs([]);

        setError(
          requestError instanceof Error
            ? requestError.message
            : "FAQs could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadFaqs();

    return () => controller.abort();
  }, [filterKey, normalizedFilters, refreshKey]);

  return {
    faqs,
    isLoading,
    error,
    refreshFaqs,
  };
}

export default useFaqs;
