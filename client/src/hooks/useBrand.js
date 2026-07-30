import { useEffect, useState } from "react";

import { fetchPublicBrandBySlug } from "../services/brandsApi";

function createInitialRequestState(slug) {
  const hasSlug = Boolean(slug);

  return {
    slug,
    brand: null,
    isLoading: hasSlug,

    error: hasSlug ? "" : "Brand slug is required.",

    status: hasSlug ? null : 400,
  };
}

function useBrand(slug) {
  const normalisedSlug = String(slug || "")
    .trim()
    .toLowerCase();

  const [requestState, setRequestState] = useState(() =>
    createInitialRequestState(normalisedSlug),
  );

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!normalisedSlug) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadBrand() {
      try {
        const brand = await fetchPublicBrandBySlug(normalisedSlug, {
          signal: controller.signal,
        });

        setRequestState({
          slug: normalisedSlug,
          brand,
          isLoading: false,
          error: "",
          status: 200,
        });
      } catch (requestError) {
        if (requestError?.name === "AbortError") {
          return;
        }

        console.error("Public brand loading failed:", requestError);

        setRequestState({
          slug: normalisedSlug,
          brand: null,
          isLoading: false,

          error:
            requestError instanceof Error
              ? requestError.message
              : "Brand could not be loaded.",

          status: requestError?.status || null,
        });
      }
    }

    loadBrand();

    return () => {
      controller.abort();
    };
  }, [normalisedSlug, refreshKey]);

  const activeState =
    requestState.slug === normalisedSlug
      ? requestState
      : createInitialRequestState(normalisedSlug);

  function refreshBrand() {
    if (!normalisedSlug) {
      return;
    }

    setRequestState(createInitialRequestState(normalisedSlug));

    setRefreshKey((currentKey) => currentKey + 1);
  }

  return {
    brand: activeState.brand,

    isLoading: activeState.isLoading,

    error: activeState.error,

    status: activeState.status,

    refreshBrand,
  };
}

export default useBrand;
