import { createApiUrl } from "../config/apiConfig";

const FAQS_PATH = "/api/faqs";

function createFaqApiError(responseData, response) {
  const error = new Error(
    responseData?.message ||
      `FAQ request failed with status ${response.status}.`,
  );

  error.status = response.status;
  error.fieldErrors = responseData?.fieldErrors || {};

  return error;
}

async function readFaqApiResponse(response) {
  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    throw createFaqApiError(responseData, response);
  }

  if (!responseData?.success || !Array.isArray(responseData.data)) {
    throw new Error("FAQ API returned an invalid response.");
  }

  return responseData;
}

function buildFaqQuery(filters = {}) {
  const query = new URLSearchParams();

  ["search", "category", "featured"].forEach((fieldName) => {
    const value = filters[fieldName];

    if (value === undefined || value === null || value === "") {
      return;
    }

    query.set(fieldName, String(value));
  });

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}

async function fetchFaqs(filters = {}, { signal } = {}) {
  const response = await fetch(
    createApiUrl(`${FAQS_PATH}${buildFaqQuery(filters)}`),
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal,
    },
  );

  const responseData = await readFaqApiResponse(response);

  return {
    faqs: responseData.data,
    count: Number(responseData.count) || responseData.data.length,
  };
}

export { fetchFaqs };
