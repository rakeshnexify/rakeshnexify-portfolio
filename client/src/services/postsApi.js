import { createApiUrl } from "../config/apiConfig";

const POSTS_PATH = "/api/posts";
const POST_TYPES = ["blog", "news"];

function createFilterError(message, fieldName, fieldMessage = message) {
  const error = new TypeError(message);

  error.fieldErrors = {
    [fieldName]: fieldMessage,
  };

  return error;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeOptionalStringFilter(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    throw createFilterError(
      `${fieldName} filter must be text.`,
      fieldName,
      `${fieldName} must be a single text value.`,
    );
  }

  const cleanValue = value.trim();

  return cleanValue || undefined;
}

function normalizePostTypeFilter(value) {
  const cleanValue = normalizeOptionalStringFilter(value, "type");

  if (cleanValue === undefined) {
    return undefined;
  }

  const normalizedType = cleanValue.toLowerCase();

  if (!POST_TYPES.includes(normalizedType)) {
    throw createFilterError(
      "Post type filter must be blog or news.",
      "type",
      "Select blog or news.",
    );
  }

  return normalizedType;
}

function normalizeBooleanFilter(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw createFilterError(
      `${fieldName} filter must be true or false.`,
      fieldName,
      `${fieldName} must be true or false.`,
    );
  }

  return value;
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

function createPostsApiError(responseData, response, fallbackMessage) {
  const error = new Error(
    responseData?.message ||
      fallbackMessage ||
      `Posts request failed with status ${response.status}.`,
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

function assertPublicPostsListResponse(responseData) {
  if (
    !isPlainObject(responseData) ||
    responseData.success !== true ||
    !Array.isArray(responseData.data)
  ) {
    throw new Error("Posts API returned an unsupported list response.");
  }

  return responseData.data;
}

function assertPublicPostDetailResponse(responseData) {
  if (
    !isPlainObject(responseData) ||
    responseData.success !== true ||
    !isPlainObject(responseData.data)
  ) {
    throw new Error("Posts API returned an unsupported detail response.");
  }

  return responseData.data;
}

function buildPostsQuery(filters = {}) {
  const query = new URLSearchParams();

  const search = normalizeOptionalStringFilter(filters.search, "search");
  const type = normalizePostTypeFilter(filters.type);
  const category = normalizeOptionalStringFilter(filters.category, "category");
  const tag = normalizeOptionalStringFilter(filters.tag, "tag");
  const featured = normalizeBooleanFilter(filters.featured, "featured");

  if (search !== undefined) {
    query.set("search", search);
  }

  if (type !== undefined) {
    query.set("type", type);
  }

  if (category !== undefined) {
    query.set("category", category);
  }

  if (tag !== undefined) {
    query.set("tag", tag);
  }

  if (featured !== undefined) {
    query.set("featured", String(featured));
  }

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}

async function fetchPublicPosts(filters = {}, { signal } = {}) {
  const queryString = buildPostsQuery(filters);

  const response = await fetch(createApiUrl(`${POSTS_PATH}${queryString}`), {
    method: "GET",

    headers: {
      Accept: "application/json",
    },

    signal,
  });

  const responseData = await readResponseData(response);

  if (!response.ok) {
    throw createPostsApiError(
      responseData,
      response,
      `Posts request failed with status ${response.status}.`,
    );
  }

  return assertPublicPostsListResponse(responseData);
}

function normalizePostSlug(value) {
  if (typeof value !== "string") {
    throw new TypeError("Post slug must be text.");
  }

  const slug = value.trim().toLowerCase();

  if (!slug) {
    throw new TypeError("Post slug is required.");
  }

  return slug;
}

async function fetchPublicPostBySlug(slugValue, { signal } = {}) {
  const slug = normalizePostSlug(slugValue);

  const response = await fetch(
    createApiUrl(`${POSTS_PATH}/${encodeURIComponent(slug)}`),
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
    throw createPostsApiError(
      responseData,
      response,
      `Post request failed with status ${response.status}.`,
    );
  }

  return assertPublicPostDetailResponse(responseData);
}

export {
  POST_TYPES,
  assertPublicPostDetailResponse,
  assertPublicPostsListResponse,
  buildPostsQuery,
  fetchPublicPostBySlug,
  fetchPublicPosts,
  normalizeBooleanFilter,
  normalizeOptionalStringFilter,
  normalizePostSlug,
  normalizePostTypeFilter,
};
