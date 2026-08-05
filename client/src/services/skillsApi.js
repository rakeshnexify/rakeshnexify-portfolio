import { createApiUrl } from "../config/apiConfig";

const SKILLS_API_BASE_URL = createApiUrl("/api/skills");

function createSkillsApiError(responseData, response) {
  const error = new Error(
    responseData?.message ||
      `Skills request failed with status ${response.status}.`,
  );

  error.status = response.status;

  return error;
}

async function readSkillsResponse(response) {
  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    throw createSkillsApiError(responseData, response);
  }

  if (!responseData?.success) {
    throw new Error("Skills API returned an invalid response.");
  }

  return responseData;
}

function buildSkillsQuery(filters = {}) {
  const query = new URLSearchParams();

  const search = String(filters.search || "").trim();

  const category = String(filters.category || "").trim();

  const proficiencyLevel = String(
    filters.proficiencyLevel || "",
  )
    .trim()
    .toLowerCase();

  if (search) {
    query.set("search", search);
  }

  if (category) {
    query.set("category", category);
  }

  if (proficiencyLevel) {
    query.set("proficiencyLevel", proficiencyLevel);
  }

  if (typeof filters.featured === "boolean") {
    query.set("featured", String(filters.featured));
  }

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}

async function fetchPublicSkills(filters = {}, { signal } = {}) {
  const response = await fetch(
    `${SKILLS_API_BASE_URL}${buildSkillsQuery(filters)}`,
    {
      method: "GET",

      headers: {
        Accept: "application/json",
      },

      signal,
    },
  );

  const responseData = await readSkillsResponse(response);

  if (!Array.isArray(responseData.data)) {
    throw new Error("Skills API did not return a Skills list.");
  }

  return {
    count: responseData.count ?? responseData.data.length,

    skills: responseData.data,
  };
}

export { fetchPublicSkills };