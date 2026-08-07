import { createApiUrl } from "../config/apiConfig";

const ADMIN_TESTIMONIALS_PATH = "/api/admin/testimonials";

function createInvalidAdminRatingFilterError() {
  const error = new TypeError(
    "Admin Testimonial rating filter must be an integer from 1 to 5.",
  );

  error.fieldErrors = {
    rating: "Select one rating from 1 to 5.",
  };

  return error;
}

function normalizeAdminTestimonialRatingFilter(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "number") {
    if (Number.isInteger(value) && value >= 1 && value <= 5) {
      return String(value);
    }

    throw createInvalidAdminRatingFilterError();
  }

  if (typeof value === "string" && /^[1-5]$/.test(value)) {
    return value;
  }

  throw createInvalidAdminRatingFilterError();
}

function createAdminTestimonialsApiError(responseData, response) {
  const error = new Error(
    responseData?.message ||
      `Admin Testimonials request failed with status ${response.status}.`,
  );

  error.status = response.status;

  error.fieldErrors =
    responseData?.fieldErrors &&
    typeof responseData.fieldErrors === "object" &&
    !Array.isArray(responseData.fieldErrors)
      ? responseData.fieldErrors
      : {};

  return error;
}

async function readAdminTestimonialsResponse(response) {
  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    throw createAdminTestimonialsApiError(responseData, response);
  }

  if (!responseData?.success) {
    throw new Error("Admin Testimonials API returned an invalid response.");
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

function buildAdminTestimonialsQuery(filters = {}) {
  const query = new URLSearchParams();

  const search = String(filters.search || "").trim();

  if (search) {
    query.set("search", search);
  }

  const rating = normalizeAdminTestimonialRatingFilter(filters.rating);

  if (rating !== undefined) {
    query.set("rating", rating);
  }

  if (typeof filters.isVisible === "boolean") {
    query.set("isVisible", String(filters.isVisible));
  }

  if (typeof filters.isFeatured === "boolean") {
    query.set("isFeatured", String(filters.isFeatured));
  }

  const relatedProject = String(filters.relatedProject || "").trim();

  if (relatedProject) {
    query.set("relatedProject", relatedProject);
  }

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}

async function fetchAdminTestimonials(
  accessToken,
  filters = {},
  { signal } = {},
) {
  const queryString = buildAdminTestimonialsQuery(filters);

  const response = await fetch(
    createApiUrl(`${ADMIN_TESTIMONIALS_PATH}${queryString}`),
    {
      method: "GET",

      headers: createAuthorizationHeaders(accessToken),

      signal,
    },
  );

  const responseData = await readAdminTestimonialsResponse(response);

  return {
    count: Number(responseData.count || 0),

    testimonials: Array.isArray(responseData.data)
      ? responseData.data
      : [],
  };
}

async function fetchAdminTestimonialById(
  accessToken,
  testimonialId,
  { signal } = {},
) {
  if (!testimonialId) {
    throw new Error("Testimonial ID is required.");
  }

  const response = await fetch(
    createApiUrl(`${ADMIN_TESTIMONIALS_PATH}/${testimonialId}`),
    {
      method: "GET",

      headers: createAuthorizationHeaders(accessToken),

      signal,
    },
  );

  const responseData = await readAdminTestimonialsResponse(response);

  return responseData.data;
}

async function createAdminTestimonial(accessToken, testimonialData) {
  const response = await fetch(createApiUrl(ADMIN_TESTIMONIALS_PATH), {
    method: "POST",

    headers: {
      ...createAuthorizationHeaders(accessToken),

      "Content-Type": "application/json",
    },

    body: JSON.stringify(testimonialData),
  });

  const responseData = await readAdminTestimonialsResponse(response);

  return {
    message: responseData.message,

    testimonial: responseData.data,
  };
}

async function updateAdminTestimonial(
  accessToken,
  testimonialId,
  testimonialData,
) {
  if (!testimonialId) {
    throw new Error("Testimonial ID is required.");
  }

  const response = await fetch(
    createApiUrl(`${ADMIN_TESTIMONIALS_PATH}/${testimonialId}`),
    {
      method: "PATCH",

      headers: {
        ...createAuthorizationHeaders(accessToken),

        "Content-Type": "application/json",
      },

      body: JSON.stringify(testimonialData),
    },
  );

  const responseData = await readAdminTestimonialsResponse(response);

  return {
    message: responseData.message,

    testimonial: responseData.data,
  };
}

async function deleteAdminTestimonial(accessToken, testimonialId) {
  if (!testimonialId) {
    throw new Error("Testimonial ID is required.");
  }

  const response = await fetch(
    createApiUrl(`${ADMIN_TESTIMONIALS_PATH}/${testimonialId}`),
    {
      method: "DELETE",

      headers: createAuthorizationHeaders(accessToken),
    },
  );

  const responseData = await readAdminTestimonialsResponse(response);

  return {
    message: responseData.message,

    deletedTestimonial: responseData.data,
  };
}

export {
  buildAdminTestimonialsQuery,
  createAdminTestimonial,
  deleteAdminTestimonial,
  fetchAdminTestimonialById,
  fetchAdminTestimonials,
  normalizeAdminTestimonialRatingFilter,
  updateAdminTestimonial,
};
