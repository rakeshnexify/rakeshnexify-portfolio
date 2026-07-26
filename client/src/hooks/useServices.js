import { useCallback, useEffect, useState } from "react";

import siteData from "../data/siteData";
import { fetchPublicServices } from "../services/servicesApi";

const fallbackServices = Array.isArray(siteData.services)
  ? siteData.services
  : [];

function sortServices(services) {
  return [...services].sort(
    (firstService, secondService) =>
      (firstService.order || 0) - (secondService.order || 0),
  );
}

function getErrorMessage(error, fallbackMessage) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export default function useServices() {
  const [services, setServices] = useState(fallbackServices);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadInitialServices() {
      try {
        const databaseServices = await fetchPublicServices({
          signal: controller.signal,
        });

        setServices(sortServices(databaseServices));
        setError("");
      } catch (requestError) {
        if (requestError?.name === "AbortError") {
          return;
        }

        console.error("Services load failed:", requestError);

        setServices(fallbackServices);

        setError(
          getErrorMessage(requestError, "Services could not be loaded."),
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialServices();

    return () => {
      controller.abort();
    };
  }, []);

  const refreshServices = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const databaseServices = await fetchPublicServices();

      setServices(sortServices(databaseServices));
    } catch (requestError) {
      console.error("Services refresh failed:", requestError);

      setError(
        getErrorMessage(requestError, "Services could not be refreshed."),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    services,
    isLoading,
    error,
    refreshServices,
  };
}
