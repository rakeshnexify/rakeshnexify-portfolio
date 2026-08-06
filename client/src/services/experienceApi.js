import { createApiUrl } from "../config/apiConfig";

const EXPERIENCE_PATH = "/api/experience";

function extractExperienceRecords(responseData) {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  const possibleExperienceLists = [
    responseData?.data,
    responseData?.experience,
    responseData?.experienceRecords,
    responseData?.data?.experience,
    responseData?.data?.experienceRecords,
    responseData?.result,
    responseData?.result?.experience,
    responseData?.result?.experienceRecords,
  ];

  return possibleExperienceLists.find(Array.isArray) || null;
}

async function readResponseData(response) {
  const responseText = await response.text();

  if (!responseText.trim()) {
    return null;
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return null;
  }
}

function buildExperienceQuery(filters = {}) {
  const query = new URLSearchParams();

  const search = String(filters.search || "").trim();

  const employmentType = String(filters.employmentType || "")
    .trim()
    .toLowerCase();

  if (search) {
    query.set("search", search);
  }

  if (employmentType) {
    query.set("employmentType", employmentType);
  }

  if (typeof filters.current === "boolean") {
    query.set("current", String(filters.current));
  }

  if (typeof filters.featured === "boolean") {
    query.set("featured", String(filters.featured));
  }

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}

async function fetchPublicExperience(filters = {}, { signal } = {}) {
  const queryString = buildExperienceQuery(filters);

  const response = await fetch(
    createApiUrl(`${EXPERIENCE_PATH}${queryString}`),
    {
      method: "GET",

      headers: {
        Accept: "application/json",
      },

      signal,
    },
  );

  const responseData = await readResponseData(response);

  if (!response.ok) {
    throw new Error(
      responseData?.message ||
        `Experience request failed with status ${response.status}.`,
    );
  }

  if (response.status === 204) {
    return [];
  }

  if (responseData?.success === false) {
    throw new Error(
      responseData.message || "Experience request was unsuccessful.",
    );
  }

  const experienceRecords = extractExperienceRecords(responseData);

  if (!experienceRecords) {
    throw new Error("Experience API returned an unsupported response format.");
  }

  return experienceRecords;
}

export { buildExperienceQuery, fetchPublicExperience };
