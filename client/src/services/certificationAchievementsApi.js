import { createApiUrl } from "../config/apiConfig";

const CERTIFICATION_ACHIEVEMENTS_PATH = "/api/achievements";

const certificationAchievementTypes = new Set([
  "certification",
  "license",
  "award",
  "achievement",
]);

function normalizePublicCertificationAchievementFilters(filters = {}) {
  const type = String(filters.type || "").trim().toLowerCase();

  return {
    type: certificationAchievementTypes.has(type) ? type : "",
  };
}

function buildPublicCertificationAchievementsQuery(filters = {}) {
  const normalizedFilters =
    normalizePublicCertificationAchievementFilters(filters);

  const query = new URLSearchParams();

  if (normalizedFilters.type) {
    query.set("type", normalizedFilters.type);
  }

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}

async function readPublicCertificationAchievementsResponse(response) {
  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      responseData?.message ||
        `Certifications & Achievements request failed with status ${response.status}.`,
    );
  }

  if (!responseData?.success || !Array.isArray(responseData.data)) {
    throw new Error(
      "Certifications & Achievements API returned an invalid response.",
    );
  }

  return responseData;
}

async function fetchPublicCertificationAchievements(
  filters = {},
  { signal } = {},
) {
  const queryString = buildPublicCertificationAchievementsQuery(filters);

  const response = await fetch(
    createApiUrl(`${CERTIFICATION_ACHIEVEMENTS_PATH}${queryString}`),
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal,
    },
  );

  const responseData =
    await readPublicCertificationAchievementsResponse(response);

  return responseData.data;
}

export {
  CERTIFICATION_ACHIEVEMENTS_PATH,
  buildPublicCertificationAchievementsQuery,
  fetchPublicCertificationAchievements,
  normalizePublicCertificationAchievementFilters,
};
