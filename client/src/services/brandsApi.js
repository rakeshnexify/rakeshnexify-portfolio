const configuredApiUrl =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const API_URL = configuredApiUrl.replace(/\/+$/, "");

function createBrandsApiError(responseData, response) {
  const error = new Error(
    responseData?.message ||
      `Brands request failed with status ${response.status}.`,
  );

  error.status = response.status;

  return error;
}

async function readBrandsResponse(response) {
  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    throw createBrandsApiError(responseData, response);
  }

  if (!responseData?.success) {
    throw new Error("Brands API returned an invalid response.");
  }

  return responseData;
}

function buildBrandsQuery(filters = {}) {
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

  if (typeof filters.featured === "boolean") {
    query.set("featured", String(filters.featured));
  }

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}

async function fetchPublicBrands(filters = {}, { signal } = {}) {
  const response = await fetch(
    `${API_URL}/api/brands${buildBrandsQuery(filters)}`,
    {
      method: "GET",

      headers: {
        Accept: "application/json",
      },

      signal,
    },
  );

  const responseData = await readBrandsResponse(response);

  if (!Array.isArray(responseData.data)) {
    throw new Error("Brands API did not return a brands list.");
  }

  return {
    count: responseData.count ?? responseData.data.length,

    brands: responseData.data,
  };
}

async function fetchPublicBrandBySlug(slug, { signal } = {}) {
  const normalisedSlug = String(slug || "")
    .trim()
    .toLowerCase();

  if (!normalisedSlug) {
    throw new Error("Brand slug is required.");
  }

  const response = await fetch(
    `${API_URL}/api/brands/${encodeURIComponent(normalisedSlug)}`,
    {
      method: "GET",

      headers: {
        Accept: "application/json",
      },

      signal,
    },
  );

  const responseData = await readBrandsResponse(response);

  if (
    !responseData.data ||
    typeof responseData.data !== "object" ||
    Array.isArray(responseData.data)
  ) {
    throw new Error("Brands API did not return valid brand details.");
  }

  return responseData.data;
}

export { fetchPublicBrands, fetchPublicBrandBySlug };
