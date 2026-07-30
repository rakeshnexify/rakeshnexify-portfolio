import { useEffect, useState } from "react";

import { fetchPublicBrands } from "../services/brandsApi";

function useBrands({
  fallbackBrands = [],
  search = "",
  category = "",
  brandType = "",
  status = "",
  featured,
} = {}) {
  const [brands, setBrands] = useState(fallbackBrands);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadBrands() {
      try {
        const response = await fetchPublicBrands(
          {
            search,
            category,
            brandType,
            status,
            featured,
          },
          {
            signal: controller.signal,
          },
        );

        setBrands(response.brands);

        setError("");
      } catch (requestError) {
        if (requestError?.name === "AbortError") {
          return;
        }

        console.error("Public brands loading failed:", requestError);

        setBrands(fallbackBrands);

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Brands could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadBrands();

    return () => {
      controller.abort();
    };
  }, [
    brandType,
    category,
    fallbackBrands,
    featured,
    refreshKey,
    search,
    status,
  ]);

  function refreshBrands() {
    setIsLoading(true);
    setError("");

    setRefreshKey((currentKey) => currentKey + 1);
  }

  return {
    brands,
    isLoading,
    error,
    refreshBrands,
  };
}

export default useBrands;
