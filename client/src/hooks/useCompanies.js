import { useEffect, useState } from "react";

import { fetchPublicCompanies } from "../services/companiesApi";

function useCompanies({
  fallbackCompanies = [],
  search = "",
  industry = "",
  relationship = "",
  status = "",
  featured,
} = {}) {
  const [companies, setCompanies] = useState(fallbackCompanies);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCompanies() {
      try {
        const response = await fetchPublicCompanies(
          {
            search,
            industry,
            relationship,
            status,
            featured,
          },
          {
            signal: controller.signal,
          },
        );

        setCompanies(response.companies);

        setError("");
      } catch (requestError) {
        if (requestError?.name === "AbortError") {
          return;
        }

        console.error("Public companies loading failed:", requestError);

        setCompanies(fallbackCompanies);

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Companies could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadCompanies();

    return () => {
      controller.abort();
    };
  }, [
    fallbackCompanies,
    featured,
    industry,
    refreshKey,
    relationship,
    search,
    status,
  ]);

  function refreshCompanies() {
    setIsLoading(true);
    setError("");

    setRefreshKey((currentKey) => currentKey + 1);
  }

  return {
    companies,
    isLoading,
    error,
    refreshCompanies,
  };
}

export default useCompanies;
