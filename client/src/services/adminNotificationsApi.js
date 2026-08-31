import { createApiUrl } from "../config/apiConfig";

const ADMIN_NOTIFICATIONS_PATH = "/api/admin/notifications";
const DEFAULT_NOTIFICATION_LIMIT = 12;
const MAX_NOTIFICATION_LIMIT = 50;

function createAdminNotificationsApiError(responseData, response) {
  const error = new Error(
    responseData?.message ||
      `Admin notifications request failed with status ${response.status}.`,
  );

  error.status = response.status;

  return error;
}

async function readAdminNotificationsResponse(response) {
  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    throw createAdminNotificationsApiError(
      responseData,
      response,
    );
  }

  if (!responseData?.success) {
    throw new Error(
      "Admin Notifications API returned an invalid response.",
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

function cleanNotificationLimit(value) {
  const limit = Number(value);

  if (
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > MAX_NOTIFICATION_LIMIT
  ) {
    return DEFAULT_NOTIFICATION_LIMIT;
  }

  return limit;
}

function normalizeUnreadCount(value) {
  const count = Number(value);

  return Number.isFinite(count) && count > 0
    ? Math.floor(count)
    : 0;
}

async function fetchAdminNotifications(
  accessToken,
  {
    limit = DEFAULT_NOTIFICATION_LIMIT,
    signal,
  } = {},
) {
  const query = new URLSearchParams({
    limit: String(cleanNotificationLimit(limit)),
  });

  const response = await fetch(
    createApiUrl(
      `${ADMIN_NOTIFICATIONS_PATH}?${query.toString()}`,
    ),
    {
      method: "GET",
      headers: createAuthorizationHeaders(accessToken),
      signal,
    },
  );

  const responseData =
    await readAdminNotificationsResponse(response);

  const notifications = Array.isArray(responseData.data)
    ? responseData.data
    : [];

  return {
    notifications,
    count:
      Number(responseData.count) ||
      notifications.length,
    unreadCount: normalizeUnreadCount(
      responseData.unreadCount,
    ),
  };
}

async function markAdminNotificationRead(
  accessToken,
  notificationId,
) {
  if (!notificationId) {
    throw new Error("Notification ID is required.");
  }

  const response = await fetch(
    createApiUrl(
      `${ADMIN_NOTIFICATIONS_PATH}/${notificationId}/read`,
    ),
    {
      method: "PATCH",
      headers: createAuthorizationHeaders(accessToken),
    },
  );

  const responseData =
    await readAdminNotificationsResponse(response);

  return {
    notification: responseData.data,
    unreadCount: normalizeUnreadCount(
      responseData.unreadCount,
    ),
  };
}

async function markAllAdminNotificationsRead(accessToken) {
  const response = await fetch(
    createApiUrl(
      `${ADMIN_NOTIFICATIONS_PATH}/read-all`,
    ),
    {
      method: "PATCH",
      headers: createAuthorizationHeaders(accessToken),
    },
  );

  const responseData =
    await readAdminNotificationsResponse(response);

  return {
    modifiedCount:
      Number(responseData.modifiedCount) || 0,
    unreadCount: normalizeUnreadCount(
      responseData.unreadCount,
    ),
  };
}

export {
  fetchAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
};
