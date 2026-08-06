import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchPublicEducation } from "../services/educationApi";

function getTimestamp(value) {
  const timestamp = new Date(value || 0).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function sortEducationRecords(educationRecords) {
  return [...educationRecords].sort((firstRecord, secondRecord) => {
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

export default function useEducation(filters = {}) {
  const normalizedFilters = useMemo(
    () => ({
      search: String(filters.search || "").trim(),

      educationType: String(filters.educationType || "")
        .trim()
        .toLowerCase(),

      featured:
        typeof filters.featured === "boolean"
          ? filters.featured
          : undefined,

      currentlyStudying:
        typeof filters.currentlyStudying === "boolean"
          ? filters.currentlyStudying
          : undefined,
    }),
    [
      filters.currentlyStudying,
      filters.educationType,
      filters.featured,
      filters.search,
    ],
  );

  const [educationRecords, setEducationRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadInitialEducation() {
      try {
        setIsLoading(true);

        const databaseEducation = await fetchPublicEducation(
          normalizedFilters,
          {
            signal: controller.signal,
          },
        );

        setEducationRecords(sortEducationRecords(databaseEducation));
        setError("");
      } catch (requestError) {
        if (
          controller.signal.aborted ||
          requestError?.name === "AbortError"
        ) {
          return;
        }

        console.error("Education load failed:", requestError);

        setEducationRecords([]);

        setError(
          getErrorMessage(
            requestError,
            "Education records could not be loaded.",
          ),
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialEducation();

    return () => {
      controller.abort();
    };
  }, [normalizedFilters]);

  const refreshEducation = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const databaseEducation = await fetchPublicEducation(
        normalizedFilters,
      );

      setEducationRecords(sortEducationRecords(databaseEducation));
    } catch (requestError) {
      console.error("Education refresh failed:", requestError);

      setError(
        getErrorMessage(
          requestError,
          "Education records could not be refreshed.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [normalizedFilters]);

  return {
    educationRecords,
    count: educationRecords.length,
    isLoading,
    error,
    refreshEducation,
  };
}

export { sortEducationRecords };
