import { useCallback, useEffect, useState } from "react";

import { fetchPublicPackageDesigns } from "../services/packageDesignsApi";

function getErrorMessage(error) {
  return error instanceof Error
    ? error.message
    : "Package Designs could not be loaded.";
}

export default function usePackageDesigns({
  service = "",
  group = "",
  packageSlug = "",
  enabled = true,
} = {}) {
  const [packageDesigns, setPackageDesigns] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(enabled));
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const canLoad =
      enabled &&
      String(service || "").trim() &&
      String(group || "").trim() &&
      String(packageSlug || "").trim();

    if (!canLoad) {
      setPackageDesigns([]);
      setIsLoading(false);
      setError("");
      return undefined;
    }

    const controller = new AbortController();

    async function loadPackageDesigns() {
      try {
        setIsLoading(true);
        setError("");

        const records = await fetchPublicPackageDesigns(
          {
            service,
            group,
            packageSlug,
          },
          {
            signal: controller.signal,
          },
        );

        if (!controller.signal.aborted) {
          setPackageDesigns(records);
        }
      } catch (requestError) {
        if (requestError?.name === "AbortError") {
          return;
        }

        console.error("Public Package Designs load failed:", requestError);

        if (!controller.signal.aborted) {
          setPackageDesigns([]);
          setError(getErrorMessage(requestError));
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadPackageDesigns();

    return () => {
      controller.abort();
    };
  }, [enabled, group, packageSlug, refreshKey, service]);

  const refreshPackageDesigns = useCallback(() => {
    setRefreshKey((currentKey) => currentKey + 1);
  }, []);

  return {
    packageDesigns,
    isLoading,
    error,
    refreshPackageDesigns,
  };
}
