import { useEffect, useState } from "react";

import { fetchPublicSkills } from "../services/skillsApi";

const emptySkills = [];

function useSkills({
  fallbackSkills = emptySkills,
  search = "",
  category = "",
  proficiencyLevel = "",
  featured,
} = {}) {
  const safeFallbackSkills = Array.isArray(fallbackSkills)
    ? fallbackSkills
    : emptySkills;

  const [skills, setSkills] = useState(safeFallbackSkills);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSkills() {
      try {
        const response = await fetchPublicSkills(
          {
            search,
            category,
            proficiencyLevel,
            featured,
          },
          {
            signal: controller.signal,
          },
        );

        setSkills(response.skills);

        setError("");
      } catch (requestError) {
        if (requestError?.name === "AbortError") {
          return;
        }

        console.error("Public Skills loading failed:", requestError);

        setSkills(safeFallbackSkills);

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Skills could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadSkills();

    return () => {
      controller.abort();
    };
  }, [
    category,
    featured,
    proficiencyLevel,
    refreshKey,
    safeFallbackSkills,
    search,
  ]);

  function refreshSkills() {
    setIsLoading(true);

    setError("");

    setRefreshKey((currentKey) => currentKey + 1);
  }

  return {
    skills,
    isLoading,
    error,
    refreshSkills,
  };
}

export default useSkills;