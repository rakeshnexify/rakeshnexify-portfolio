import { createApiUrl } from "../config/apiConfig";

async function readApiResponse(response) {
  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      responseData?.message ||
        `Site settings request failed with status ${response.status}.`,
    );
  }

  if (!responseData?.success || !responseData?.data) {
    throw new Error("Site settings API returned an invalid response.");
  }

  return responseData.data;
}

export async function fetchPublicSiteSettings({ signal } = {}) {
  const response = await fetch(createApiUrl("/api/site-settings"), {
    method: "GET",

    headers: {
      Accept: "application/json",
    },

    signal,
  });

  return readApiResponse(response);
}
