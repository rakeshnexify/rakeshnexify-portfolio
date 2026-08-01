import { createApiUrl } from "../config/apiConfig";

const ADMIN_SITE_SETTINGS_PATH = "/api/admin/site-settings";

function createAdminSiteSettingsApiError(responseData, response) {
  const error = new Error(
    responseData?.message ||
      `Admin site settings request failed with status ${response.status}.`,
  );

  error.status = response.status;
  error.fieldErrors = responseData?.fieldErrors || {};

  return error;
}

async function readAdminSiteSettingsResponse(response) {
  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    throw createAdminSiteSettingsApiError(responseData, response);
  }

  if (!responseData?.success || !responseData?.data) {
    throw new Error("Admin Site Settings API returned an invalid response.");
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

async function fetchAdminSiteSettings(accessToken, { signal } = {}) {
  const response = await fetch(createApiUrl(ADMIN_SITE_SETTINGS_PATH), {
    method: "GET",

    headers: createAuthorizationHeaders(accessToken),

    signal,
  });

  const responseData = await readAdminSiteSettingsResponse(response);

  return responseData.data;
}

async function updateAdminSiteSettings(accessToken, settingsData) {
  if (
    !settingsData ||
    typeof settingsData !== "object" ||
    Array.isArray(settingsData)
  ) {
    throw new Error("Valid site settings data is required.");
  }

  const response = await fetch(createApiUrl(ADMIN_SITE_SETTINGS_PATH), {
    method: "PATCH",

    headers: {
      ...createAuthorizationHeaders(accessToken),

      "Content-Type": "application/json",
    },

    body: JSON.stringify(settingsData),
  });

  const responseData = await readAdminSiteSettingsResponse(response);

  return {
    message: responseData.message || "Site settings updated successfully.",

    settings: responseData.data,
  };
}

export { fetchAdminSiteSettings, updateAdminSiteSettings };
