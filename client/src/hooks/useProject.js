import { useEffect, useState } from "react";

import { fetchPublicProjectBySlug } from "../services/projectsApi";

function createInitialRequestState(slug) {
  return {
    slug,
    project: null,
    isLoading: true,
    error: "",
    status: null,
  };
}

function useProject(slug) {
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

    async function loadProject() {
      try {
        const project = await fetchPublicProjectBySlug(normalisedSlug, {
          signal: controller.signal,
        });

        setRequestState({
          slug: normalisedSlug,
          project,
          isLoading: false,
          error: "",
          status: 200,
        });
      } catch (requestError) {
        if (requestError?.name === "AbortError") {
          return;
        }

        console.error("Public project loading failed:", requestError);

        setRequestState({
          slug: normalisedSlug,
          project: null,
          isLoading: false,
          error:
            requestError instanceof Error
              ? requestError.message
              : "Project could not be loaded.",
          status: requestError?.status || null,
        });
      }
    }

    loadProject();

    return () => {
      controller.abort();
    };
  }, [normalisedSlug, refreshKey]);

  const activeState =
    requestState.slug === normalisedSlug
      ? requestState
      : createInitialRequestState(normalisedSlug);

  function refreshProject() {
    setRequestState(createInitialRequestState(normalisedSlug));

    setRefreshKey((currentKey) => currentKey + 1);
  }

  return {
    project: activeState.project,
    isLoading: activeState.isLoading,
    error: activeState.error,
    status: activeState.status,
    refreshProject,
  };
}

export default useProject;
