import { useEffect, useState } from "react";

import { fetchPublicTeamMembers } from "../services/teamApi";

function useTeamMembers({
  fallbackTeamMembers = [],
  search = "",
  professionalRole = "",
  status = "",
  availabilityStatus = "",
  featured,
} = {}) {
  const [teamMembers, setTeamMembers] = useState(fallbackTeamMembers);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTeamMembers() {
      try {
        const response = await fetchPublicTeamMembers(
          {
            search,
            professionalRole,
            status,
            availabilityStatus,
            featured,
          },
          {
            signal: controller.signal,
          },
        );

        setTeamMembers(response.teamMembers);

        setError("");
      } catch (requestError) {
        if (requestError?.name === "AbortError") {
          return;
        }

        console.error("Public Team members loading failed:", requestError);

        setTeamMembers(fallbackTeamMembers);

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Team members could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadTeamMembers();

    return () => {
      controller.abort();
    };
  }, [
    availabilityStatus,
    fallbackTeamMembers,
    featured,
    professionalRole,
    refreshKey,
    search,
    status,
  ]);

  function refreshTeamMembers() {
    setIsLoading(true);
    setError("");

    setRefreshKey((currentKey) => currentKey + 1);
  }

  return {
    teamMembers,
    isLoading,
    error,
    refreshTeamMembers,
  };
}

export default useTeamMembers;