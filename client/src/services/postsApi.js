import { createApiUrl } from "../config/apiConfig";

const POSTS_PATH = "/api/posts";
const POST_TYPES = ["blog", "news"];
const POST_SORT_OPTIONS = ["latest", "oldest", "featured"];
const MAX_PAGE_LIMIT = 48;

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

function normalizePositiveIntegerFilter(
  value,
  fieldName,
  {
    maxValue = Number.MAX_SAFE_INTEGER,
  } = {},
) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\d+$/.test(value.trim())
        ? Number(value)
        : Number.NaN;

  if (
    !Number.isSafeInteger(numericValue) ||
    numericValue < 1 ||
    numericValue > maxValue
  ) {
    throw createFilterError(
      `${fieldName} must be between 1 and ${maxValue}.`,
      fieldName,
      `${fieldName} must be between 1 and ${maxValue}.`,
    );
  }

  return numericValue;
}

function normalizeSortFilter(value) {
  const cleanValue = normalizeOptionalStringFilter(value, "sort");

  if (cleanValue === undefined) {
    return undefined;
  }

  const normalizedSort = cleanValue.toLowerCase();

  if (!POST_SORT_OPTIONS.includes(normalizedSort)) {
    throw createFilterError(
      "Post sort must be latest, oldest or featured.",
      "sort",
      "Select latest, oldest or featured.",
    );
  }

  return normalizedSort;
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

function normalizePagination(value, fallbackTotal = 0) {
  if (!isPlainObject(value)) {
    return {
      page: 1,
      limit: fallbackTotal,
      total: fallbackTotal,
      totalPages: fallbackTotal > 0 ? 1 : 0,
      hasPreviousPage: false,
      hasNextPage: false,
      isPaginated: false,
    };
  }

  return {
    page: Number(value.page || 1),
    limit: Number(value.limit || 0),
    total: Number(value.total || fallbackTotal),
    totalPages: Number(value.totalPages || 0),
    hasPreviousPage: Boolean(value.hasPreviousPage),
    hasNextPage: Boolean(value.hasNextPage),
    isPaginated: Boolean(value.isPaginated),
  };
}

function normalizeFacets(value) {
  const source = isPlainObject(value) ? value : {};
  const typeSource = isPlainObject(source.types) ? source.types : {};

  const categories = Array.isArray(source.categories)
    ? source.categories
        .map((category) => {
          if (!isPlainObject(category)) {
            return null;
          }

          const label = String(category.label || "").trim();
          const valueKey = String(category.value || "").trim();

          if (!label || !valueKey) {
            return null;
          }

          return {
            value: valueKey,
            label,
            count: Number(category.count || 0),
          };
        })
        .filter(Boolean)
    : [];

  return {
    total: Number(source.total || 0),
    types: {
      all: Number(typeSource.all || 0),
      blog: Number(typeSource.blog || 0),
      news: Number(typeSource.news || 0),
    },
    categories,
  };
}

function normalizePostContext(value) {
  const source = isPlainObject(value) ? value : {};

  return {
    recentPosts: Array.isArray(source.recentPosts)
      ? source.recentPosts
      : [],
    relatedPosts: Array.isArray(source.relatedPosts)
      ? source.relatedPosts
      : [],
    previousPost: isPlainObject(source.previousPost)
      ? source.previousPost
      : null,
    nextPost: isPlainObject(source.nextPost)
      ? source.nextPost
      : null,
  };
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

function assertPublicPostsResultResponse(responseData) {
  const data = assertPublicPostsListResponse(responseData);
  const total = Number(responseData.total ?? data.length);

  return {
    data,
    count: Number(responseData.count ?? data.length),
    total,
    pagination: normalizePagination(responseData.pagination, total),
    facets: normalizeFacets(responseData.facets),
  };
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

function assertPublicPostResultResponse(responseData) {
  return {
    post: assertPublicPostDetailResponse(responseData),
    context: normalizePostContext(responseData.context),
  };
}

function buildPostsQuery(filters = {}) {
  const query = new URLSearchParams();

  const search = normalizeOptionalStringFilter(filters.search, "search");
  const type = normalizePostTypeFilter(filters.type);
  const category = normalizeOptionalStringFilter(filters.category, "category");
  const tag = normalizeOptionalStringFilter(filters.tag, "tag");
  const featured = normalizeBooleanFilter(filters.featured, "featured");
  const page = normalizePositiveIntegerFilter(filters.page, "page", {
    maxValue: 100000,
  });
  const limit = normalizePositiveIntegerFilter(filters.limit, "limit", {
    maxValue: MAX_PAGE_LIMIT,
  });
  const sort = normalizeSortFilter(filters.sort);
  const facets = normalizeBooleanFilter(filters.facets, "facets");

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

  if (page !== undefined) {
    query.set("page", String(page));
  }

  if (limit !== undefined) {
    query.set("limit", String(limit));
  }

  if (sort !== undefined) {
    query.set("sort", sort);
  }

  if (facets !== undefined) {
    query.set("facets", String(facets));
  }

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}

async function requestPublicPosts(filters = {}, { signal } = {}) {
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

  return responseData;
}

async function fetchPublicPostsResult(filters = {}, options = {}) {
  const responseData = await requestPublicPosts(filters, options);

  return assertPublicPostsResultResponse(responseData);
}

async function fetchPublicPosts(filters = {}, options = {}) {
  const result = await fetchPublicPostsResult(filters, options);

  return result.data;
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

async function requestPublicPostBySlug(
  slugValue,
  {
    signal,
    includeContext = false,
  } = {},
) {
  const slug = normalizePostSlug(slugValue);
  const contextQuery = includeContext ? "?context=true" : "";

  const response = await fetch(
    createApiUrl(
      `${POSTS_PATH}/${encodeURIComponent(slug)}${contextQuery}`,
    ),
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

  return responseData;
}

async function fetchPublicPostResultBySlug(slugValue, options = {}) {
  const responseData = await requestPublicPostBySlug(slugValue, {
    ...options,
    includeContext:
      options.includeContext === undefined
        ? true
        : Boolean(options.includeContext),
  });

  return assertPublicPostResultResponse(responseData);
}

async function fetchPublicPostBySlug(slugValue, options = {}) {
  const responseData = await requestPublicPostBySlug(slugValue, {
    ...options,
    includeContext: false,
  });

  return assertPublicPostDetailResponse(responseData);
}

export {
  MAX_PAGE_LIMIT,
  POSTS_PATH,
  POST_SORT_OPTIONS,
  POST_TYPES,
  assertPublicPostDetailResponse,
  assertPublicPostResultResponse,
  assertPublicPostsListResponse,
  assertPublicPostsResultResponse,
  buildPostsQuery,
  fetchPublicPostBySlug,
  fetchPublicPostResultBySlug,
  fetchPublicPosts,
  fetchPublicPostsResult,
  normalizeBooleanFilter,
  normalizeFacets,
  normalizeOptionalStringFilter,
  normalizePagination,
  normalizePositiveIntegerFilter,
  normalizePostContext,
  normalizePostSlug,
  normalizePostTypeFilter,
  normalizeSortFilter,
};
