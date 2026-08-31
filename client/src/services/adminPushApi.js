import { createApiUrl } from "../config/apiConfig";

const ADMIN_PUSH_PATH = "/api/admin/push";

function createAdminPushApiError(
  responseData,
  response,
) {
  const error = new Error(
    responseData?.message ||
      `Admin push request failed with status ${response.status}.`,
  );

  error.status = response.status;

  return error;
}

async function readAdminPushResponse(response) {
  const responseData = await response.json().catch(
    () => null,
  );

  if (!response.ok) {
    throw createAdminPushApiError(
      responseData,
      response,
    );
  }

  if (!responseData?.success) {
    throw new Error(
      "Admin Push API returned an invalid response.",
    );
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

async function fetchAdminPushStatus(
  accessToken,
  {
    signal,
  } = {},
) {
  const response = await fetch(
    createApiUrl(
      `${ADMIN_PUSH_PATH}/status`,
    ),
    {
      method: "GET",
      headers:
        createAuthorizationHeaders(accessToken),
      signal,
    },
  );

  const responseData =
    await readAdminPushResponse(response);

  return {
    configured:
      Boolean(responseData.data?.configured),
    publicKey:
      String(
        responseData.data?.publicKey || "",
      ).trim(),
    subscriptionCount:
      Number(
        responseData.data?.subscriptionCount,
      ) || 0,
  };
}

async function saveAdminPushSubscription(
  accessToken,
  subscription,
) {
  const response = await fetch(
    createApiUrl(
      `${ADMIN_PUSH_PATH}/subscriptions`,
    ),
    {
      method: "POST",
      headers: {
        ...createAuthorizationHeaders(
          accessToken,
        ),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscription),
    },
  );

  return readAdminPushResponse(response);
}

async function deleteAdminPushSubscription(
  accessToken,
  endpoint,
) {
  const response = await fetch(
    createApiUrl(
      `${ADMIN_PUSH_PATH}/subscriptions`,
    ),
    {
      method: "DELETE",
      headers: {
        ...createAuthorizationHeaders(
          accessToken,
        ),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        endpoint,
      }),
    },
  );

  return readAdminPushResponse(response);
}

async function sendAdminPushTest(accessToken) {
  const response = await fetch(
    createApiUrl(
      `${ADMIN_PUSH_PATH}/test`,
    ),
    {
      method: "POST",
      headers:
        createAuthorizationHeaders(accessToken),
    },
  );

  const responseData =
    await readAdminPushResponse(response);

  return {
    attempted:
      Number(responseData.data?.attempted) || 0,
    delivered:
      Number(responseData.data?.delivered) || 0,
    message:
      String(
        responseData.message || "Test push sent.",
      ),
  };
}

export {
  deleteAdminPushSubscription,
  fetchAdminPushStatus,
  saveAdminPushSubscription,
  sendAdminPushTest,
};
