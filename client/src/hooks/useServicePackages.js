import { useCallback, useEffect, useState } from "react";

import { fetchPublicServicePackages } from "../services/servicePackagesApi";

function getErrorMessage(error) {
  return error instanceof Error
    ? error.message
    : "Service Packages could not be loaded.";
}

export default function useServicePackages({
  service = "",
  group = "",
  enabled = true,
} = {}) {
  const [servicePackages, setServicePackages] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(enabled));
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!enabled || !String(service || "").trim()) {
      setServicePackages([]);
      setIsLoading(false);
      setError("");
      return undefined;
    }

    const controller = new AbortController();

    async function loadServicePackages() {
      try {
        setIsLoading(true);
        setError("");

        const records = await fetchPublicServicePackages(
          {
            service,
            group,
          },
          {
            signal: controller.signal,
          },
        );

        if (!controller.signal.aborted) {
          setServicePackages(records);
        }
      } catch (requestError) {
        if (requestError?.name === "AbortError") {
          return;
        }

        console.error("Public Service Packages load failed:", requestError);

        if (!controller.signal.aborted) {
          setServicePackages([]);
          setError(getErrorMessage(requestError));
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadServicePackages();

    return () => {
      controller.abort();
    };
  }, [enabled, group, refreshKey, service]);

  const refreshServicePackages = useCallback(() => {
    setRefreshKey((currentKey) => currentKey + 1);
  }, []);

  return {
    servicePackages,
    isLoading,
    error,
    refreshServicePackages,
  };
}
