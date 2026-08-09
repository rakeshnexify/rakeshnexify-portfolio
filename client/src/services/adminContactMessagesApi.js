import { createApiUrl } from "../config/apiConfig";

const ADMIN_CONTACT_MESSAGES_PATH = "/api/admin/contact-messages";

const contactMessageStatuses = ["new", "read", "replied", "archived"];

function createAdminContactMessagesApiError(responseData, response) {
  const error = new Error(
    responseData?.message ||
      `Admin contact messages request failed with status ${response.status}.`,
  );

  error.status = response.status;

  error.fieldErrors = responseData?.fieldErrors || responseData?.errors || {};

  return error;
}

async function readAdminContactMessagesResponse(response) {
  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    throw createAdminContactMessagesApiError(responseData, response);
  }

  if (!responseData?.success) {
    throw new Error("Admin Contact Messages API returned an invalid response.");
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

function cleanPositiveInteger(value) {
  const number = Number(value);

  return Number.isInteger(number) && number > 0 ? number : null;
}

function buildAdminContactMessagesQuery(filters = {}) {
  const query = new URLSearchParams();

  const search = String(filters.search || "").trim();

  const status = String(filters.status || "")
    .trim()
    .toLowerCase();

  const service = String(filters.service || "").trim();

  const source = String(filters.source || "").trim();

  const sort =
    filters.sort === "oldest"
      ? "oldest"
      : filters.sort === "newest"
        ? "newest"
        : "";

  const page = cleanPositiveInteger(filters.page);

  const limit = cleanPositiveInteger(filters.limit);

  if (search) {
    query.set("search", search);
  }

  if (status) {
    query.set("status", status);
  }

  if (service) {
    query.set("service", service);
  }

  if (source) {
    query.set("source", source);
  }

  if (sort) {
    query.set("sort", sort);
  }

  if (page) {
    query.set("page", String(page));
  }

  if (limit) {
    query.set("limit", String(limit));
  }

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}

function createEmptyStatusCounts() {
  return contactMessageStatuses.reduce(
    (counts, status) => ({
      ...counts,
      [status]: 0,
    }),
    {},
  );
}

function normalizeStatusCounts(statusCounts) {
  const normalizedCounts = createEmptyStatusCounts();

  if (
    !statusCounts ||
    typeof statusCounts !== "object" ||
    Array.isArray(statusCounts)
  ) {
    return normalizedCounts;
  }

  contactMessageStatuses.forEach((status) => {
    const count = Number(statusCounts[status]);

    normalizedCounts[status] = Number.isFinite(count) && count >= 0 ? count : 0;
  });

  return normalizedCounts;
}

async function fetchAdminContactMessages(
  accessToken,
  filters = {},
  { signal } = {},
) {
  const queryString = buildAdminContactMessagesQuery(filters);

  const response = await fetch(
    createApiUrl(`${ADMIN_CONTACT_MESSAGES_PATH}${queryString}`),
    {
      method: "GET",

      headers: createAuthorizationHeaders(accessToken),

      signal,
    },
  );

  const responseData = await readAdminContactMessagesResponse(response);

  const messages = Array.isArray(responseData.data) ? responseData.data : [];

  return {
    messages,

    count: Number(responseData.count) || messages.length,

    total: Number(responseData.total) || messages.length,

    page: Number(responseData.page) || 1,

    limit: Number(responseData.limit) || 20,

    totalPages: Number(responseData.totalPages) || 1,

    statusCounts: normalizeStatusCounts(responseData.statusCounts),
  };
}

async function fetchAdminContactMessageById(
  accessToken,
  messageId,
  { signal } = {},
) {
  if (!messageId) {
    throw new Error("Contact message ID is required.");
  }

  const response = await fetch(
    createApiUrl(`${ADMIN_CONTACT_MESSAGES_PATH}/${messageId}`),
    {
      method: "GET",

      headers: createAuthorizationHeaders(accessToken),

      signal,
    },
  );

  const responseData = await readAdminContactMessagesResponse(response);

  return responseData.data;
}

async function updateAdminContactMessage(accessToken, messageId, messageData) {
  if (!messageId) {
    throw new Error("Contact message ID is required.");
  }

  const response = await fetch(
    createApiUrl(`${ADMIN_CONTACT_MESSAGES_PATH}/${messageId}`),
    {
      method: "PATCH",

      headers: {
        ...createAuthorizationHeaders(accessToken),

        "Content-Type": "application/json",
      },

      body: JSON.stringify(messageData),
    },
  );

  const responseData = await readAdminContactMessagesResponse(response);

  return {
    message: responseData.message,

    contactMessage: responseData.data,
  };
}

async function convertAdminContactMessageToLead(
  accessToken,
  messageId,
  conversionData = {},
) {
  if (!messageId) {
    throw new Error("Contact message ID is required.");
  }

  const response = await fetch(
    createApiUrl(
      `${ADMIN_CONTACT_MESSAGES_PATH}/${messageId}/convert-to-lead`,
    ),
    {
      method: "POST",

      headers: {
        ...createAuthorizationHeaders(accessToken),

        "Content-Type": "application/json",
      },

      body: JSON.stringify(conversionData),
    },
  );

  const responseData = await readAdminContactMessagesResponse(response);

  return {
    message: responseData.message,

    lead: responseData.data,
  };
}

async function deleteAdminContactMessage(accessToken, messageId) {
  if (!messageId) {
    throw new Error("Contact message ID is required.");
  }

  const response = await fetch(
    createApiUrl(`${ADMIN_CONTACT_MESSAGES_PATH}/${messageId}`),
    {
      method: "DELETE",

      headers: createAuthorizationHeaders(accessToken),
    },
  );

  const responseData = await readAdminContactMessagesResponse(response);

  return {
    message: responseData.message,

    deletedContactMessage: responseData.data,
  };
}

export {
  contactMessageStatuses,
  convertAdminContactMessageToLead,
  deleteAdminContactMessage,
  fetchAdminContactMessageById,
  fetchAdminContactMessages,
  updateAdminContactMessage,
};
