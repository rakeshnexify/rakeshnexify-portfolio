const configuredApiUrl =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const API_URL = configuredApiUrl.replace(/\/+$/, "");

function createAdminBrandsApiError(responseData, response) {
  const error = new Error(
    responseData?.message ||
      `Admin brands request failed with status ${response.status}.`,
  );

  error.status = response.status;

  error.fieldErrors = responseData?.fieldErrors || {};

  return error;
}

async function readAdminBrandsResponse(response) {
  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    throw createAdminBrandsApiError(responseData, response);
  }

  if (!responseData?.success) {
    throw new Error("Admin Brands API returned an invalid response.");
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

function buildAdminBrandsQuery(filters = {}) {
  const query = new URLSearchParams();

  const search = String(filters.search || "").trim();

  const category = String(filters.category || "").trim();

  const brandType = String(filters.brandType || "").trim();

  const status = String(filters.status || "").trim();

  if (search) {
    query.set("search", search);
  }

  if (category) {
    query.set("category", category);
  }

  if (brandType) {
    query.set("brandType", brandType);
  }

  if (status) {
    query.set("status", status);
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

async function fetchAdminBrands(accessToken, filters = {}, { signal } = {}) {
  const response = await fetch(
    `${API_URL}/api/admin/brands${buildAdminBrandsQuery(filters)}`,
    {
      method: "GET",

      headers: createAuthorizationHeaders(accessToken),

      signal,
    },
  );

  const responseData = await readAdminBrandsResponse(response);

  return {
    count: responseData.count ?? responseData.data?.length ?? 0,

    brands: Array.isArray(responseData.data) ? responseData.data : [],
  };
}

async function fetchAdminBrandById(accessToken, brandId, { signal } = {}) {
  if (!brandId) {
    throw new Error("Brand ID is required.");
  }

  const response = await fetch(`${API_URL}/api/admin/brands/${brandId}`, {
    method: "GET",

    headers: createAuthorizationHeaders(accessToken),

    signal,
  });

  const responseData = await readAdminBrandsResponse(response);

  return responseData.data;
}

async function createAdminBrand(accessToken, brandData) {
  const response = await fetch(`${API_URL}/api/admin/brands`, {
    method: "POST",

    headers: {
      ...createAuthorizationHeaders(accessToken),

      "Content-Type": "application/json",
    },

    body: JSON.stringify(brandData),
  });

  const responseData = await readAdminBrandsResponse(response);

  return {
    message: responseData.message,

    brand: responseData.data,
  };
}

async function updateAdminBrand(accessToken, brandId, brandData) {
  if (!brandId) {
    throw new Error("Brand ID is required.");
  }

  const response = await fetch(`${API_URL}/api/admin/brands/${brandId}`, {
    method: "PATCH",

    headers: {
      ...createAuthorizationHeaders(accessToken),

      "Content-Type": "application/json",
    },

    body: JSON.stringify(brandData),
  });

  const responseData = await readAdminBrandsResponse(response);

  return {
    message: responseData.message,

    brand: responseData.data,
  };
}

async function deleteAdminBrand(accessToken, brandId) {
  if (!brandId) {
    throw new Error("Brand ID is required.");
  }

  const response = await fetch(`${API_URL}/api/admin/brands/${brandId}`, {
    method: "DELETE",

    headers: createAuthorizationHeaders(accessToken),
  });

  const responseData = await readAdminBrandsResponse(response);

  return {
    message: responseData.message,

    deletedBrand: responseData.data,
  };
}

export {
  createAdminBrand,
  deleteAdminBrand,
  fetchAdminBrandById,
  fetchAdminBrands,
  updateAdminBrand,
};
