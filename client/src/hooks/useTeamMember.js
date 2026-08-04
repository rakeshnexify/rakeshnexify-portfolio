import { useEffect, useState } from "react";

import { fetchPublicTeamMemberBySlug } from "../services/teamApi";

function createInitialRequestState(slug) {
  const hasSlug = Boolean(slug);

  return {
    slug,
    teamMember: null,
    isLoading: hasSlug,
    error: hasSlug ? "" : "Team member slug is required.",
    status: hasSlug ? null : 400,
  };
}

function useTeamMember(slug) {
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

    async function loadTeamMember() {
      try {
        const teamMember = await fetchPublicTeamMemberBySlug(normalisedSlug, {
          signal: controller.signal,
        });

        setRequestState({
          slug: normalisedSlug,
          teamMember,
          isLoading: false,
          error: "",
          status: 200,
        });
      } catch (requestError) {
        if (requestError?.name === "AbortError") {
          return;
        }

        console.error("Public Team member loading failed:", requestError);

        setRequestState({
          slug: normalisedSlug,
          teamMember: null,
          isLoading: false,
          error:
            requestError instanceof Error
              ? requestError.message
              : "Team member could not be loaded.",
          status: requestError?.status || null,
        });
      }
    }

    loadTeamMember();

    return () => {
      controller.abort();
    };
  }, [normalisedSlug, refreshKey]);

  const activeState =
    requestState.slug === normalisedSlug
      ? requestState
      : createInitialRequestState(normalisedSlug);

  function refreshTeamMember() {
    if (!normalisedSlug) {
      return;
    }

    setRequestState(createInitialRequestState(normalisedSlug));

    setRefreshKey((currentKey) => currentKey + 1);
  }

  return {
    teamMember: activeState.teamMember,
    isLoading: activeState.isLoading,
    error: activeState.error,
    status: activeState.status,
    refreshTeamMember,
  };
}

export default useTeamMember;
