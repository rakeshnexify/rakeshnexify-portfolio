import { useCallback, useEffect, useRef, useState } from "react";

import { fetchAdminMediaById } from "../services/adminMediaApi";

function getMediaItemErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Media details could not be loaded.";
}

export default function useAdminMediaItem(
  accessToken,
  mediaId,
  { enabled = true } = {},
) {
  const [media, setMedia] = useState(null);

  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState(null);

  const activeRequestRef = useRef({
    controller: null,
    requestId: 0,
  });

  const loadMediaItem = useCallback(async () => {
    const previousRequest = activeRequestRef.current;

    previousRequest.controller?.abort();

    const cleanMediaId = typeof mediaId === "string" ? mediaId.trim() : "";

    if (!enabled || !accessToken || !cleanMediaId) {
      activeRequestRef.current = {
        controller: null,
        requestId: previousRequest.requestId + 1,
      };

      setMedia(null);
      setError(null);
      setIsLoading(false);

      return;
    }

    const controller = new AbortController();

    const requestId = previousRequest.requestId + 1;

    activeRequestRef.current = {
      controller,
      requestId,
    };

    setIsLoading(true);
    setError(null);

    try {
      const mediaRecord = await fetchAdminMediaById(accessToken, cleanMediaId, {
        signal: controller.signal,
      });

      if (
        controller.signal.aborted ||
        activeRequestRef.current.requestId !== requestId
      ) {
        return;
      }

      setMedia(mediaRecord);
      setError(null);
    } catch (requestError) {
      if (
        controller.signal.aborted ||
        requestError?.name === "AbortError" ||
        activeRequestRef.current.requestId !== requestId
      ) {
        return;
      }

      console.error("Admin Media detail loading failed:", requestError);

      setMedia(null);

      setError(
        requestError instanceof Error
          ? requestError
          : new Error("Media details could not be loaded."),
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
  }, [accessToken, enabled, mediaId]);

  useEffect(() => {
    loadMediaItem();

    return () => {
      const currentRequest = activeRequestRef.current;

      currentRequest.controller?.abort();

      activeRequestRef.current = {
        controller: null,
        requestId: currentRequest.requestId + 1,
      };
    };
  }, [loadMediaItem]);

  const refreshMediaItem = useCallback(async () => {
    await loadMediaItem();
  }, [loadMediaItem]);

  const usage =
    media?.usage && typeof media.usage === "object" ? media.usage : null;

  return {
    media,

    usage,

    usageCount: Number.isInteger(usage?.usageCount) ? usage.usageCount : 0,

    isReferenced: Boolean(usage?.isReferenced),

    references: Array.isArray(usage?.references) ? usage.references : [],

    resourceTypes: Array.isArray(usage?.resourceTypes)
      ? usage.resourceTypes
      : [],

    isLoading,

    error,

    errorMessage: error ? getMediaItemErrorMessage(error) : "",

    refreshMediaItem,
  };
}

export { getMediaItemErrorMessage };
