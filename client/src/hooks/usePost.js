import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { fetchPublicPostBySlug } from "../services/postsApi";

function getErrorMessage(error, fallbackMessage) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export default function usePost(slugValue) {
  const slug =
    typeof slugValue === "string" ? slugValue.trim().toLowerCase() : "";

  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(slug));
  const [error, setError] = useState("");
  const [status, setStatus] = useState(null);
  const [settledSlug, setSettledSlug] = useState("");

  const activeRequestRef = useRef({
    controller: null,
    requestId: 0,
  });

  const loadPost = useCallback(async () => {
    const previousController = activeRequestRef.current.controller;

    previousController?.abort();

    if (!slug) {
      activeRequestRef.current = {
        controller: null,
        requestId:
          activeRequestRef.current.requestId + 1,
      };

      return;
    }

    const controller = new AbortController();
    const requestId = activeRequestRef.current.requestId + 1;

    activeRequestRef.current = {
      controller,
      requestId,
    };

    try {
      const databasePost = await fetchPublicPostBySlug(slug, {
        signal: controller.signal,
      });

      if (
        controller.signal.aborted ||
        activeRequestRef.current.requestId !== requestId
      ) {
        return;
      }

      setPost(databasePost);
      setError("");
      setStatus(200);
      setSettledSlug(slug);
    } catch (requestError) {
      if (
        controller.signal.aborted ||
        requestError?.name === "AbortError" ||
        activeRequestRef.current.requestId !== requestId
      ) {
        return;
      }

      console.error("Post load failed:", requestError);

      setPost(null);
      setStatus(Number(requestError?.status) || null);
      setError(
        getErrorMessage(requestError, "Post could not be loaded."),
      );
      setSettledSlug(slug);
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
  }, [slug]);

  useEffect(() => {
    const previousRequest = activeRequestRef.current;

    previousRequest.controller?.abort();

    if (!slug) {
      activeRequestRef.current = {
        controller: null,
        requestId: previousRequest.requestId + 1,
      };

      return undefined;
    }

    const controller = new AbortController();
    const requestId = previousRequest.requestId + 1;

    activeRequestRef.current = {
      controller,
      requestId,
    };

    fetchPublicPostBySlug(slug, {
      signal: controller.signal,
    })
      .then((databasePost) => {
        if (
          controller.signal.aborted ||
          activeRequestRef.current.requestId !== requestId
        ) {
          return;
        }

        setPost(databasePost);
        setError("");
        setStatus(200);
        setSettledSlug(slug);
      })
      .catch((requestError) => {
        if (
          controller.signal.aborted ||
          requestError?.name === "AbortError" ||
          activeRequestRef.current.requestId !== requestId
        ) {
          return;
        }

        console.error("Post load failed:", requestError);

        setPost(null);
        setStatus(Number(requestError?.status) || null);
        setError(
          getErrorMessage(requestError, "Post could not be loaded."),
        );
        setSettledSlug(slug);
      })
      .finally(() => {
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
      });

    return () => {
      const currentRequest = activeRequestRef.current;

      currentRequest.controller?.abort();

      activeRequestRef.current = {
        controller: null,
        requestId: currentRequest.requestId + 1,
      };
    };
  }, [slug]);

  const refreshPost = useCallback(async () => {
    if (!slug) {
      return;
    }

    setIsLoading(true);
    setError("");
    setStatus(null);

    await loadPost();
  }, [loadPost, slug]);

  const hasCurrentResult =
    settledSlug === slug;

  return {
    post: slug
      ? post
      : null,
    isLoading:
      Boolean(slug) &&
      (isLoading || !hasCurrentResult),
    error:
      slug && hasCurrentResult
        ? error
        : "",
    status:
      slug && hasCurrentResult
        ? status
        : null,
    refreshPost,
  };
}
