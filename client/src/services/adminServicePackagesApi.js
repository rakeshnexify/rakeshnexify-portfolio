import { createApiUrl } from "../config/apiConfig";

const ADMIN_SERVICE_PACKAGES_PATH = "/api/admin/service-packages";

function createAdminApiError(responseData, response) {
  const error = new Error(
    responseData?.message ||
      `Admin service packages request failed with status ${response.status}.`,
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
    throw new Error("Admin service packages API returned an invalid response.");
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

function buildServicePackagesQuery(filters = {}) {
  const query = new URLSearchParams();

  const search = String(filters.search || "").trim();
  const service = String(filters.service || "").trim();
  const group = String(filters.group || "").trim();

  if (search) {
    query.set("search", search);
  }

  if (service) {
    query.set("service", service);
  }

  if (group) {
    query.set("group", group);
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

async function fetchAdminServicePackages(
  accessToken,
  filters = {},
  { signal } = {},
) {
  const queryString = buildServicePackagesQuery(filters);

  const response = await fetch(
    createApiUrl(`${ADMIN_SERVICE_PACKAGES_PATH}${queryString}`),
    {
      method: "GET",
      headers: createAuthorizationHeaders(accessToken),
      signal,
    },
  );

  const responseData = await readAdminApiResponse(response);

  return {
    count: responseData.count || 0,
    servicePackages: Array.isArray(responseData.data) ? responseData.data : [],
  };
}

async function fetchAdminServicePackageById(
  accessToken,
  servicePackageId,
  { signal } = {},
) {
  if (!servicePackageId) {
    throw new Error("Service Package ID is required.");
  }

  const response = await fetch(
    createApiUrl(`${ADMIN_SERVICE_PACKAGES_PATH}/${servicePackageId}`),
    {
      method: "GET",
      headers: createAuthorizationHeaders(accessToken),
      signal,
    },
  );

  const responseData = await readAdminApiResponse(response);

  return responseData.data;
}

async function createAdminServicePackage(accessToken, servicePackageData) {
  const response = await fetch(createApiUrl(ADMIN_SERVICE_PACKAGES_PATH), {
    method: "POST",
    headers: {
      ...createAuthorizationHeaders(accessToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(servicePackageData),
  });

  const responseData = await readAdminApiResponse(response);

  return {
    message: responseData.message,
    servicePackage: responseData.data,
  };
}

async function updateAdminServicePackage(
  accessToken,
  servicePackageId,
  servicePackageData,
) {
  if (!servicePackageId) {
    throw new Error("Service Package ID is required.");
  }

  const response = await fetch(
    createApiUrl(`${ADMIN_SERVICE_PACKAGES_PATH}/${servicePackageId}`),
    {
      method: "PATCH",
      headers: {
        ...createAuthorizationHeaders(accessToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(servicePackageData),
    },
  );

  const responseData = await readAdminApiResponse(response);

  return {
    message: responseData.message,
    servicePackage: responseData.data,
  };
}

async function deleteAdminServicePackage(accessToken, servicePackageId) {
  if (!servicePackageId) {
    throw new Error("Service Package ID is required.");
  }

  const response = await fetch(
    createApiUrl(`${ADMIN_SERVICE_PACKAGES_PATH}/${servicePackageId}`),
    {
      method: "DELETE",
      headers: createAuthorizationHeaders(accessToken),
    },
  );

  const responseData = await readAdminApiResponse(response);

  return {
    message: responseData.message,
    deletedServicePackage: responseData.data,
  };
}

export {
  createAdminServicePackage,
  deleteAdminServicePackage,
  fetchAdminServicePackageById,
  fetchAdminServicePackages,
  updateAdminServicePackage,
};
