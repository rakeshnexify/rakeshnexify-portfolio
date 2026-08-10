import { createApiUrl } from "../config/apiConfig";

const ADMIN_SERVICE_ORDERS_PATH = "/api/admin/service-orders";

function createAdminApiError(responseData, response) {
  const error = new Error(
    responseData?.message ||
      `Admin Service Orders request failed with status ${response.status}.`,
  );

  error.status = response.status;
  error.fieldErrors = responseData?.fieldErrors || {};

  return error;
}

async function readAdminApiResponse(response) {
  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    throw createAdminApiError(responseData, response);
  }

  if (!responseData?.success) {
    throw new Error("Admin Service Orders API returned an invalid response.");
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

function buildOrdersQuery(filters = {}) {
  const query = new URLSearchParams();

  ["search", "status", "group", "service", "page", "limit"].forEach(
    (fieldName) => {
      const cleanValue = String(filters[fieldName] ?? "").trim();

      if (cleanValue) {
        query.set(fieldName, cleanValue);
      }
    },
  );

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}

async function fetchAdminServiceOrders(
  accessToken,
  filters = {},
  { signal } = {},
) {
  const response = await fetch(
    createApiUrl(
      `${ADMIN_SERVICE_ORDERS_PATH}${buildOrdersQuery(filters)}`,
    ),
    {
      method: "GET",
      headers: createAuthorizationHeaders(accessToken),
      signal,
    },
  );

  const responseData = await readAdminApiResponse(response);

  return {
    orders: Array.isArray(responseData.data) ? responseData.data : [],
    count: responseData.count || 0,
    total: responseData.total || 0,
    page: responseData.page || 1,
    limit: responseData.limit || 20,
    pages: responseData.pages || 1,
  };
}

async function fetchAdminServiceOrderById(
  accessToken,
  orderId,
  { signal } = {},
) {
  const response = await fetch(
    createApiUrl(`${ADMIN_SERVICE_ORDERS_PATH}/${orderId}`),
    {
      method: "GET",
      headers: createAuthorizationHeaders(accessToken),
      signal,
    },
  );

  const responseData = await readAdminApiResponse(response);

  return responseData.data;
}

async function updateAdminServiceOrder(
  accessToken,
  orderId,
  orderData,
) {
  const response = await fetch(
    createApiUrl(`${ADMIN_SERVICE_ORDERS_PATH}/${orderId}`),
    {
      method: "PATCH",
      headers: {
        ...createAuthorizationHeaders(accessToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    },
  );

  const responseData = await readAdminApiResponse(response);

  return {
    message: responseData.message,
    order: responseData.data,
  };
}

async function deleteAdminServiceOrder(accessToken, orderId) {
  const response = await fetch(
    createApiUrl(`${ADMIN_SERVICE_ORDERS_PATH}/${orderId}`),
    {
      method: "DELETE",
      headers: createAuthorizationHeaders(accessToken),
    },
  );

  const responseData = await readAdminApiResponse(response);

  return {
    message: responseData.message,
    deletedOrder: responseData.data,
  };
}

export {
  deleteAdminServiceOrder,
  fetchAdminServiceOrderById,
  fetchAdminServiceOrders,
  updateAdminServiceOrder,
};
