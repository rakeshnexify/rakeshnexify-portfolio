import { createApiUrl } from "../config/apiConfig";

const ADMIN_SUBSCRIBERS_PATH =
  "/api/admin/subscribers";

function createAuthorizationHeaders(
  accessToken,
  {
    includeJsonContentType = false,
  } = {},
) {
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  if (includeJsonContentType) {
    headers["Content-Type"] =
      "application/json";
  }

  return headers;
}

async function parseJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function createAdminSubscriberApiError(
  response,
  responseData,
  fallbackMessage,
) {
  const message =
    typeof responseData?.message === "string" &&
    responseData.message.trim()
      ? responseData.message.trim()
      : fallbackMessage;

  const error = new Error(message);

  error.name = "AdminSubscriberApiError";
  error.status = response.status;
  error.fieldErrors =
    responseData?.fieldErrors &&
    typeof responseData.fieldErrors ===
      "object" &&
    !Array.isArray(responseData.fieldErrors)
      ? responseData.fieldErrors
      : {};

  return error;
}

function appendQueryValue(
  searchParams,
  key,
  value,
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return;
  }

  const normalizedValue =
    typeof value === "string"
      ? value.trim()
      : String(value);

  if (!normalizedValue) {
    return;
  }

  searchParams.set(key, normalizedValue);
}

function buildSubscribersQuery(filters = {}) {
  const searchParams =
    new URLSearchParams();

  appendQueryValue(
    searchParams,
    "page",
    filters.page,
  );

  appendQueryValue(
    searchParams,
    "limit",
    filters.limit,
  );

  appendQueryValue(
    searchParams,
    "search",
    filters.search,
  );

  appendQueryValue(
    searchParams,
    "status",
    filters.status,
  );

  const queryString =
    searchParams.toString();

  return queryString
    ? `?${queryString}`
    : "";
}

function getPositiveNumber(
  value,
  fallback,
) {
  const parsedValue = Number(value);

  if (
    Number.isFinite(parsedValue) &&
    parsedValue > 0
  ) {
    return parsedValue;
  }

  return fallback;
}

function normalizeSubscribersListResponse(
  responseData,
) {
  const nestedData =
    responseData?.data &&
    typeof responseData.data === "object" &&
    !Array.isArray(responseData.data)
      ? responseData.data
      : null;

  const subscribers =
    Array.isArray(responseData?.data)
      ? responseData.data
      : Array.isArray(
            responseData?.subscribers,
          )
        ? responseData.subscribers
        : Array.isArray(
              nestedData?.subscribers,
            )
          ? nestedData.subscribers
          : [];

  const pagination =
    responseData?.pagination &&
    typeof responseData.pagination ===
      "object"
      ? responseData.pagination
      : nestedData?.pagination &&
          typeof nestedData.pagination ===
            "object"
        ? nestedData.pagination
        : {};

  const count = getPositiveNumber(
    responseData?.count ??
      nestedData?.count,
    subscribers.length,
  );

  const total = getPositiveNumber(
    responseData?.total ??
      nestedData?.total ??
      pagination.total,
    count,
  );

  const page = getPositiveNumber(
    responseData?.page ??
      nestedData?.page ??
      pagination.page,
    1,
  );

  const limit = getPositiveNumber(
    responseData?.limit ??
      nestedData?.limit ??
      pagination.limit,
    Math.max(subscribers.length, 1),
  );

  const pages = getPositiveNumber(
    responseData?.pages ??
      responseData?.totalPages ??
      nestedData?.pages ??
      nestedData?.totalPages ??
      pagination.pages ??
      pagination.totalPages,
    Math.max(
      1,
      Math.ceil(total / limit),
    ),
  );

  return {
    subscribers,
    count,
    total,
    page,
    limit,
    pages,
  };
}

async function fetchAdminSubscribers(
  accessToken,
  filters = {},
  {
    signal,
  } = {},
) {
  const response = await fetch(
    createApiUrl(
      `${ADMIN_SUBSCRIBERS_PATH}${buildSubscribersQuery(
        filters,
      )}`,
    ),
    {
      method: "GET",
      headers:
        createAuthorizationHeaders(
          accessToken,
        ),
      signal,
    },
  );

  const responseData =
    await parseJsonResponse(response);

  if (!response.ok) {
    throw createAdminSubscriberApiError(
      response,
      responseData,
      "Unable to load newsletter subscribers.",
    );
  }

  if (responseData?.success !== true) {
    throw new Error(
      responseData?.message ||
        "Subscribers request was unsuccessful.",
    );
  }

  return normalizeSubscribersListResponse(
    responseData,
  );
}

async function unsubscribeAdminSubscriber(
  accessToken,
  subscriberId,
) {
  const response = await fetch(
    createApiUrl(
      `${ADMIN_SUBSCRIBERS_PATH}/${encodeURIComponent(
        subscriberId,
      )}`,
    ),
    {
      method: "PATCH",
      headers:
        createAuthorizationHeaders(
          accessToken,
          {
            includeJsonContentType: true,
          },
        ),
      body: JSON.stringify({
        status: "unsubscribed",
      }),
    },
  );

  const responseData =
    await parseJsonResponse(response);

  if (!response.ok) {
    throw createAdminSubscriberApiError(
      response,
      responseData,
      "Unable to unsubscribe this Subscriber.",
    );
  }

  if (
    responseData?.success !== true ||
    !responseData?.data ||
    typeof responseData.data !==
      "object" ||
    Array.isArray(responseData.data)
  ) {
    throw new Error(
      "Subscriber update returned an unsupported response.",
    );
  }

  return {
    message:
      typeof responseData.message ===
        "string" &&
      responseData.message.trim()
        ? responseData.message.trim()
        : "Subscriber unsubscribed successfully.",
    subscriber: responseData.data,
  };
}

async function deleteAdminSubscriber(
  accessToken,
  subscriberId,
) {
  const response = await fetch(
    createApiUrl(
      `${ADMIN_SUBSCRIBERS_PATH}/${encodeURIComponent(
        subscriberId,
      )}`,
    ),
    {
      method: "DELETE",
      headers:
        createAuthorizationHeaders(
          accessToken,
        ),
    },
  );

  const responseData =
    await parseJsonResponse(response);

  if (!response.ok) {
    throw createAdminSubscriberApiError(
      response,
      responseData,
      "Unable to delete this Subscriber.",
    );
  }

  if (responseData?.success !== true) {
    throw new Error(
      responseData?.message ||
        "Subscriber deletion was unsuccessful.",
    );
  }

  return {
    message:
      typeof responseData.message ===
        "string" &&
      responseData.message.trim()
        ? responseData.message.trim()
        : "Subscriber permanently deleted.",
  };
}

export {
  deleteAdminSubscriber,
  fetchAdminSubscribers,
  unsubscribeAdminSubscriber,
};
