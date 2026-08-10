import { createApiUrl } from "../config/apiConfig";

const ADMIN_PACKAGE_DESIGNS_PATH = "/api/admin/package-designs";

function createAdminApiError(responseData, response) {
  const error = new Error(
    responseData?.message ||
      `Admin Package Designs request failed with status ${response.status}.`,
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
    throw new Error("Admin Package Designs API returned an invalid response.");
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

function buildPackageDesignsQuery(filters = {}) {
  const query = new URLSearchParams();

  ["search", "servicePackage", "service", "group"].forEach((fieldName) => {
    const cleanValue = String(filters[fieldName] || "").trim();

    if (cleanValue) {
      query.set(fieldName, cleanValue);
    }
  });

  ["isVisible", "isDefault", "isFeatured"].forEach((fieldName) => {
    if (typeof filters[fieldName] === "boolean") {
      query.set(fieldName, String(filters[fieldName]));
    }
  });

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}

async function fetchAdminPackageDesigns(
  accessToken,
  filters = {},
  { signal } = {},
) {
  const response = await fetch(
    createApiUrl(
      `${ADMIN_PACKAGE_DESIGNS_PATH}${buildPackageDesignsQuery(filters)}`,
    ),
    {
      method: "GET",
      headers: createAuthorizationHeaders(accessToken),
      signal,
    },
  );

  const responseData = await readAdminApiResponse(response);

  return {
    count: responseData.count || 0,
    packageDesigns: Array.isArray(responseData.data) ? responseData.data : [],
  };
}

async function fetchAdminPackageDesignById(
  accessToken,
  packageDesignId,
  { signal } = {},
) {
  if (!packageDesignId) {
    throw new Error("Package Design ID is required.");
  }

  const response = await fetch(
    createApiUrl(`${ADMIN_PACKAGE_DESIGNS_PATH}/${packageDesignId}`),
    {
      method: "GET",
      headers: createAuthorizationHeaders(accessToken),
      signal,
    },
  );

  const responseData = await readAdminApiResponse(response);

  return responseData.data;
}

async function createAdminPackageDesign(accessToken, packageDesignData) {
  const response = await fetch(createApiUrl(ADMIN_PACKAGE_DESIGNS_PATH), {
    method: "POST",
    headers: {
      ...createAuthorizationHeaders(accessToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(packageDesignData),
  });

  const responseData = await readAdminApiResponse(response);

  return {
    message: responseData.message,
    packageDesign: responseData.data,
  };
}

async function updateAdminPackageDesign(
  accessToken,
  packageDesignId,
  packageDesignData,
) {
  if (!packageDesignId) {
    throw new Error("Package Design ID is required.");
  }

  const response = await fetch(
    createApiUrl(`${ADMIN_PACKAGE_DESIGNS_PATH}/${packageDesignId}`),
    {
      method: "PATCH",
      headers: {
        ...createAuthorizationHeaders(accessToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(packageDesignData),
    },
  );

  const responseData = await readAdminApiResponse(response);

  return {
    message: responseData.message,
    packageDesign: responseData.data,
  };
}

async function deleteAdminPackageDesign(accessToken, packageDesignId) {
  if (!packageDesignId) {
    throw new Error("Package Design ID is required.");
  }

  const response = await fetch(
    createApiUrl(`${ADMIN_PACKAGE_DESIGNS_PATH}/${packageDesignId}`),
    {
      method: "DELETE",
      headers: createAuthorizationHeaders(accessToken),
    },
  );

  const responseData = await readAdminApiResponse(response);

  return {
    message: responseData.message,
    deletedPackageDesign: responseData.data,
  };
}

export {
  createAdminPackageDesign,
  deleteAdminPackageDesign,
  fetchAdminPackageDesignById,
  fetchAdminPackageDesigns,
  updateAdminPackageDesign,
};
