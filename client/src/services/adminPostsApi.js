import { createApiUrl } from "../config/apiConfig";

const ADMIN_POSTS_PATH = "/api/admin/posts";
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

function normalizeAdminPostTypeFilter(value) {
  const cleanValue = normalizeOptionalStringFilter(value, "type");

  if (cleanValue === undefined) {
    return undefined;
  }

  const normalizedType = cleanValue.toLowerCase();

  if (!POST_TYPES.includes(normalizedType)) {
    throw createFilterError(
      "Admin Post type filter must be blog or news.",
      "type",
      "Select blog or news.",
    );
  }

  return normalizedType;
}

function normalizeAdminBooleanFilter(value, fieldName) {
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

function createAdminPostsApiError(responseData, response) {
  const error = new Error(
    responseData?.message ||
      `Admin Posts request failed with status ${response.status}.`,
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

async function readAdminPostsResponse(response) {
  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    throw createAdminPostsApiError(responseData, response);
  }

  if (!isPlainObject(responseData) || responseData.success !== true) {
    throw new Error("Admin Posts API returned an unsupported response.");
  }

  return responseData;
}

function assertAdminPostsListResponse(responseData) {
  if (
    !Array.isArray(responseData.data) ||
    !Number.isInteger(responseData.count) ||
    responseData.count < 0
  ) {
    throw new Error("Admin Posts API returned an unsupported list response.");
  }

  return responseData;
}

function assertAdminPostRecordResponse(responseData, operationLabel) {
  if (!isPlainObject(responseData.data)) {
    throw new Error(
      `Admin Posts API returned an unsupported ${operationLabel} response.`,
    );
  }

  return responseData;
}

function assertAdminPostMutationResponse(responseData, operationLabel) {
  if (
    typeof responseData.message !== "string" ||
    !responseData.message.trim() ||
    !isPlainObject(responseData.data)
  ) {
    throw new Error(
      `Admin Posts API returned an unsupported ${operationLabel} response.`,
    );
  }

  return responseData;
}

function assertAdminPostDeleteResponse(responseData) {
  const deletionResult = responseData.data;

  if (
    typeof responseData.message !== "string" ||
    !responseData.message.trim() ||
    !isPlainObject(deletionResult) ||
    typeof deletionResult.id !== "string" ||
    !deletionResult.id.trim() ||
    typeof deletionResult.title !== "string" ||
    typeof deletionResult.slug !== "string" ||
    !POST_TYPES.includes(deletionResult.type)
  ) {
    throw new Error("Admin Posts API returned an unsupported delete response.");
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

function buildAdminPostsQuery(filters = {}) {
  const query = new URLSearchParams();

  const search = normalizeOptionalStringFilter(filters.search, "search");
  const type = normalizeAdminPostTypeFilter(filters.type);
  const category = normalizeOptionalStringFilter(filters.category, "category");
  const tag = normalizeOptionalStringFilter(filters.tag, "tag");
  const isVisible = normalizeAdminBooleanFilter(
    filters.isVisible,
    "isVisible",
  );
  const isFeatured = normalizeAdminBooleanFilter(
    filters.isFeatured,
    "isFeatured",
  );

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

  if (isVisible !== undefined) {
    query.set("isVisible", String(isVisible));
  }

  if (isFeatured !== undefined) {
    query.set("isFeatured", String(isFeatured));
  }

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}

async function fetchAdminPosts(accessToken, filters = {}, { signal } = {}) {
  const queryString = buildAdminPostsQuery(filters);

  const response = await fetch(
    createApiUrl(`${ADMIN_POSTS_PATH}${queryString}`),
    {
      method: "GET",

      headers: createAuthorizationHeaders(accessToken),

      signal,
    },
  );

  const responseData = assertAdminPostsListResponse(
    await readAdminPostsResponse(response),
  );

  return {
    count: responseData.count,
    posts: responseData.data,
  };
}

function normalizePostId(postId) {
  if (typeof postId !== "string") {
    throw new TypeError("Post ID must be text.");
  }

  const cleanPostId = postId.trim();

  if (!cleanPostId) {
    throw new TypeError("Post ID is required.");
  }

  return cleanPostId;
}

async function fetchAdminPostById(accessToken, postId, { signal } = {}) {
  const cleanPostId = normalizePostId(postId);

  const response = await fetch(
    createApiUrl(`${ADMIN_POSTS_PATH}/${encodeURIComponent(cleanPostId)}`),
    {
      method: "GET",

      headers: createAuthorizationHeaders(accessToken),

      signal,
    },
  );

  const responseData = assertAdminPostRecordResponse(
    await readAdminPostsResponse(response),
    "detail",
  );

  return responseData.data;
}

async function createAdminPost(
  accessToken,
  postData,
  { signal } = {},
) {
  const response = await fetch(createApiUrl(ADMIN_POSTS_PATH), {
    method: "POST",

    headers: {
      ...createAuthorizationHeaders(accessToken),

      "Content-Type": "application/json",
    },

    body: JSON.stringify(postData),

    signal,
  });

  const responseData = assertAdminPostMutationResponse(
    await readAdminPostsResponse(response),
    "create",
  );

  return {
    message: responseData.message,
    post: responseData.data,
  };
}

async function updateAdminPost(
  accessToken,
  postId,
  postData,
  { signal } = {},
) {
  const cleanPostId = normalizePostId(postId);

  const response = await fetch(
    createApiUrl(`${ADMIN_POSTS_PATH}/${encodeURIComponent(cleanPostId)}`),
    {
      method: "PATCH",

      headers: {
        ...createAuthorizationHeaders(accessToken),

        "Content-Type": "application/json",
      },

      body: JSON.stringify(postData),

      signal,
    },
  );

  const responseData = assertAdminPostMutationResponse(
    await readAdminPostsResponse(response),
    "update",
  );

  return {
    message: responseData.message,
    post: responseData.data,
  };
}

async function deleteAdminPost(accessToken, postId) {
  const cleanPostId = normalizePostId(postId);

  const response = await fetch(
    createApiUrl(`${ADMIN_POSTS_PATH}/${encodeURIComponent(cleanPostId)}`),
    {
      method: "DELETE",

      headers: createAuthorizationHeaders(accessToken),
    },
  );

  const responseData = assertAdminPostDeleteResponse(
    await readAdminPostsResponse(response),
  );

  return {
    message: responseData.message,
    deletedPost: responseData.data,
  };
}

export {
  assertAdminPostDeleteResponse,
  assertAdminPostMutationResponse,
  assertAdminPostRecordResponse,
  assertAdminPostsListResponse,
  buildAdminPostsQuery,
  createAdminPost,
  deleteAdminPost,
  fetchAdminPostById,
  fetchAdminPosts,
  normalizeAdminBooleanFilter,
  normalizeAdminPostTypeFilter,
  normalizeOptionalStringFilter,
  updateAdminPost,
};
