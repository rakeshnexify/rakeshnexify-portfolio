import { useEffect, useState } from "react";

import { fetchPublicProjects } from "../services/projectsApi";

function useProjects({
  fallbackProjects = [],
  search = "",
  category = "",
  featured,
} = {}) {
  const [projects, setProjects] = useState(fallbackProjects);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProjects() {
      try {
        const response = await fetchPublicProjects(
          {
            search,
            category,
            featured,
          },
          {
            signal: controller.signal,
          },
        );

        setProjects(response.projects);
        setError("");
      } catch (requestError) {
        if (requestError?.name === "AbortError") {
          return;
        }

        console.error("Public projects loading failed:", requestError);

        setProjects(fallbackProjects);

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Projects could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadProjects();

    return () => {
      controller.abort();
    };
  }, [category, fallbackProjects, featured, refreshKey, search]);

  function refreshProjects() {
    setIsLoading(true);
    setError("");

    setRefreshKey((currentKey) => currentKey + 1);
  }

  return {
    projects,
    isLoading,
    error,
    refreshProjects,
  };
}

export default useProjects;
