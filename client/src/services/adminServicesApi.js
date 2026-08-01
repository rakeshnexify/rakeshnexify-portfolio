import { createApiUrl } from "../config/apiConfig";

const ADMIN_SERVICES_PATH = "/api/admin/services";

function createAdminApiError(responseData, response) {
  const error = new Error(
    responseData?.message ||
      `Admin services request failed with status ${response.status}.`,
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
    throw new Error("Admin services API returned an invalid response.");
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

function buildServicesQuery(filters = {}) {
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

async function fetchAdminServices(accessToken, filters = {}, { signal } = {}) {
  const queryString = buildServicesQuery(filters);

  const response = await fetch(
    createApiUrl(`${ADMIN_SERVICES_PATH}${queryString}`),
    {
      method: "GET",

      headers: createAuthorizationHeaders(accessToken),

      signal,
    },
  );

  const responseData = await readAdminApiResponse(response);

  return {
    count: responseData.count || 0,

    services: Array.isArray(responseData.data) ? responseData.data : [],
  };
}

async function fetchAdminServiceById(accessToken, serviceId, { signal } = {}) {
  if (!serviceId) {
    throw new Error("Service ID is required.");
  }

  const response = await fetch(
    createApiUrl(`${ADMIN_SERVICES_PATH}/${serviceId}`),
    {
      method: "GET",

      headers: createAuthorizationHeaders(accessToken),

      signal,
    },
  );

  const responseData = await readAdminApiResponse(response);

  return responseData.data;
}

async function createAdminService(accessToken, serviceData) {
  const response = await fetch(createApiUrl(ADMIN_SERVICES_PATH), {
    method: "POST",

    headers: {
      ...createAuthorizationHeaders(accessToken),

      "Content-Type": "application/json",
    },

    body: JSON.stringify(serviceData),
  });

  const responseData = await readAdminApiResponse(response);

  return {
    message: responseData.message,
    service: responseData.data,
  };
}

async function updateAdminService(accessToken, serviceId, serviceData) {
  if (!serviceId) {
    throw new Error("Service ID is required.");
  }

  const response = await fetch(
    createApiUrl(`${ADMIN_SERVICES_PATH}/${serviceId}`),
    {
      method: "PATCH",

      headers: {
        ...createAuthorizationHeaders(accessToken),

        "Content-Type": "application/json",
      },

      body: JSON.stringify(serviceData),
    },
  );

  const responseData = await readAdminApiResponse(response);

  return {
    message: responseData.message,
    service: responseData.data,
  };
}

async function deleteAdminService(accessToken, serviceId) {
  if (!serviceId) {
    throw new Error("Service ID is required.");
  }

  const response = await fetch(
    createApiUrl(`${ADMIN_SERVICES_PATH}/${serviceId}`),
    {
      method: "DELETE",

      headers: createAuthorizationHeaders(accessToken),
    },
  );

  const responseData = await readAdminApiResponse(response);

  return {
    message: responseData.message,

    deletedService: responseData.data,
  };
}

export {
  createAdminService,
  deleteAdminService,
  fetchAdminServiceById,
  fetchAdminServices,
  updateAdminService,
};
