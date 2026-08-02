import { createApiUrl } from "../config/apiConfig";

const ADMIN_STATISTICS_PATH = "/api/admin/statistics";

function createAdminApiError(responseData, response) {
  const error = new Error(
    responseData?.message ||
      `Admin statistics request failed with status ${response.status}.`,
  );

  error.status = response.status;

  error.fieldErrors = responseData?.fieldErrors || {};

  return error;
}

async function readAdminApiResponse(response) {
  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    throw createAdminApiError(responseData, response);
  }

  if (!responseData?.success) {
    throw new Error("Admin statistics API returned an invalid response.");
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

function buildStatisticsQuery(filters = {}) {
  const query = new URLSearchParams();

  const search = String(filters.search || "").trim();

  if (search) {
    query.set("search", search);
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

async function fetchAdminStatistics(
  accessToken,
  filters = {},
  { signal } = {},
) {
  const queryString = buildStatisticsQuery(filters);

  const response = await fetch(
    createApiUrl(`${ADMIN_STATISTICS_PATH}${queryString}`),
    {
      method: "GET",

      headers: createAuthorizationHeaders(accessToken),

      signal,
    },
  );

  const responseData = await readAdminApiResponse(response);

  return {
    count: responseData.count || 0,

    statistics: Array.isArray(responseData.data) ? responseData.data : [],
  };
}

async function fetchAdminStatisticById(
  accessToken,
  statisticId,
  { signal } = {},
) {
  if (!statisticId) {
    throw new Error("Statistic ID is required.");
  }

  const response = await fetch(
    createApiUrl(`${ADMIN_STATISTICS_PATH}/${statisticId}`),
    {
      method: "GET",

      headers: createAuthorizationHeaders(accessToken),

      signal,
    },
  );

  const responseData = await readAdminApiResponse(response);

  return responseData.data;
}

async function createAdminStatistic(accessToken, statisticData) {
  const response = await fetch(createApiUrl(ADMIN_STATISTICS_PATH), {
    method: "POST",

    headers: {
      ...createAuthorizationHeaders(accessToken),

      "Content-Type": "application/json",
    },

    body: JSON.stringify(statisticData),
  });

  const responseData = await readAdminApiResponse(response);

  return {
    message: responseData.message,

    statistic: responseData.data,
  };
}

async function updateAdminStatistic(accessToken, statisticId, statisticData) {
  if (!statisticId) {
    throw new Error("Statistic ID is required.");
  }

  const response = await fetch(
    createApiUrl(`${ADMIN_STATISTICS_PATH}/${statisticId}`),
    {
      method: "PATCH",

      headers: {
        ...createAuthorizationHeaders(accessToken),

        "Content-Type": "application/json",
      },

      body: JSON.stringify(statisticData),
    },
  );

  const responseData = await readAdminApiResponse(response);

  return {
    message: responseData.message,

    statistic: responseData.data,
  };
}

async function deleteAdminStatistic(accessToken, statisticId) {
  if (!statisticId) {
    throw new Error("Statistic ID is required.");
  }

  const response = await fetch(
    createApiUrl(`${ADMIN_STATISTICS_PATH}/${statisticId}`),
    {
      method: "DELETE",

      headers: createAuthorizationHeaders(accessToken),
    },
  );

  const responseData = await readAdminApiResponse(response);

  return {
    message: responseData.message,

    deletedStatistic: responseData.data,
  };
}

export {
  createAdminStatistic,
  deleteAdminStatistic,
  fetchAdminStatisticById,
  fetchAdminStatistics,
  updateAdminStatistic,
};
