import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { fetchPublicPostsResult } from "../services/postsApi";

const POST_TYPES = ["blog", "news"];
const POST_SORT_OPTIONS = ["latest", "oldest", "featured"];

function getTimestamp(value) {
  const timestamp = new Date(value || 0).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function normalizeStringFilterForHook(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    return value;
  }

  const cleanValue = value.trim();

  return cleanValue || undefined;
}

function normalizeTypeFilterForHook(value) {
  const cleanValue = normalizeStringFilterForHook(value);

  if (cleanValue === undefined || typeof cleanValue !== "string") {
    return cleanValue;
  }

  const normalizedType = cleanValue.toLowerCase();

  return POST_TYPES.includes(normalizedType) ? normalizedType : cleanValue;
}

function normalizeBooleanFilterForHook(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return value;
}

function normalizePositiveIntegerFilterForHook(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return value;
}

function normalizeSortFilterForHook(value) {
  const cleanValue = normalizeStringFilterForHook(value);

  if (cleanValue === undefined || typeof cleanValue !== "string") {
    return cleanValue;
  }

  const normalizedSort = cleanValue.toLowerCase();

  return POST_SORT_OPTIONS.includes(normalizedSort)
    ? normalizedSort
    : cleanValue;
}

function sortPosts(posts) {
  return [...posts].sort((firstPost, secondPost) => {
    const featuredDifference =
      Number(Boolean(secondPost?.isFeatured)) -
      Number(Boolean(firstPost?.isFeatured));

    if (featuredDifference !== 0) {
      return featuredDifference;
    }

    const orderDifference =
      Number(firstPost?.order || 0) - Number(secondPost?.order || 0);

    if (orderDifference !== 0) {
      return orderDifference;
    }

    const publishedDateDifference =
      getTimestamp(secondPost?.publishedAt) -
      getTimestamp(firstPost?.publishedAt);

    if (publishedDateDifference !== 0) {
      return publishedDateDifference;
    }

    const createdDateDifference =
      getTimestamp(secondPost?.createdAt) -
      getTimestamp(firstPost?.createdAt);

    if (createdDateDifference !== 0) {
      return createdDateDifference;
    }

    return String(firstPost?._id || firstPost?.id || "").localeCompare(
      String(secondPost?._id || secondPost?.id || ""),
    );
  });
}

function getErrorMessage(error, fallbackMessage) {
  return error instanceof Error ? error.message : fallbackMessage;
}

function createEmptyPagination() {
  return {
    page: 1,
    limit: 0,
    total: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
    isPaginated: false,
  };
}

function createEmptyFacets() {
  return {
    total: 0,
    types: {
      all: 0,
      blog: 0,
      news: 0,
    },
    categories: [],
  };
}

export default function usePosts(filters = {}) {
  const normalizedFilters = useMemo(
    () => ({
      search: normalizeStringFilterForHook(filters.search),
      type: normalizeTypeFilterForHook(filters.type),
      category: normalizeStringFilterForHook(filters.category),
      tag: normalizeStringFilterForHook(filters.tag),
      featured: normalizeBooleanFilterForHook(filters.featured),
      page: normalizePositiveIntegerFilterForHook(filters.page),
      limit: normalizePositiveIntegerFilterForHook(filters.limit),
      sort: normalizeSortFilterForHook(filters.sort),
      facets: normalizeBooleanFilterForHook(filters.facets),
    }),
    [
      filters.category,
      filters.facets,
      filters.featured,
      filters.limit,
      filters.page,
      filters.search,
      filters.sort,
      filters.tag,
      filters.type,
    ],
  );

  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState(createEmptyPagination);
  const [facets, setFacets] = useState(createEmptyFacets);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const activeRequestRef = useRef({
    controller: null,
    requestId: 0,
  });

  useEffect(() => {
    const previousController = activeRequestRef.current.controller;

    previousController?.abort();

    const controller = new AbortController();
    const requestId = activeRequestRef.current.requestId + 1;

    activeRequestRef.current = {
      controller,
      requestId,
    };

    let isDisposed = false;

    Promise.resolve()
      .then(() => {
        if (isDisposed || controller.signal.aborted) {
          return null;
        }

        setIsLoading(true);
        setError("");

        return fetchPublicPostsResult(normalizedFilters, {
          signal: controller.signal,
        });
      })
      .then((result) => {
        if (
          !result ||
          isDisposed ||
          controller.signal.aborted ||
          activeRequestRef.current.requestId !== requestId
        ) {
          return;
        }

        const nextPosts = Array.isArray(result.data) ? result.data : [];

        setPosts(
          normalizedFilters.sort ? nextPosts : sortPosts(nextPosts),
        );
        setPagination(result.pagination || createEmptyPagination());
        setFacets(result.facets || createEmptyFacets());
        setError("");
      })
      .catch((requestError) => {
        if (
          isDisposed ||
          controller.signal.aborted ||
          requestError?.name === "AbortError" ||
          activeRequestRef.current.requestId !== requestId
        ) {
          return;
        }

        console.error("Posts load failed:", requestError);

        setPosts([]);
        setPagination(createEmptyPagination());
        setFacets(createEmptyFacets());
        setError(
          getErrorMessage(requestError, "Posts could not be loaded."),
        );
      })
      .finally(() => {
        if (
          isDisposed ||
          controller.signal.aborted ||
          activeRequestRef.current.requestId !== requestId
        ) {
          return;
        }

        activeRequestRef.current = {
          controller: null,
          requestId,
        };

        setIsLoading(false);
      });

    return () => {
      isDisposed = true;
      controller.abort();

      if (activeRequestRef.current.requestId === requestId) {
        activeRequestRef.current = {
          controller: null,
          requestId: requestId + 1,
        };
      }
    };
  }, [normalizedFilters, refreshKey]);

  const refreshPosts = useCallback(() => {
    setRefreshKey((currentKey) => currentKey + 1);
  }, []);

  return {
    posts,
    count: posts.length,
    total: pagination.total,
    pagination,
    facets,
    isLoading,
    error,
    refreshPosts,
  };
}

export {
  normalizeBooleanFilterForHook,
  normalizePositiveIntegerFilterForHook,
  normalizeSortFilterForHook,
  normalizeStringFilterForHook,
  normalizeTypeFilterForHook,
  sortPosts,
};
