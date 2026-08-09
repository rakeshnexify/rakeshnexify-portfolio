import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchPublicCertificationAchievements } from "../services/certificationAchievementsApi";

const validTypes = new Set([
  "certification",
  "license",
  "award",
  "achievement",
]);

function getTimestamp(value) {
  if (!value) {
    return 0;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function sortCertificationAchievementRecords(records) {
  return [...records].sort((firstRecord, secondRecord) => {
    const featuredDifference =
      Number(Boolean(secondRecord?.isFeatured)) -
      Number(Boolean(firstRecord?.isFeatured));

    if (featuredDifference !== 0) {
      return featuredDifference;
    }

    const orderDifference =
      Number(firstRecord?.order || 0) - Number(secondRecord?.order || 0);

    if (orderDifference !== 0) {
      return orderDifference;
    }

    const issueDateDifference =
      getTimestamp(secondRecord?.issueDate) -
      getTimestamp(firstRecord?.issueDate);

    if (issueDateDifference !== 0) {
      return issueDateDifference;
    }

    return String(firstRecord?._id || firstRecord?.id || "").localeCompare(
      String(secondRecord?._id || secondRecord?.id || ""),
    );
  });
}

function getErrorMessage(error, fallbackMessage) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export default function useCertificationAchievements(filters = {}) {
  const normalizedFilters = useMemo(() => {
    const type = String(filters.type || "").trim().toLowerCase();

    return {
      type: validTypes.has(type) ? type : "",
    };
  }, [filters.type]);

  const [achievementRecords, setAchievementRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadInitialRecords() {
      try {
        setIsLoading(true);

        const databaseRecords =
          await fetchPublicCertificationAchievements(
            normalizedFilters,
            {
              signal: controller.signal,
            },
          );

        if (controller.signal.aborted) {
          return;
        }

        setAchievementRecords(
          sortCertificationAchievementRecords(databaseRecords),
        );
        setError("");
      } catch (requestError) {
        if (
          controller.signal.aborted ||
          requestError?.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "Certifications & Achievements load failed:",
          requestError,
        );

        setAchievementRecords([]);

        setError(
          getErrorMessage(
            requestError,
            "Certifications & Achievements could not be loaded.",
          ),
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialRecords();

    return () => {
      controller.abort();
    };
  }, [normalizedFilters, refreshKey]);

  const refreshCertificationAchievements = useCallback(() => {
    setIsLoading(true);
    setError("");
    setRefreshKey((currentRefreshKey) => currentRefreshKey + 1);
  }, []);

  return {
    achievementRecords,
    count: achievementRecords.length,
    isLoading,
    error,
    refreshCertificationAchievements,
  };
}

export { sortCertificationAchievementRecords };
