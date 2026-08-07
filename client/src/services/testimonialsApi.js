import { createApiUrl } from "../config/apiConfig";

const TESTIMONIALS_PATH = "/api/testimonials";

function createInvalidRatingFilterError() {
  const error = new TypeError(
    "Rating filter must be an integer from 1 to 5.",
  );

  error.fieldErrors = {
    rating: "Select one rating from 1 to 5.",
  };

  return error;
}

function normalizeTestimonialRatingFilter(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "number") {
    if (Number.isInteger(value) && value >= 1 && value <= 5) {
      return String(value);
    }

    throw createInvalidRatingFilterError();
  }

  if (typeof value === "string" && /^[1-5]$/.test(value)) {
    return value;
  }

  throw createInvalidRatingFilterError();
}

function extractTestimonials(responseData) {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  const possibleTestimonialLists = [
    responseData?.data,
    responseData?.testimonials,
    responseData?.data?.testimonials,
    responseData?.result,
    responseData?.result?.testimonials,
  ];

  return possibleTestimonialLists.find(Array.isArray) || null;
}

async function readResponseData(response) {
  const responseText = await response.text();

  if (!responseText.trim()) {
    return null;
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return null;
  }
}

function buildTestimonialsQuery(filters = {}) {
  const query = new URLSearchParams();

  const search = String(filters.search || "").trim();

  if (search) {
    query.set("search", search);
  }

  const rating = normalizeTestimonialRatingFilter(filters.rating);

  if (rating !== undefined) {
    query.set("rating", rating);
  }

  if (typeof filters.featured === "boolean") {
    query.set("featured", String(filters.featured));
  }

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}

async function fetchPublicTestimonials(filters = {}, { signal } = {}) {
  const queryString = buildTestimonialsQuery(filters);

  const response = await fetch(
    createApiUrl(`${TESTIMONIALS_PATH}${queryString}`),
    {
      method: "GET",

      headers: {
        Accept: "application/json",
      },

      signal,
    },
  );

  const responseData = await readResponseData(response);

  if (!response.ok) {
    const error = new Error(
      responseData?.message ||
        `Testimonials request failed with status ${response.status}.`,
    );

    error.status = response.status;

    error.fieldErrors =
      responseData?.fieldErrors &&
      typeof responseData.fieldErrors === "object" &&
      !Array.isArray(responseData.fieldErrors)
        ? responseData.fieldErrors
        : {};

    throw error;
  }

  if (response.status === 204) {
    return [];
  }

  if (responseData?.success === false) {
    const error = new Error(
      responseData.message || "Testimonials request was unsuccessful.",
    );

    error.status = response.status;

    error.fieldErrors =
      responseData?.fieldErrors &&
      typeof responseData.fieldErrors === "object" &&
      !Array.isArray(responseData.fieldErrors)
        ? responseData.fieldErrors
        : {};

    throw error;
  }

  const testimonials = extractTestimonials(responseData);

  if (!testimonials) {
    throw new Error(
      "Testimonials API returned an unsupported response format.",
    );
  }

  return testimonials;
}

export {
  buildTestimonialsQuery,
  fetchPublicTestimonials,
  normalizeTestimonialRatingFilter,
};
