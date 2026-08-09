import { createApiUrl } from "../config/apiConfig";

const ADMIN_CERTIFICATION_ACHIEVEMENTS_PATH = "/api/admin/achievements";

const CERTIFICATION_ACHIEVEMENT_TYPES = [
  "certification",
  "license",
  "award",
  "achievement",
];

const CERTIFICATION_ACHIEVEMENT_EXPIRATION_FILTERS = [
  "all",
  "active",
  "expired",
];

function createAdminCertificationAchievementApiError(responseData, response) {
  const error = new Error(
    responseData?.message ||
      `Admin Certifications & Achievements request failed with status ${response.status}.`,
  );

  error.status = response.status;

  error.fieldErrors =
    responseData?.fieldErrors &&
    typeof responseData.fieldErrors === "object" &&
    !Array.isArray(responseData.fieldErrors)
      ? responseData.fieldErrors
      : {};

  return error;
}

async function readAdminCertificationAchievementResponse(response) {
  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    throw createAdminCertificationAchievementApiError(responseData, response);
  }

  if (!responseData?.success) {
    throw new Error(
      "Admin Certifications & Achievements API returned an invalid response.",
    );
  }

  return responseData;
}

function createAuthorizationHeaders(accessToken) {
  if (!accessToken) {
    throw new Error("Admin access token is required.");
  }

  return {
    Accept: "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
}

function normalizeTextFilter(value) {
  return typeof value === "string" ? value.trim() : "";
}

function buildAdminCertificationAchievementsQuery(filters = {}) {
  const query = new URLSearchParams();

  const search = normalizeTextFilter(filters.search);
  const type = normalizeTextFilter(filters.type).toLowerCase();
  const expiration = normalizeTextFilter(filters.expiration).toLowerCase();

  if (search) {
    query.set("search", search);
  }

  if (CERTIFICATION_ACHIEVEMENT_TYPES.includes(type)) {
    query.set("type", type);
  }

  if (typeof filters.isVisible === "boolean") {
    query.set("isVisible", String(filters.isVisible));
  }

  if (typeof filters.isFeatured === "boolean") {
    query.set("isFeatured", String(filters.isFeatured));
  }

  if (
    expiration &&
    CERTIFICATION_ACHIEVEMENT_EXPIRATION_FILTERS.includes(expiration) &&
    expiration !== "all"
  ) {
    query.set("expiration", expiration);
  }

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}

async function fetchAdminCertificationAchievements(
  accessToken,
  filters = {},
  { signal } = {},
) {
  const queryString = buildAdminCertificationAchievementsQuery(filters);

  const response = await fetch(
    createApiUrl(
      `${ADMIN_CERTIFICATION_ACHIEVEMENTS_PATH}${queryString}`,
    ),
    {
      method: "GET",
      headers: createAuthorizationHeaders(accessToken),
      signal,
    },
  );

  const responseData =
    await readAdminCertificationAchievementResponse(response);

  return {
    count: Number(responseData.count || 0),
    achievements: Array.isArray(responseData.data)
      ? responseData.data
      : [],
  };
}

async function fetchAdminCertificationAchievementById(
  accessToken,
  achievementId,
  { signal } = {},
) {
  if (!achievementId) {
    throw new Error("Certification / Achievement ID is required.");
  }

  const response = await fetch(
    createApiUrl(
      `${ADMIN_CERTIFICATION_ACHIEVEMENTS_PATH}/${achievementId}`,
    ),
    {
      method: "GET",
      headers: createAuthorizationHeaders(accessToken),
      signal,
    },
  );

  const responseData =
    await readAdminCertificationAchievementResponse(response);

  return responseData.data;
}

async function createAdminCertificationAchievement(
  accessToken,
  achievementData,
) {
  const response = await fetch(
    createApiUrl(ADMIN_CERTIFICATION_ACHIEVEMENTS_PATH),
    {
      method: "POST",
      headers: {
        ...createAuthorizationHeaders(accessToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(achievementData),
    },
  );

  const responseData =
    await readAdminCertificationAchievementResponse(response);

  return {
    message: responseData.message,
    achievement: responseData.data,
  };
}

async function updateAdminCertificationAchievement(
  accessToken,
  achievementId,
  achievementData,
) {
  if (!achievementId) {
    throw new Error("Certification / Achievement ID is required.");
  }

  const response = await fetch(
    createApiUrl(
      `${ADMIN_CERTIFICATION_ACHIEVEMENTS_PATH}/${achievementId}`,
    ),
    {
      method: "PATCH",
      headers: {
        ...createAuthorizationHeaders(accessToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(achievementData),
    },
  );

  const responseData =
    await readAdminCertificationAchievementResponse(response);

  return {
    message: responseData.message,
    achievement: responseData.data,
  };
}

async function deleteAdminCertificationAchievement(
  accessToken,
  achievementId,
) {
  if (!achievementId) {
    throw new Error("Certification / Achievement ID is required.");
  }

  const response = await fetch(
    createApiUrl(
      `${ADMIN_CERTIFICATION_ACHIEVEMENTS_PATH}/${achievementId}`,
    ),
    {
      method: "DELETE",
      headers: createAuthorizationHeaders(accessToken),
    },
  );

  const responseData =
    await readAdminCertificationAchievementResponse(response);

  return {
    message: responseData.message,
    deletedAchievement: responseData.data,
  };
}

export {
  ADMIN_CERTIFICATION_ACHIEVEMENTS_PATH,
  CERTIFICATION_ACHIEVEMENT_EXPIRATION_FILTERS,
  CERTIFICATION_ACHIEVEMENT_TYPES,
  buildAdminCertificationAchievementsQuery,
  createAdminCertificationAchievement,
  deleteAdminCertificationAchievement,
  fetchAdminCertificationAchievementById,
  fetchAdminCertificationAchievements,
  updateAdminCertificationAchievement,
};
