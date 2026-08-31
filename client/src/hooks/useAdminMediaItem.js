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

  const [settledRequestKey, setSettledRequestKey] = useState("");

  const cleanMediaId =
    typeof mediaId === "string"
      ? mediaId.trim()
      : "";

  const canLoad = Boolean(
    enabled &&
      accessToken &&
      cleanMediaId,
  );

  const requestKey = JSON.stringify([
    accessToken || "",
    cleanMediaId,
    Boolean(enabled),
  ]);

  const activeRequestRef = useRef({
    controller: null,
    requestId: 0,
  });

  const loadMediaItem = useCallback(async () => {
    const previousRequest = activeRequestRef.current;

    previousRequest.controller?.abort();

    if (!canLoad) {
      activeRequestRef.current = {
        controller: null,
        requestId: previousRequest.requestId + 1,
      };

      return;
    }

    const controller = new AbortController();

    const requestId = previousRequest.requestId + 1;

    activeRequestRef.current = {
      controller,
      requestId,
    };

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
      setSettledRequestKey(requestKey);
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
      setSettledRequestKey(requestKey);
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
  }, [
    accessToken,
    canLoad,
    cleanMediaId,
    requestKey,
  ]);

  useEffect(() => {
    const previousRequest = activeRequestRef.current;

    previousRequest.controller?.abort();

    if (!canLoad) {
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

    fetchAdminMediaById(accessToken, cleanMediaId, {
      signal: controller.signal,
    })
      .then((mediaRecord) => {
        if (
          controller.signal.aborted ||
          activeRequestRef.current.requestId !== requestId
        ) {
          return;
        }

        setMedia(mediaRecord);
        setError(null);
        setSettledRequestKey(requestKey);
      })
      .catch((requestError) => {
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
        setSettledRequestKey(requestKey);
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
  }, [
    accessToken,
    canLoad,
    cleanMediaId,
    requestKey,
  ]);

  const refreshMediaItem = useCallback(async () => {
    if (!canLoad) {
      return;
    }

    setIsLoading(true);
    setError(null);

    await loadMediaItem();
  }, [canLoad, loadMediaItem]);

  const hasCurrentResult =
    settledRequestKey === requestKey;

  const visibleMedia = canLoad
    ? media
    : null;

  const visibleError =
    canLoad && hasCurrentResult
      ? error
      : null;

  const visibleIsLoading =
    canLoad &&
    (isLoading || !hasCurrentResult);

  const usage =
    visibleMedia?.usage &&
    typeof visibleMedia.usage === "object"
      ? visibleMedia.usage
      : null;

  return {
    media: visibleMedia,

    usage,

    usageCount: Number.isInteger(usage?.usageCount) ? usage.usageCount : 0,

    isReferenced: Boolean(usage?.isReferenced),

    references: Array.isArray(usage?.references) ? usage.references : [],

    resourceTypes: Array.isArray(usage?.resourceTypes)
      ? usage.resourceTypes
      : [],

    isLoading: visibleIsLoading,

    error: visibleError,

    errorMessage: visibleError
      ? getMediaItemErrorMessage(visibleError)
      : "",

    refreshMediaItem,
  };
}

export { getMediaItemErrorMessage };
