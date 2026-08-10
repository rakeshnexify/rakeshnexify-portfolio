import { createApiUrl } from "../config/apiConfig";

const PUBLIC_SERVICE_PACKAGES_PATH = "/api/service-packages";

function buildServicePackagesQuery({ service = "", group = "" } = {}) {
  const query = new URLSearchParams();

  const cleanService = String(service || "").trim();
  const cleanGroup = String(group || "").trim();

  if (cleanService) {
    query.set("service", cleanService);
  }

  if (cleanGroup) {
    query.set("group", cleanGroup);
  }

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}

async function readPublicApiResponse(response, resourceLabel) {
  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      responseData?.message ||
        `${resourceLabel} request failed with status ${response.status}.`,
    );
  }

  if (response.status === 204) {
    return [];
  }

  if (responseData?.success === false) {
    throw new Error(
      responseData.message || `${resourceLabel} request was unsuccessful.`,
    );
  }

  if (!Array.isArray(responseData?.data)) {
    throw new Error(`${resourceLabel} API returned an invalid response.`);
  }

  return responseData.data;
}

async function fetchPublicServicePackages(
  filters = {},
  { signal } = {},
) {
  const queryString = buildServicePackagesQuery(filters);

  const response = await fetch(
    createApiUrl(`${PUBLIC_SERVICE_PACKAGES_PATH}${queryString}`),
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal,
    },
  );

  return readPublicApiResponse(response, "Service Packages");
}

export { fetchPublicServicePackages };
