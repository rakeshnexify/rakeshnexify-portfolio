import { createApiUrl } from "../config/apiConfig";

const ADMIN_EXPERIENCE_PATH = "/api/admin/experience";

function createAdminExperienceApiError(responseData, response) {
  const error = new Error(
    responseData?.message ||
      `Admin Experience request failed with status ${response.status}.`,
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

async function readAdminExperienceResponse(response) {
  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    throw createAdminExperienceApiError(responseData, response);
  }

  if (!responseData?.success) {
    throw new Error("Admin Experience API returned an invalid response.");
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

function buildAdminExperienceQuery(filters = {}) {
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

  if (typeof filters.isCurrent === "boolean") {
    query.set("isCurrent", String(filters.isCurrent));
  }

  if (typeof filters.isVisible === "boolean") {
    query.set("isVisible", String(filters.isVisible));
  }

  if (typeof filters.isFeatured === "boolean") {
    query.set("isFeatured", String(filters.isFeatured));
  }

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}

async function fetchAdminExperience(
  accessToken,
  filters = {},
  { signal } = {},
) {
  const queryString = buildAdminExperienceQuery(filters);

  const response = await fetch(
    createApiUrl(`${ADMIN_EXPERIENCE_PATH}${queryString}`),
    {
      method: "GET",

      headers: createAuthorizationHeaders(accessToken),

      signal,
    },
  );

  const responseData = await readAdminExperienceResponse(response);

  return {
    count: Number(responseData.count || 0),

    experienceRecords: Array.isArray(responseData.data)
      ? responseData.data
      : [],
  };
}

async function fetchAdminExperienceById(
  accessToken,
  experienceId,
  { signal } = {},
) {
  if (!experienceId) {
    throw new Error("Experience ID is required.");
  }

  const response = await fetch(
    createApiUrl(`${ADMIN_EXPERIENCE_PATH}/${experienceId}`),
    {
      method: "GET",

      headers: createAuthorizationHeaders(accessToken),

      signal,
    },
  );

  const responseData = await readAdminExperienceResponse(response);

  return responseData.data;
}

async function createAdminExperience(accessToken, experienceData) {
  const response = await fetch(createApiUrl(ADMIN_EXPERIENCE_PATH), {
    method: "POST",

    headers: {
      ...createAuthorizationHeaders(accessToken),

      "Content-Type": "application/json",
    },

    body: JSON.stringify(experienceData),
  });

  const responseData = await readAdminExperienceResponse(response);

  return {
    message: responseData.message,

    experience: responseData.data,
  };
}

async function updateAdminExperience(
  accessToken,
  experienceId,
  experienceData,
) {
  if (!experienceId) {
    throw new Error("Experience ID is required.");
  }

  const response = await fetch(
    createApiUrl(`${ADMIN_EXPERIENCE_PATH}/${experienceId}`),
    {
      method: "PATCH",

      headers: {
        ...createAuthorizationHeaders(accessToken),

        "Content-Type": "application/json",
      },

      body: JSON.stringify(experienceData),
    },
  );

  const responseData = await readAdminExperienceResponse(response);

  return {
    message: responseData.message,

    experience: responseData.data,
  };
}

async function deleteAdminExperience(accessToken, experienceId) {
  if (!experienceId) {
    throw new Error("Experience ID is required.");
  }

  const response = await fetch(
    createApiUrl(`${ADMIN_EXPERIENCE_PATH}/${experienceId}`),
    {
      method: "DELETE",

      headers: createAuthorizationHeaders(accessToken),
    },
  );

  const responseData = await readAdminExperienceResponse(response);

  return {
    message: responseData.message,

    deletedExperience: responseData.data,
  };
}

export {
  buildAdminExperienceQuery,
  createAdminExperience,
  deleteAdminExperience,
  fetchAdminExperience,
  fetchAdminExperienceById,
  updateAdminExperience,
};
