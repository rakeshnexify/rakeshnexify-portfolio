import { createApiUrl } from "../config/apiConfig";

const ADMIN_EDUCATION_PATH = "/api/admin/education";

function createAdminEducationApiError(responseData, response) {
  const error = new Error(
    responseData?.message ||
      `Admin Education request failed with status ${response.status}.`,
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

async function readAdminEducationResponse(response) {
  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    throw createAdminEducationApiError(responseData, response);
  }

  if (!responseData?.success) {
    throw new Error("Admin Education API returned an invalid response.");
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

function buildAdminEducationQuery(filters = {}) {
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

  if (typeof filters.isVisible === "boolean") {
    query.set("isVisible", String(filters.isVisible));
  }

  if (typeof filters.isFeatured === "boolean") {
    query.set("isFeatured", String(filters.isFeatured));
  }

  if (typeof filters.isCurrentlyStudying === "boolean") {
    query.set(
      "isCurrentlyStudying",
      String(filters.isCurrentlyStudying),
    );
  }

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}

async function fetchAdminEducation(
  accessToken,
  filters = {},
  { signal } = {},
) {
  const queryString = buildAdminEducationQuery(filters);

  const response = await fetch(
    createApiUrl(`${ADMIN_EDUCATION_PATH}${queryString}`),
    {
      method: "GET",

      headers: createAuthorizationHeaders(accessToken),

      signal,
    },
  );

  const responseData = await readAdminEducationResponse(response);

  return {
    count: Number(responseData.count || 0),

    educationRecords: Array.isArray(responseData.data)
      ? responseData.data
      : [],
  };
}

async function fetchAdminEducationById(
  accessToken,
  educationId,
  { signal } = {},
) {
  if (!educationId) {
    throw new Error("Education ID is required.");
  }

  const response = await fetch(
    createApiUrl(`${ADMIN_EDUCATION_PATH}/${educationId}`),
    {
      method: "GET",

      headers: createAuthorizationHeaders(accessToken),

      signal,
    },
  );

  const responseData = await readAdminEducationResponse(response);

  return responseData.data;
}

async function createAdminEducation(accessToken, educationData) {
  const response = await fetch(createApiUrl(ADMIN_EDUCATION_PATH), {
    method: "POST",

    headers: {
      ...createAuthorizationHeaders(accessToken),

      "Content-Type": "application/json",
    },

    body: JSON.stringify(educationData),
  });

  const responseData = await readAdminEducationResponse(response);

  return {
    message: responseData.message,

    education: responseData.data,
  };
}

async function updateAdminEducation(
  accessToken,
  educationId,
  educationData,
) {
  if (!educationId) {
    throw new Error("Education ID is required.");
  }

  const response = await fetch(
    createApiUrl(`${ADMIN_EDUCATION_PATH}/${educationId}`),
    {
      method: "PATCH",

      headers: {
        ...createAuthorizationHeaders(accessToken),

        "Content-Type": "application/json",
      },

      body: JSON.stringify(educationData),
    },
  );

  const responseData = await readAdminEducationResponse(response);

  return {
    message: responseData.message,

    education: responseData.data,
  };
}

async function deleteAdminEducation(accessToken, educationId) {
  if (!educationId) {
    throw new Error("Education ID is required.");
  }

  const response = await fetch(
    createApiUrl(`${ADMIN_EDUCATION_PATH}/${educationId}`),
    {
      method: "DELETE",

      headers: createAuthorizationHeaders(accessToken),
    },
  );

  const responseData = await readAdminEducationResponse(response);

  return {
    message: responseData.message,

    deletedEducation: responseData.data,
  };
}

export {
  buildAdminEducationQuery,
  createAdminEducation,
  deleteAdminEducation,
  fetchAdminEducation,
  fetchAdminEducationById,
  updateAdminEducation,
};
