import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { fetchPublicTestimonials } from "../services/testimonialsApi";

const INVALID_RATING_FILTER = "__invalid_testimonial_rating_filter__";

function getTimestamp(value) {
  const timestamp = new Date(value || 0).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function normalizeRatingFilterForHook(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  ) {
    return String(value);
  }

  if (typeof value === "string" && /^[1-5]$/.test(value)) {
    return value;
  }

  return INVALID_RATING_FILTER;
}

function sortTestimonials(testimonials) {
  return [...testimonials].sort((firstTestimonial, secondTestimonial) => {
    const featuredDifference =
      Number(Boolean(secondTestimonial?.isFeatured)) -
      Number(Boolean(firstTestimonial?.isFeatured));

    if (featuredDifference !== 0) {
      return featuredDifference;
    }

    const orderDifference =
      Number(firstTestimonial?.order || 0) -
      Number(secondTestimonial?.order || 0);

    if (orderDifference !== 0) {
      return orderDifference;
    }

    const createdDateDifference =
      getTimestamp(firstTestimonial?.createdAt) -
      getTimestamp(secondTestimonial?.createdAt);

    if (createdDateDifference !== 0) {
      return createdDateDifference;
    }

    return String(
      firstTestimonial?._id || firstTestimonial?.id || "",
    ).localeCompare(
      String(secondTestimonial?._id || secondTestimonial?.id || ""),
    );
  });
}

function getErrorMessage(error, fallbackMessage) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export default function useTestimonials(filters = {}) {
  const normalizedFilters = useMemo(
    () => ({
      search: String(filters.search || "").trim(),

      rating: normalizeRatingFilterForHook(filters.rating),

      featured:
        typeof filters.featured === "boolean"
          ? filters.featured
          : undefined,
    }),
    [filters.featured, filters.rating, filters.search],
  );

  const [testimonials, setTestimonials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const activeRequestRef = useRef({
    controller: null,
    requestId: 0,
  });

  const loadTestimonials = useCallback(async () => {
    const previousController = activeRequestRef.current.controller;

    previousController?.abort();

    const controller = new AbortController();
    const requestId = activeRequestRef.current.requestId + 1;

    activeRequestRef.current = {
      controller,
      requestId,
    };

    setIsLoading(true);
    setError("");

    try {
      const databaseTestimonials = await fetchPublicTestimonials(
        normalizedFilters,
        {
          signal: controller.signal,
        },
      );

      if (
        controller.signal.aborted ||
        activeRequestRef.current.requestId !== requestId
      ) {
        return;
      }

      setTestimonials(sortTestimonials(databaseTestimonials));
      setError("");
    } catch (requestError) {
      if (
        controller.signal.aborted ||
        requestError?.name === "AbortError" ||
        activeRequestRef.current.requestId !== requestId
      ) {
        return;
      }

      console.error("Testimonials load failed:", requestError);

      setTestimonials([]);

      setError(
        getErrorMessage(
          requestError,
          "Testimonials could not be loaded.",
        ),
      );
    } finally {
      if (
        !controller.signal.aborted &&
        activeRequestRef.current.requestId === requestId
      ) {
        activeRequestRef.current = {
          controller: null,
          requestId,
        };

        setIsLoading(false);
      }
    }
  }, [normalizedFilters]);

  useEffect(() => {
    loadTestimonials();

    return () => {
      const currentRequest = activeRequestRef.current;

      currentRequest.controller?.abort();

      activeRequestRef.current = {
        controller: null,
        requestId: currentRequest.requestId + 1,
      };
    };
  }, [loadTestimonials]);

  const refreshTestimonials = useCallback(async () => {
    await loadTestimonials();
  }, [loadTestimonials]);

  return {
    testimonials,
    count: testimonials.length,
    isLoading,
    error,
    refreshTestimonials,
  };
}

export { normalizeRatingFilterForHook, sortTestimonials };
