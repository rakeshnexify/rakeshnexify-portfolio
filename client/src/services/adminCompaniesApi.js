const configuredApiUrl =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const API_URL = configuredApiUrl.replace(/\/+$/, "");

function createAdminCompaniesApiError(responseData, response) {
  const error = new Error(
    responseData?.message ||
      `Admin companies request failed with status ${response.status}.`,
  );

  error.status = response.status;

  error.fieldErrors = responseData?.fieldErrors || {};

  return error;
}

async function readAdminCompaniesResponse(response) {
  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    throw createAdminCompaniesApiError(responseData, response);
  }

  if (!responseData?.success) {
    throw new Error("Admin Companies API returned an invalid response.");
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

function buildAdminCompaniesQuery(filters = {}) {
  const query = new URLSearchParams();

  const search = String(filters.search || "").trim();

  const industry = String(filters.industry || "").trim();

  const relationship = String(filters.relationship || "").trim();

  const status = String(filters.status || "").trim();

  if (search) {
    query.set("search", search);
  }

  if (industry) {
    query.set("industry", industry);
  }

  if (relationship) {
    query.set("relationship", relationship);
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

async function fetchAdminCompanies(accessToken, filters = {}, { signal } = {}) {
  const response = await fetch(
    `${API_URL}/api/admin/companies${buildAdminCompaniesQuery(filters)}`,
    {
      method: "GET",

      headers: createAuthorizationHeaders(accessToken),

      signal,
    },
  );

  const responseData = await readAdminCompaniesResponse(response);

  return {
    count: responseData.count ?? responseData.data?.length ?? 0,

    companies: Array.isArray(responseData.data) ? responseData.data : [],
  };
}

async function fetchAdminCompanyById(accessToken, companyId, { signal } = {}) {
  if (!companyId) {
    throw new Error("Company ID is required.");
  }

  const response = await fetch(`${API_URL}/api/admin/companies/${companyId}`, {
    method: "GET",

    headers: createAuthorizationHeaders(accessToken),

    signal,
  });

  const responseData = await readAdminCompaniesResponse(response);

  return responseData.data;
}

async function createAdminCompany(accessToken, companyData) {
  const response = await fetch(`${API_URL}/api/admin/companies`, {
    method: "POST",

    headers: {
      ...createAuthorizationHeaders(accessToken),

      "Content-Type": "application/json",
    },

    body: JSON.stringify(companyData),
  });

  const responseData = await readAdminCompaniesResponse(response);

  return {
    message: responseData.message,

    company: responseData.data,
  };
}

async function updateAdminCompany(accessToken, companyId, companyData) {
  if (!companyId) {
    throw new Error("Company ID is required.");
  }

  const response = await fetch(`${API_URL}/api/admin/companies/${companyId}`, {
    method: "PATCH",

    headers: {
      ...createAuthorizationHeaders(accessToken),

      "Content-Type": "application/json",
    },

    body: JSON.stringify(companyData),
  });

  const responseData = await readAdminCompaniesResponse(response);

  return {
    message: responseData.message,

    company: responseData.data,
  };
}

async function deleteAdminCompany(accessToken, companyId) {
  if (!companyId) {
    throw new Error("Company ID is required.");
  }

  const response = await fetch(`${API_URL}/api/admin/companies/${companyId}`, {
    method: "DELETE",

    headers: createAuthorizationHeaders(accessToken),
  });

  const responseData = await readAdminCompaniesResponse(response);

  return {
    message: responseData.message,

    deletedCompany: responseData.data,
  };
}

export {
  createAdminCompany,
  deleteAdminCompany,
  fetchAdminCompanies,
  fetchAdminCompanyById,
  updateAdminCompany,
};
