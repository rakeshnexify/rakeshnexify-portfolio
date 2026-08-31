import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchPublicExperience } from "../services/experienceApi";

function getTimestamp(value) {
  const timestamp = new Date(value || 0).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function sortExperienceRecords(experienceRecords) {
  return [...experienceRecords].sort((firstRecord, secondRecord) => {
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

    const startDateDifference =
      getTimestamp(secondRecord?.startDate) -
      getTimestamp(firstRecord?.startDate);

    if (startDateDifference !== 0) {
      return startDateDifference;
    }

    const createdDateDifference =
      getTimestamp(firstRecord?.createdAt) -
      getTimestamp(secondRecord?.createdAt);

    if (createdDateDifference !== 0) {
      return createdDateDifference;
    }

    return String(firstRecord?._id || firstRecord?.id || "").localeCompare(
      String(secondRecord?._id || secondRecord?.id || ""),
    );
  });
}

function getErrorMessage(error, fallbackMessage) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export default function useExperience(filters = {}) {
  const {
    current,
    employmentType,
    featured,
    search,
  } = filters;

  const normalizedFilters = useMemo(
    () => ({
      search: String(search || "").trim(),

      employmentType: String(employmentType || "")
        .trim()
        .toLowerCase(),

      current:
        typeof current === "boolean"
          ? current
          : undefined,

      featured:
        typeof featured === "boolean"
          ? featured
          : undefined,
    }),
    [
      current,
      employmentType,
      featured,
      search,
    ],
  );

  const [experienceRecords, setExperienceRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadInitialExperience() {
      try {
        setIsLoading(true);

        const databaseExperience = await fetchPublicExperience(
          normalizedFilters,
          {
            signal: controller.signal,
          },
        );

        setExperienceRecords(sortExperienceRecords(databaseExperience));
        setError("");
      } catch (requestError) {
        if (
          controller.signal.aborted ||
          requestError?.name === "AbortError"
        ) {
          return;
        }

        console.error("Experience load failed:", requestError);

        setExperienceRecords([]);

        setError(
          getErrorMessage(
            requestError,
            "Experience records could not be loaded.",
          ),
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialExperience();

    return () => {
      controller.abort();
    };
  }, [normalizedFilters]);

  const refreshExperience = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const databaseExperience = await fetchPublicExperience(
        normalizedFilters,
      );

      setExperienceRecords(sortExperienceRecords(databaseExperience));
    } catch (requestError) {
      console.error("Experience refresh failed:", requestError);

      setError(
        getErrorMessage(
          requestError,
          "Experience records could not be refreshed.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [normalizedFilters]);

  return {
    experienceRecords,
    count: experienceRecords.length,
    isLoading,
    error,
    refreshExperience,
  };
}

export { sortExperienceRecords };
