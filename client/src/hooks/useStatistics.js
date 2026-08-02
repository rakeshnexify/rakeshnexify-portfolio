import { useCallback, useEffect, useState } from "react";

import { fetchPublicStatistics } from "../services/statisticsApi";

function sortStatistics(statistics) {
  return [...statistics].sort(
    (firstStatistic, secondStatistic) =>
      (firstStatistic.order || 0) - (secondStatistic.order || 0),
  );
}

function getErrorMessage(error, fallbackMessage) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export default function useStatistics() {
  const [statistics, setStatistics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadInitialStatistics() {
      try {
        const databaseStatistics = await fetchPublicStatistics({
          signal: controller.signal,
        });

        setStatistics(sortStatistics(databaseStatistics));
        setError("");
      } catch (requestError) {
        if (requestError?.name === "AbortError") {
          return;
        }

        console.error("Statistics load failed:", requestError);

        setStatistics([]);

        setError(
          getErrorMessage(requestError, "Statistics could not be loaded."),
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialStatistics();

    return () => {
      controller.abort();
    };
  }, []);

  const refreshStatistics = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const databaseStatistics = await fetchPublicStatistics();

      setStatistics(sortStatistics(databaseStatistics));
    } catch (requestError) {
      console.error("Statistics refresh failed:", requestError);

      setError(
        getErrorMessage(requestError, "Statistics could not be refreshed."),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    statistics,
    isLoading,
    error,
    refreshStatistics,
  };
}
