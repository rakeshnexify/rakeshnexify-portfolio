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

  const activeRequestRef = useRef({
    controller: null,
    requestId: 0,
  });

  const loadPost = useCallback(async () => {
    const previousController = activeRequestRef.current.controller;

    previousController?.abort();

    const controller = new AbortController();
    const requestId = activeRequestRef.current.requestId + 1;

    activeRequestRef.current = {
      controller,
      requestId,
    };

    if (!slug) {
      setPost(null);
      setError("");
      setStatus(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");
    setStatus(null);

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
    loadPost();

    return () => {
      const currentRequest = activeRequestRef.current;

      currentRequest.controller?.abort();

      activeRequestRef.current = {
        controller: null,
        requestId: currentRequest.requestId + 1,
      };
    };
  }, [loadPost]);

  const refreshPost = useCallback(async () => {
    await loadPost();
  }, [loadPost]);

  return {
    post,
    isLoading,
    error,
    status,
    refreshPost,
  };
}
