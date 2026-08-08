import { createApiUrl } from "../config/apiConfig";

const ADMIN_MEDIA_PATH = "/api/admin/media";

const MEDIA_TYPES = Object.freeze([
  "image",
  "svg",
  "document",
  "audio",
  "video",
]);

const MEDIA_SORT_OPTIONS = Object.freeze([
  "newest",
  "oldest",
  "title-asc",
  "title-desc",
  "size-desc",
  "size-asc",
]);

const DEFAULT_MEDIA_PAGE = 1;
const DEFAULT_MEDIA_LIMIT = 24;
const MAX_MEDIA_LIMIT = 100;

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function createFilterError(message, fieldName, fieldMessage = message) {
  const error = new TypeError(message);

  error.fieldErrors = {
    [fieldName]: fieldMessage,
  };

  return error;
}

function normalizeOptionalStringFilter(
  value,
  fieldName,
  { maxLength = 200 } = {},
) {
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

  if (!cleanValue) {
    return undefined;
  }

  if (cleanValue.length > maxLength) {
    throw createFilterError(
      `${fieldName} filter is too long.`,
      fieldName,
      `${fieldName} cannot exceed ${maxLength} characters.`,
    );
  }

  return cleanValue;
}

function normalizeMediaTypeFilter(value) {
  const cleanValue = normalizeOptionalStringFilter(value, "mediaType", {
    maxLength: 30,
  });

  if (cleanValue === undefined) {
    return undefined;
  }

  const normalizedValue = cleanValue.toLowerCase();

  if (!MEDIA_TYPES.includes(normalizedValue)) {
    throw createFilterError(
      "Media type filter is invalid.",
      "mediaType",
      "Select image, SVG, document, audio or video.",
    );
  }

  return normalizedValue;
}

function normalizeMediaSortFilter(value) {
  const cleanValue = normalizeOptionalStringFilter(value, "sort", {
    maxLength: 30,
  });

  if (cleanValue === undefined) {
    return undefined;
  }

  if (!MEDIA_SORT_OPTIONS.includes(cleanValue)) {
    throw createFilterError(
      "Media sort option is invalid.",
      "sort",
      "Select a supported Media sort option.",
    );
  }

  return cleanValue;
}

function normalizePositiveIntegerFilter(
  value,
  fieldName,
  { defaultValue, minimum = 1, maximum },
) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  const numericValue = typeof value === "number" ? value : Number(value);

  if (
    !Number.isSafeInteger(numericValue) ||
    numericValue < minimum ||
    (maximum !== undefined && numericValue > maximum)
  ) {
    throw createFilterError(
      `${fieldName} filter is outside the allowed range.`,
      fieldName,
      `${fieldName} must be between ${minimum} and ${maximum}.`,
    );
  }

  return numericValue;
}

function createAdminMediaApiError(responseData, status, fallbackMessage) {
  const error = new Error(
    responseData?.message ||
      fallbackMessage ||
      `Admin Media request failed with status ${status}.`,
  );

  error.status = status;

  error.fieldErrors = isPlainObject(responseData?.fieldErrors)
    ? responseData.fieldErrors
    : {};

  return error;
}

async function readAdminMediaResponse(response) {
  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    throw createAdminMediaApiError(responseData, response.status);
  }

  if (!isPlainObject(responseData) || responseData.success !== true) {
    throw new Error("Admin Media API returned an unsupported response.");
  }

  return responseData;
}

function assertAdminMediaListResponse(responseData) {
  if (
    !Array.isArray(responseData.data) ||
    !Number.isInteger(responseData.count) ||
    responseData.count < 0 ||
    !Number.isInteger(responseData.total) ||
    responseData.total < 0 ||
    !Number.isInteger(responseData.page) ||
    responseData.page < 1 ||
    !Number.isInteger(responseData.limit) ||
    responseData.limit < 1 ||
    !Number.isInteger(responseData.totalPages) ||
    responseData.totalPages < 0
  ) {
    throw new Error("Admin Media API returned an unsupported list response.");
  }

  return responseData;
}

function assertAdminMediaFoldersResponse(responseData) {
  if (
    !Array.isArray(responseData.data) ||
    !Number.isInteger(responseData.count) ||
    responseData.count < 0
  ) {
    throw new Error(
      "Admin Media API returned an unsupported folders response.",
    );
  }

  const hasInvalidFolder = responseData.data.some(
    (folderRecord) =>
      !isPlainObject(folderRecord) ||
      typeof folderRecord.folder !== "string" ||
      !folderRecord.folder.trim() ||
      !Number.isInteger(folderRecord.count) ||
      folderRecord.count < 1,
  );

  if (hasInvalidFolder) {
    throw new Error("Admin Media API returned invalid folder data.");
  }

  return responseData;
}

function assertAdminMediaRecordResponse(responseData, operationLabel) {
  if (!isPlainObject(responseData.data)) {
    throw new Error(
      `Admin Media API returned an unsupported ${operationLabel} response.`,
    );
  }

  return responseData;
}

function assertAdminMediaMutationResponse(responseData, operationLabel) {
  if (
    typeof responseData.message !== "string" ||
    !responseData.message.trim() ||
    !isPlainObject(responseData.data)
  ) {
    throw new Error(
      `Admin Media API returned an unsupported ${operationLabel} response.`,
    );
  }

  return responseData;
}

function assertAdminMediaDeleteResponse(responseData) {
  const deletionResult = responseData.data;

  if (
    typeof responseData.message !== "string" ||
    !responseData.message.trim() ||
    !isPlainObject(deletionResult) ||
    typeof deletionResult.id !== "string" ||
    !deletionResult.id.trim() ||
    typeof deletionResult.title !== "string" ||
    typeof deletionResult.originalName !== "string" ||
    !MEDIA_TYPES.includes(deletionResult.mediaType)
  ) {
    throw new Error("Admin Media API returned an unsupported delete response.");
  }

  return responseData;
}

function createAuthorizationHeaders(accessToken) {
  if (typeof accessToken !== "string" || !accessToken.trim()) {
    throw new Error("Admin access token is required.");
  }

  return {
    Accept: "application/json",
    Authorization: `Bearer ${accessToken.trim()}`,
  };
}

function buildAdminMediaQuery(filters = {}) {
  if (!isPlainObject(filters)) {
    throw new TypeError("Media filters must be an object.");
  }

  const query = new URLSearchParams();

  const search = normalizeOptionalStringFilter(filters.search, "search", {
    maxLength: 200,
  });

  const mediaType = normalizeMediaTypeFilter(filters.mediaType);

  const folder = normalizeOptionalStringFilter(filters.folder, "folder", {
    maxLength: 200,
  });

  const tag = normalizeOptionalStringFilter(filters.tag, "tag", {
    maxLength: 60,
  });

  const sort = normalizeMediaSortFilter(filters.sort);

  const page = normalizePositiveIntegerFilter(filters.page, "page", {
    defaultValue: DEFAULT_MEDIA_PAGE,

    minimum: 1,
    maximum: 1_000_000,
  });

  const limit = normalizePositiveIntegerFilter(filters.limit, "limit", {
    defaultValue: DEFAULT_MEDIA_LIMIT,

    minimum: 1,
    maximum: MAX_MEDIA_LIMIT,
  });

  if (search !== undefined) {
    query.set("search", search);
  }

  if (mediaType !== undefined) {
    query.set("mediaType", mediaType);
  }

  if (folder !== undefined) {
    query.set("folder", folder);
  }

  if (tag !== undefined) {
    query.set("tag", tag);
  }

  if (sort !== undefined) {
    query.set("sort", sort);
  }

  query.set("page", String(page));

  query.set("limit", String(limit));

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}

function normalizeMediaId(mediaId) {
  if (typeof mediaId !== "string") {
    throw new TypeError("Media ID must be text.");
  }

  const cleanMediaId = mediaId.trim();

  if (!cleanMediaId) {
    throw new TypeError("Media ID is required.");
  }

  return cleanMediaId;
}

function assertMediaFile(file) {
  if (typeof File === "undefined" || !(file instanceof File)) {
    throw createFilterError(
      "A Media file is required.",
      "file",
      "Select a Media file to upload.",
    );
  }

  if (file.size <= 0) {
    throw createFilterError(
      "Media file cannot be empty.",
      "file",
      "Select a non-empty Media file.",
    );
  }

  return file;
}

function normalizeUploadMetadata(metadata = {}) {
  if (!isPlainObject(metadata)) {
    throw new TypeError("Media upload metadata must be an object.");
  }

  const allowedFields = [
    "title",
    "altText",
    "isDecorative",
    "caption",
    "description",
    "folder",
    "tags",
  ];

  const unsupportedFields = Object.keys(metadata).filter(
    (key) => !allowedFields.includes(key),
  );

  if (unsupportedFields.length > 0) {
    throw new TypeError(
      `Media upload metadata contains unsupported field${
        unsupportedFields.length === 1 ? "" : "s"
      }: ${unsupportedFields.join(", ")}.`,
    );
  }

  return metadata;
}

function appendUploadMetadata(formData, metadata) {
  const normalizedMetadata = normalizeUploadMetadata(metadata);

  const textFields = ["title", "altText", "caption", "description", "folder"];

  textFields.forEach((fieldName) => {
    const value = normalizedMetadata[fieldName];

    if (value !== undefined && value !== null) {
      formData.append(fieldName, String(value));
    }
  });

  if (normalizedMetadata.isDecorative !== undefined) {
    formData.append(
      "isDecorative",
      String(Boolean(normalizedMetadata.isDecorative)),
    );
  }

  if (normalizedMetadata.tags !== undefined) {
    if (!Array.isArray(normalizedMetadata.tags)) {
      throw createFilterError(
        "Media tags must be an array.",
        "tags",
        "Media tags must be an array of text values.",
      );
    }

    formData.append("tags", JSON.stringify(normalizedMetadata.tags));
  }
}

function normalizeUploadProgress(loaded, total) {
  if (!Number.isFinite(total) || total <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round((loaded / total) * 100)));
}

function createXhrResponseError(xhr) {
  let responseData = null;

  try {
    responseData = xhr.responseText ? JSON.parse(xhr.responseText) : null;
  } catch {
    responseData = null;
  }

  return createAdminMediaApiError(
    responseData,
    xhr.status || 0,
    xhr.status
      ? `Admin Media upload failed with status ${xhr.status}.`
      : "Admin Media upload failed.",
  );
}

async function fetchAdminMediaFolders(accessToken, { signal } = {}) {
  const response = await fetch(createApiUrl(`${ADMIN_MEDIA_PATH}/folders`), {
    method: "GET",

    headers: createAuthorizationHeaders(accessToken),

    signal,
  });

  const responseData = assertAdminMediaFoldersResponse(
    await readAdminMediaResponse(response),
  );

  return {
    count: responseData.count,

    folders: responseData.data,
  };
}

async function fetchAdminMedia(accessToken, filters = {}, { signal } = {}) {
  const queryString = buildAdminMediaQuery(filters);

  const response = await fetch(
    createApiUrl(`${ADMIN_MEDIA_PATH}${queryString}`),
    {
      method: "GET",

      headers: createAuthorizationHeaders(accessToken),

      signal,
    },
  );

  const responseData = assertAdminMediaListResponse(
    await readAdminMediaResponse(response),
  );

  return {
    count: responseData.count,

    total: responseData.total,

    page: responseData.page,

    limit: responseData.limit,

    totalPages: responseData.totalPages,

    media: responseData.data,
  };
}

async function fetchAdminMediaById(accessToken, mediaId, { signal } = {}) {
  const cleanMediaId = normalizeMediaId(mediaId);

  const response = await fetch(
    createApiUrl(`${ADMIN_MEDIA_PATH}/${encodeURIComponent(cleanMediaId)}`),
    {
      method: "GET",

      headers: createAuthorizationHeaders(accessToken),

      signal,
    },
  );

  const responseData = assertAdminMediaRecordResponse(
    await readAdminMediaResponse(response),
    "detail",
  );

  return responseData.data;
}

function uploadAdminMedia(
  accessToken,
  file,
  metadata = {},
  { signal, onProgress } = {},
) {
  const cleanFile = assertMediaFile(file);

  const headers = createAuthorizationHeaders(accessToken);

  const formData = new FormData();

  formData.append("file", cleanFile, cleanFile.name);

  appendUploadMetadata(formData, metadata);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    let isSettled = false;

    function settle(callback, value) {
      if (isSettled) {
        return;
      }

      isSettled = true;

      if (signal) {
        signal.removeEventListener("abort", handleAbortSignal);
      }

      callback(value);
    }

    function handleAbortSignal() {
      xhr.abort();
    }

    xhr.open("POST", createApiUrl(ADMIN_MEDIA_PATH));

    xhr.setRequestHeader("Accept", headers.Accept);

    xhr.setRequestHeader("Authorization", headers.Authorization);

    xhr.upload.onprogress = (event) => {
      if (typeof onProgress !== "function") {
        return;
      }

      onProgress(normalizeUploadProgress(event.loaded, event.total));
    };

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        settle(reject, createXhrResponseError(xhr));

        return;
      }

      let responseData;

      try {
        responseData = JSON.parse(xhr.responseText);
      } catch {
        settle(
          reject,
          new Error("Admin Media API returned invalid JSON after upload."),
        );

        return;
      }

      try {
        if (!isPlainObject(responseData) || responseData.success !== true) {
          throw new Error(
            "Admin Media API returned an unsupported upload response.",
          );
        }

        assertAdminMediaMutationResponse(responseData, "upload");

        settle(resolve, {
          message: responseData.message,

          media: responseData.data,
        });
      } catch (error) {
        settle(reject, error);
      }
    };

    xhr.onerror = () => {
      settle(
        reject,
        new Error("Admin Media upload failed because of a network error."),
      );
    };

    xhr.ontimeout = () => {
      settle(reject, new Error("Admin Media upload timed out."));
    };

    xhr.onabort = () => {
      const abortError = new DOMException(
        "Media upload was aborted.",
        "AbortError",
      );

      settle(reject, abortError);
    };

    if (signal) {
      if (signal.aborted) {
        xhr.abort();
        return;
      }

      signal.addEventListener("abort", handleAbortSignal, {
        once: true,
      });
    }

    xhr.send(formData);
  });
}

async function updateAdminMedia(
  accessToken,
  mediaId,
  mediaData,
  { signal } = {},
) {
  const cleanMediaId = normalizeMediaId(mediaId);

  if (!isPlainObject(mediaData)) {
    throw new TypeError("Media update data must be an object.");
  }

  const response = await fetch(
    createApiUrl(`${ADMIN_MEDIA_PATH}/${encodeURIComponent(cleanMediaId)}`),
    {
      method: "PATCH",

      headers: {
        ...createAuthorizationHeaders(accessToken),

        "Content-Type": "application/json",
      },

      body: JSON.stringify(mediaData),

      signal,
    },
  );

  const responseData = assertAdminMediaMutationResponse(
    await readAdminMediaResponse(response),
    "update",
  );

  return {
    message: responseData.message,

    media: responseData.data,
  };
}

async function deleteAdminMedia(accessToken, mediaId, { signal } = {}) {
  const cleanMediaId = normalizeMediaId(mediaId);

  const response = await fetch(
    createApiUrl(`${ADMIN_MEDIA_PATH}/${encodeURIComponent(cleanMediaId)}`),
    {
      method: "DELETE",

      headers: createAuthorizationHeaders(accessToken),

      signal,
    },
  );

  const responseData = assertAdminMediaDeleteResponse(
    await readAdminMediaResponse(response),
  );

  return {
    message: responseData.message,

    deletedMedia: responseData.data,
  };
}

export {
  ADMIN_MEDIA_PATH,
  DEFAULT_MEDIA_LIMIT,
  DEFAULT_MEDIA_PAGE,
  MAX_MEDIA_LIMIT,
  MEDIA_SORT_OPTIONS,
  MEDIA_TYPES,
  assertAdminMediaDeleteResponse,
  assertAdminMediaListResponse,
  assertAdminMediaMutationResponse,
  assertAdminMediaRecordResponse,
  assertAdminMediaFoldersResponse,
  buildAdminMediaQuery,
  createAuthorizationHeaders,
  deleteAdminMedia,
  fetchAdminMedia,
  fetchAdminMediaById,
  fetchAdminMediaFolders,
  normalizeMediaId,
  normalizeMediaSortFilter,
  normalizeMediaTypeFilter,
  normalizeOptionalStringFilter,
  normalizePositiveIntegerFilter,
  normalizeUploadProgress,
  updateAdminMedia,
  uploadAdminMedia,
};
