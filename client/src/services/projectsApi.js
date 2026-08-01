import { createApiUrl } from "../config/apiConfig";

function createProjectsApiError(responseData, response) {
  const error = new Error(
    responseData?.message ||
      `Projects request failed with status ${response.status}.`,
  );

  error.status = response.status;

  return error;
}

async function readProjectsResponse(response) {
  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    throw createProjectsApiError(responseData, response);
  }

  if (!responseData?.success) {
    throw new Error("Projects API returned an invalid response.");
  }

  return responseData;
}

function buildProjectsQuery(filters = {}) {
  const query = new URLSearchParams();

  const search = String(filters.search || "").trim();

  const category = String(filters.category || "").trim();

  if (search) {
    query.set("search", search);
  }

  if (category) {
    query.set("category", category);
  }

  if (typeof filters.featured === "boolean") {
    query.set("featured", String(filters.featured));
  }

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}

async function fetchPublicProjects(filters = {}, { signal } = {}) {
  const queryString = buildProjectsQuery(filters);

  const response = await fetch(createApiUrl(`/api/projects${queryString}`), {
    method: "GET",

    headers: {
      Accept: "application/json",
    },

    signal,
  });

  const responseData = await readProjectsResponse(response);

  if (!Array.isArray(responseData.data)) {
    throw new Error("Projects API did not return a projects list.");
  }

  return {
    count: responseData.count ?? responseData.data.length,

    projects: responseData.data,
  };
}

async function fetchPublicProjectBySlug(slug, { signal } = {}) {
  const normalisedSlug = String(slug || "")
    .trim()
    .toLowerCase();

  if (!normalisedSlug) {
    throw new Error("Project slug is required.");
  }

  const response = await fetch(
    createApiUrl(`/api/projects/${encodeURIComponent(normalisedSlug)}`),
    {
      method: "GET",

      headers: {
        Accept: "application/json",
      },

      signal,
    },
  );

  const responseData = await readProjectsResponse(response);

  if (
    !responseData.data ||
    typeof responseData.data !== "object" ||
    Array.isArray(responseData.data)
  ) {
    throw new Error("Projects API did not return valid project details.");
  }

  return responseData.data;
}

export { fetchPublicProjectBySlug, fetchPublicProjects };
