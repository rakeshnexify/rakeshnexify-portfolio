import { createApiUrl } from "../config/apiConfig";

const TEAM_API_BASE_URL = createApiUrl("/api/team");

function createTeamApiError(responseData, response) {
  const error = new Error(
    responseData?.message ||
      `Team request failed with status ${response.status}.`,
  );

  error.status = response.status;

  return error;
}

async function readTeamResponse(response) {
  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    throw createTeamApiError(responseData, response);
  }

  if (!responseData?.success) {
    throw new Error("Team API returned an invalid response.");
  }

  return responseData;
}

function buildTeamQuery(filters = {}) {
  const query = new URLSearchParams();

  const search = String(filters.search || "").trim();
  const professionalRole = String(filters.professionalRole || "").trim();
  const status = String(filters.status || "").trim();
  const availabilityStatus = String(filters.availabilityStatus || "").trim();

  if (search) {
    query.set("search", search);
  }

  if (professionalRole) {
    query.set("professionalRole", professionalRole);
  }

  if (status) {
    query.set("status", status);
  }

  if (availabilityStatus) {
    query.set("availabilityStatus", availabilityStatus);
  }

  if (typeof filters.featured === "boolean") {
    query.set("featured", String(filters.featured));
  }

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}

async function fetchPublicTeamMembers(filters = {}, { signal } = {}) {
  const response = await fetch(
    `${TEAM_API_BASE_URL}${buildTeamQuery(filters)}`,
    {
      method: "GET",

      headers: {
        Accept: "application/json",
      },

      signal,
    },
  );

  const responseData = await readTeamResponse(response);

  if (!Array.isArray(responseData.data)) {
    throw new Error("Team API did not return a Team members list.");
  }

  return {
    count: responseData.count ?? responseData.data.length,

    teamMembers: responseData.data,
  };
}

async function fetchPublicTeamMemberBySlug(slug, { signal } = {}) {
  const normalisedSlug = String(slug || "")
    .trim()
    .toLowerCase();

  if (!normalisedSlug) {
    throw new Error("Team member slug is required.");
  }

  const response = await fetch(
    createApiUrl(`/api/team/${encodeURIComponent(normalisedSlug)}`),
    {
      method: "GET",

      headers: {
        Accept: "application/json",
      },

      signal,
    },
  );

  const responseData = await readTeamResponse(response);

  if (
    !responseData.data ||
    typeof responseData.data !== "object" ||
    Array.isArray(responseData.data)
  ) {
    throw new Error("Team API did not return valid Team member details.");
  }

  return responseData.data;
}

export { fetchPublicTeamMemberBySlug, fetchPublicTeamMembers };
