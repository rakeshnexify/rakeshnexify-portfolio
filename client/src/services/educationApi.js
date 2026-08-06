import { createApiUrl } from "../config/apiConfig";

const EDUCATION_PATH = "/api/education";

function extractEducationRecords(responseData) {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  const possibleEducationLists = [
    responseData?.data,
    responseData?.education,
    responseData?.educationRecords,
    responseData?.data?.education,
    responseData?.data?.educationRecords,
    responseData?.result,
    responseData?.result?.education,
    responseData?.result?.educationRecords,
  ];

  return possibleEducationLists.find(Array.isArray) || null;
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

function buildEducationQuery(filters = {}) {
  const query = new URLSearchParams();

  const search = String(filters.search || "").trim();

  const educationType = String(filters.educationType || "")
    .trim()
    .toLowerCase();

  if (search) {
    query.set("search", search);
  }

  if (educationType) {
    query.set("educationType", educationType);
  }

  if (typeof filters.featured === "boolean") {
    query.set("featured", String(filters.featured));
  }

  if (typeof filters.currentlyStudying === "boolean") {
    query.set("currentlyStudying", String(filters.currentlyStudying));
  }

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}

async function fetchPublicEducation(filters = {}, { signal } = {}) {
  const queryString = buildEducationQuery(filters);

  const response = await fetch(
    createApiUrl(`${EDUCATION_PATH}${queryString}`),
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
        `Education request failed with status ${response.status}.`,
    );
  }

  if (response.status === 204) {
    return [];
  }

  if (responseData?.success === false) {
    throw new Error(
      responseData.message || "Education request was unsuccessful.",
    );
  }

  const educationRecords = extractEducationRecords(responseData);

  if (!educationRecords) {
    throw new Error("Education API returned an unsupported response format.");
  }

  return educationRecords;
}

export { buildEducationQuery, fetchPublicEducation };
