import { createApiUrl } from "../config/apiConfig";

const ADMIN_FAQS_PATH = "/api/admin/faqs";

function createAdminFaqApiError(responseData, response) {
  const error = new Error(
    responseData?.message ||
      `Admin FAQ request failed with status ${response.status}.`,
  );

  error.status = response.status;
  error.fieldErrors = responseData?.fieldErrors || {};

  return error;
}

async function readAdminFaqApiResponse(response) {
  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    throw createAdminFaqApiError(responseData, response);
  }

  if (!responseData?.success) {
    throw new Error("Admin FAQ API returned an invalid response.");
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

function buildAdminFaqQuery(filters = {}) {
  const query = new URLSearchParams();

  ["search", "category", "isVisible", "isFeatured", "page", "limit"].forEach(
    (fieldName) => {
      const value = filters[fieldName];

      if (value === undefined || value === null || value === "") {
        return;
      }

      query.set(fieldName, String(value));
    },
  );

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}

async function fetchAdminFaqs(accessToken, filters = {}, { signal } = {}) {
  const response = await fetch(
    createApiUrl(`${ADMIN_FAQS_PATH}${buildAdminFaqQuery(filters)}`),
    {
      method: "GET",
      headers: createAuthorizationHeaders(accessToken),
      signal,
    },
  );

  const responseData = await readAdminFaqApiResponse(response);
  const pagination = responseData.pagination || {};

  return {
    faqs: Array.isArray(responseData.data) ? responseData.data : [],
    count: Number(responseData.count) || 0,
    pagination: {
      page: Number(pagination.page) || 1,
      limit: Number(pagination.limit) || 20,
      total: Number(pagination.total) || 0,
      pages: Number(pagination.pages) || 1,
    },
  };
}

async function fetchAdminFaqById(accessToken, faqId, { signal } = {}) {
  const response = await fetch(
    createApiUrl(`${ADMIN_FAQS_PATH}/${encodeURIComponent(faqId)}`),
    {
      method: "GET",
      headers: createAuthorizationHeaders(accessToken),
      signal,
    },
  );

  const responseData = await readAdminFaqApiResponse(response);

  return responseData.data;
}

async function createAdminFaq(accessToken, faqData) {
  const response = await fetch(createApiUrl(ADMIN_FAQS_PATH), {
    method: "POST",
    headers: {
      ...createAuthorizationHeaders(accessToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(faqData),
  });

  const responseData = await readAdminFaqApiResponse(response);

  return {
    message: responseData.message,
    faq: responseData.data,
  };
}

async function updateAdminFaq(accessToken, faqId, faqData) {
  const response = await fetch(
    createApiUrl(`${ADMIN_FAQS_PATH}/${encodeURIComponent(faqId)}`),
    {
      method: "PATCH",
      headers: {
        ...createAuthorizationHeaders(accessToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(faqData),
    },
  );

  const responseData = await readAdminFaqApiResponse(response);

  return {
    message: responseData.message,
    faq: responseData.data,
  };
}

async function deleteAdminFaq(accessToken, faqId) {
  const response = await fetch(
    createApiUrl(`${ADMIN_FAQS_PATH}/${encodeURIComponent(faqId)}`),
    {
      method: "DELETE",
      headers: createAuthorizationHeaders(accessToken),
    },
  );

  const responseData = await readAdminFaqApiResponse(response);

  return {
    message: responseData.message,
    deletedFaq: responseData.data,
  };
}

export {
  createAdminFaq,
  deleteAdminFaq,
  fetchAdminFaqById,
  fetchAdminFaqs,
  updateAdminFaq,
};
