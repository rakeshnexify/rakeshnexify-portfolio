import { createApiUrl } from "../config/apiConfig";

const COMPANIES_API_BASE_URL = createApiUrl("/api/companies");

function createCompaniesApiError(responseData, response) {
  const error = new Error(
    responseData?.message ||
      `Companies request failed with status ${response.status}.`,
  );

  error.status = response.status;

  return error;
}

async function readCompaniesResponse(response) {
  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    throw createCompaniesApiError(responseData, response);
  }

  if (!responseData?.success) {
    throw new Error("Companies API returned an invalid response.");
  }

  return responseData;
}

function buildCompaniesQuery(filters = {}) {
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

  if (typeof filters.featured === "boolean") {
    query.set("featured", String(filters.featured));
  }

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}

async function fetchPublicCompanies(filters = {}, { signal } = {}) {
  const response = await fetch(
    `${COMPANIES_API_BASE_URL}${buildCompaniesQuery(filters)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal,
    },
  );

  const responseData = await readCompaniesResponse(response);

  if (!Array.isArray(responseData.data)) {
    throw new Error("Companies API did not return a companies list.");
  }

  return {
    count: responseData.count ?? responseData.data.length,
    companies: responseData.data,
  };
}

async function fetchPublicCompanyBySlug(slug, { signal } = {}) {
  const normalisedSlug = String(slug || "")
    .trim()
    .toLowerCase();

  if (!normalisedSlug) {
    throw new Error("Company slug is required.");
  }

  const response = await fetch(
    createApiUrl(`/api/companies/${encodeURIComponent(normalisedSlug)}`),
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal,
    },
  );

  const responseData = await readCompaniesResponse(response);

  if (
    !responseData.data ||
    typeof responseData.data !== "object" ||
    Array.isArray(responseData.data)
  ) {
    throw new Error("Companies API did not return valid company details.");
  }

  return responseData.data;
}

export { fetchPublicCompanies, fetchPublicCompanyBySlug };
