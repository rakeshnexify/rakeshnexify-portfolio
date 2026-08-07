import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { fetchPublicPosts } from "../services/postsApi";

const POST_TYPES = ["blog", "news"];

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

export default function usePosts(filters = {}) {
  const normalizedFilters = useMemo(
    () => ({
      search: normalizeStringFilterForHook(filters.search),
      type: normalizeTypeFilterForHook(filters.type),
      category: normalizeStringFilterForHook(filters.category),
      tag: normalizeStringFilterForHook(filters.tag),
      featured: normalizeBooleanFilterForHook(filters.featured),
    }),
    [
      filters.category,
      filters.featured,
      filters.search,
      filters.tag,
      filters.type,
    ],
  );

  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const activeRequestRef = useRef({
    controller: null,
    requestId: 0,
  });

  const loadPosts = useCallback(async () => {
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
      const databasePosts = await fetchPublicPosts(normalizedFilters, {
        signal: controller.signal,
      });

      if (
        controller.signal.aborted ||
        activeRequestRef.current.requestId !== requestId
      ) {
        return;
      }

      setPosts(sortPosts(databasePosts));
      setError("");
    } catch (requestError) {
      if (
        controller.signal.aborted ||
        requestError?.name === "AbortError" ||
        activeRequestRef.current.requestId !== requestId
      ) {
        return;
      }

      console.error("Posts load failed:", requestError);

      setPosts([]);

      setError(
        getErrorMessage(requestError, "Posts could not be loaded."),
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
    loadPosts();

    return () => {
      const currentRequest = activeRequestRef.current;

      currentRequest.controller?.abort();

      activeRequestRef.current = {
        controller: null,
        requestId: currentRequest.requestId + 1,
      };
    };
  }, [loadPosts]);

  const refreshPosts = useCallback(async () => {
    await loadPosts();
  }, [loadPosts]);

  return {
    posts,
    count: posts.length,
    isLoading,
    error,
    refreshPosts,
  };
}

export {
  normalizeBooleanFilterForHook,
  normalizeStringFilterForHook,
  normalizeTypeFilterForHook,
  sortPosts,
};
