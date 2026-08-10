import { createApiUrl } from "../config/apiConfig";

const PUBLIC_PACKAGE_DESIGNS_PATH = "/api/package-designs";

function buildPackageDesignsQuery({
  service = "",
  group = "",
  packageSlug = "",
} = {}) {
  const query = new URLSearchParams();

  const cleanService = String(service || "").trim();
  const cleanGroup = String(group || "").trim();
  const cleanPackage = String(packageSlug || "").trim();

  if (cleanService) {
    query.set("service", cleanService);
  }

  if (cleanGroup) {
    query.set("group", cleanGroup);
  }

  if (cleanPackage) {
    query.set("package", cleanPackage);
  }

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}

async function readPublicApiResponse(response) {
  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      responseData?.message ||
        `Package Designs request failed with status ${response.status}.`,
    );
  }

  if (response.status === 204) {
    return [];
  }

  if (responseData?.success === false) {
    throw new Error(
      responseData.message || "Package Designs request was unsuccessful.",
    );
  }

  if (!Array.isArray(responseData?.data)) {
    throw new Error("Package Designs API returned an invalid response.");
  }

  return responseData.data;
}

async function fetchPublicPackageDesigns(filters = {}, { signal } = {}) {
  const queryString = buildPackageDesignsQuery(filters);

  const response = await fetch(
    createApiUrl(`${PUBLIC_PACKAGE_DESIGNS_PATH}${queryString}`),
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal,
    },
  );

  return readPublicApiResponse(response);
}

export { fetchPublicPackageDesigns };
