import { createApiUrl } from "../config/apiConfig";

function createApiError(responseData, response) {
  const error = new Error(
    responseData?.message ||
      `Admin authentication request failed with status ${response.status}.`,
  );

  error.status = response.status;

  error.fieldErrors = responseData?.fieldErrors || {};

  error.retryAfterSeconds = responseData?.retryAfterSeconds || 0;

  return error;
}

async function readApiResponse(response) {
  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    throw createApiError(responseData, response);
  }

  if (!responseData?.success || !responseData?.data) {
    throw new Error("Admin authentication API returned an invalid response.");
  }

  return responseData.data;
}

async function loginAdmin(credentials, { signal } = {}) {
  const response = await fetch(createApiUrl("/api/admin/auth/login"), {
    method: "POST",

    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      email: String(credentials?.email || "")
        .trim()
        .toLowerCase(),

      password: String(credentials?.password || ""),
    }),

    signal,
  });

  return readApiResponse(response);
}

async function fetchCurrentAdmin(accessToken, { signal } = {}) {
  if (!accessToken) {
    throw new Error("Admin access token is required.");
  }

  const response = await fetch(createApiUrl("/api/admin/auth/me"), {
    method: "GET",

    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },

    signal,
  });

  const responseData = await readApiResponse(response);

  return responseData.admin;
}

export { fetchCurrentAdmin, loginAdmin };
