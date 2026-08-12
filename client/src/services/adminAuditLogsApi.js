import { createApiUrl } from "../config/apiConfig";

const ADMIN_AUDIT_LOGS_PATH = "/api/admin/audit-logs";
const REQUEST_TIMEOUT_MS = 15000;

const AUDIT_ACTOR_ROLES = Object.freeze([
  "super-admin",
  "admin",
  "editor",
]);

const AUDIT_CATEGORIES = Object.freeze([
  "authentication",
  "security",
  "content",
  "workflow",
  "configuration",
  "media",
  "subscriber",
]);

const AUDIT_ACTIONS = Object.freeze([
  "create",
  "update",
  "delete",
  "status-change",
  "assignment-change",
  "publish",
  "unpublish",
  "convert",
  "note-added",
  "upload",
  "unsubscribe",
  "login-success",
  "login-failed",
  "account-lock",
]);

const AUDIT_RESOURCE_TYPES = Object.freeze([
  "admin-auth",
  "admin-user",
  "site-settings",
  "service",
  "service-package",
  "package-design",
  "service-order",
  "appointment",
  "contact-message",
  "lead",
  "subscriber",
  "media",
  "project",
  "statistic",
  "company",
  "team-member",
  "skill",
  "education",
  "experience",
  "certification-achievement",
  "testimonial",
  "faq",
  "post",
]);

const AUDIT_OUTCOMES = Object.freeze([
  "success",
  "failure",
  "denied",
]);

function normalizeText(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeNullableText(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const normalizedValue = normalizeText(
    typeof value === "string"
      ? value
      : String(value),
  );

  return normalizedValue || null;
}

function normalizePlainObject(value) {
  return value &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? value
    : {};
}

function normalizeStringArray(value, maximumItems = 50) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .slice(0, maximumItems)
    .map((item) =>
      normalizeText(
        typeof item === "string"
          ? item
          : String(item ?? ""),
      ),
    )
    .filter(Boolean);
}

function normalizePositiveInteger(
  value,
  fallback,
  maximum = Number.MAX_SAFE_INTEGER,
) {
  const parsedValue = Number(value);

  if (
    Number.isInteger(parsedValue) &&
    parsedValue > 0 &&
    parsedValue <= maximum
  ) {
    return parsedValue;
  }

  return fallback;
}

function normalizeNonNegativeInteger(value, fallback = 0) {
  const parsedValue = Number(value);

  if (
    Number.isInteger(parsedValue) &&
    parsedValue >= 0
  ) {
    return parsedValue;
  }

  return fallback;
}

function createAuthorizationHeaders(accessToken) {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
}

async function parseJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function createAdminAuditLogsApiError(
  response,
  responseData,
  fallbackMessage,
) {
  const message =
    normalizeText(responseData?.message) ||
    fallbackMessage;

  const error = new Error(message);

  error.name = "AdminAuditLogsApiError";
  error.status = response.status;
  error.fieldErrors =
    responseData?.fieldErrors &&
    typeof responseData.fieldErrors === "object" &&
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

  if (normalizedValue) {
    searchParams.set(
      key,
      normalizedValue,
    );
  }
}

function buildAuditLogsQuery(filters = {}) {
  const searchParams =
    new URLSearchParams();

  for (const fieldName of [
    "page",
    "limit",
    "search",
    "actorAdminId",
    "actorRole",
    "category",
    "action",
    "resourceType",
    "resourceId",
    "outcome",
    "dateFrom",
    "dateTo",
  ]) {
    appendQueryValue(
      searchParams,
      fieldName,
      filters[fieldName],
    );
  }

  const queryString =
    searchParams.toString();

  return queryString
    ? `?${queryString}`
    : "";
}

function createAbortContext(callerSignal) {
  const controller =
    new AbortController();

  let timedOut = false;

  const timeoutId =
    window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

  function handleCallerAbort() {
    controller.abort();
  }

  if (callerSignal) {
    if (callerSignal.aborted) {
      controller.abort();
    } else {
      callerSignal.addEventListener(
        "abort",
        handleCallerAbort,
        {
          once: true,
        },
      );
    }
  }

  return {
    signal: controller.signal,

    wasTimedOut() {
      return timedOut;
    },

    cleanup() {
      window.clearTimeout(timeoutId);

      callerSignal?.removeEventListener(
        "abort",
        handleCallerAbort,
      );
    },
  };
}

function normalizeAuditLog(value) {
  const source =
    normalizePlainObject(value);

  const request =
    normalizePlainObject(
      source.request,
    );

  const auditLogId =
    normalizeNullableText(
      source._id ?? source.id,
    );

  const normalizedRequest = {
    method:
      normalizeText(
        request.method ??
          source.httpMethod,
      ),
    path:
      normalizeText(
        request.path ??
          source.routePath,
      ),
    ip:
      normalizeText(
        request.ip ??
          source.ip,
      ),
    userAgent:
      normalizeText(
        request.userAgent ??
          source.userAgent,
      ),
  };

  return {
    _id: auditLogId,
    id: auditLogId,

    actorType:
      normalizeText(source.actorType),
    actorAdminId:
      normalizeNullableText(
        source.actorAdminId,
      ),
    actorNameSnapshot:
      normalizeText(
        source.actorNameSnapshot,
      ),
    actorEmailSnapshot:
      normalizeText(
        source.actorEmailSnapshot,
      ),
    actorRoleSnapshot:
      normalizeText(
        source.actorRoleSnapshot,
      ),

    category:
      normalizeText(source.category),
    action:
      normalizeText(source.action),
    outcome:
      normalizeText(source.outcome),

    resourceType:
      normalizeText(
        source.resourceType,
      ),
    resourceId:
      normalizeNullableText(
        source.resourceId,
      ),
    resourceLabel:
      normalizeText(
        source.resourceLabel,
      ),
    resourceSlug:
      normalizeText(
        source.resourceSlug,
      ),

    changedFields:
      normalizeStringArray(
        source.changedFields,
      ),
    changes:
      normalizePlainObject(
        source.changes,
      ),
    metadata:
      normalizePlainObject(
        source.metadata,
      ),

    request:
      normalizedRequest,

    httpMethod:
      normalizedRequest.method,
    routePath:
      normalizedRequest.path,
    ip:
      normalizedRequest.ip,
    userAgent:
      normalizedRequest.userAgent,

    createdAt:
      normalizeText(source.createdAt),
  };
}

function getListSource(responseData) {
  if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }

  const nestedData =
    normalizePlainObject(
      responseData?.data,
    );

  if (
    Array.isArray(
      nestedData.auditLogs,
    )
  ) {
    return nestedData.auditLogs;
  }

  if (
    Array.isArray(
      nestedData.logs,
    )
  ) {
    return nestedData.logs;
  }

  if (
    Array.isArray(
      responseData?.auditLogs,
    )
  ) {
    return responseData.auditLogs;
  }

  if (
    Array.isArray(
      responseData?.logs,
    )
  ) {
    return responseData.logs;
  }

  return [];
}

function normalizeAuditLogsListResponse(
  responseData,
) {
  const auditLogs =
    getListSource(responseData)
      .map(normalizeAuditLog)
      .filter(
        (auditLog) =>
          Boolean(auditLog._id),
      );

  const nestedData =
    normalizePlainObject(
      responseData?.data,
    );

  const pagination =
    normalizePlainObject(
      responseData?.pagination ??
        nestedData.pagination,
    );

  const count =
    normalizeNonNegativeInteger(
      responseData?.count ??
        nestedData.count,
      auditLogs.length,
    );

  const total =
    normalizeNonNegativeInteger(
      responseData?.total ??
        nestedData.total ??
        pagination.total,
      count,
    );

  const page =
    normalizePositiveInteger(
      responseData?.page ??
        nestedData.page ??
        pagination.page,
      1,
    );

  const limit =
    normalizePositiveInteger(
      responseData?.limit ??
        nestedData.limit ??
        pagination.limit,
      Math.max(auditLogs.length, 1),
      100,
    );

  const pages =
    normalizePositiveInteger(
      responseData?.pages ??
        responseData?.totalPages ??
        nestedData.pages ??
        nestedData.totalPages ??
        pagination.pages ??
        pagination.totalPages,
      Math.max(
        1,
        Math.ceil(total / limit),
      ),
    );

  return {
    auditLogs,
    count,
    total,
    page,
    limit,
    pages,
  };
}

function normalizeAuditLogDetailResponse(
  responseData,
) {
  const data =
    responseData?.data &&
    typeof responseData.data === "object" &&
    !Array.isArray(responseData.data)
      ? responseData.data
      : null;

  if (!data) {
    throw new Error(
      "Audit Log API returned an unsupported detail response.",
    );
  }

  const auditLog =
    normalizeAuditLog(data);

  if (!auditLog._id) {
    throw new Error(
      "Audit Log API returned a detail record without an ID.",
    );
  }

  return auditLog;
}

async function fetchAdminAuditLogs(
  accessToken,
  filters = {},
  {
    signal,
  } = {},
) {
  const abortContext =
    createAbortContext(signal);

  try {
    const response = await fetch(
      createApiUrl(
        `${ADMIN_AUDIT_LOGS_PATH}${buildAuditLogsQuery(
          filters,
        )}`,
      ),
      {
        method: "GET",
        headers:
          createAuthorizationHeaders(
            accessToken,
          ),
        signal:
          abortContext.signal,
      },
    );

    const responseData =
      await parseJsonResponse(response);

    if (!response.ok) {
      throw createAdminAuditLogsApiError(
        response,
        responseData,
        "Unable to load Admin Audit Logs.",
      );
    }

    if (responseData?.success !== true) {
      throw new Error(
        normalizeText(
          responseData?.message,
        ) ||
          "Audit Log request was unsuccessful.",
      );
    }

    return normalizeAuditLogsListResponse(
      responseData,
    );
  } catch (error) {
    if (
      error?.name === "AbortError" &&
      abortContext.wasTimedOut()
    ) {
      const timeoutError = new Error(
        "Audit Log request timed out. Please try again.",
      );

      timeoutError.name =
        "AdminAuditLogsTimeoutError";

      throw timeoutError;
    }

    throw error;
  } finally {
    abortContext.cleanup();
  }
}

async function fetchAdminAuditLogById(
  accessToken,
  auditLogId,
  {
    signal,
  } = {},
) {
  const cleanAuditLogId =
    normalizeText(auditLogId);

  if (!cleanAuditLogId) {
    const error = new Error(
      "Audit Log ID is required.",
    );

    error.name =
      "AdminAuditLogsApiError";
    error.status = 400;

    throw error;
  }

  const abortContext =
    createAbortContext(signal);

  try {
    const response = await fetch(
      createApiUrl(
        `${ADMIN_AUDIT_LOGS_PATH}/${encodeURIComponent(
          cleanAuditLogId,
        )}`,
      ),
      {
        method: "GET",
        headers:
          createAuthorizationHeaders(
            accessToken,
          ),
        signal:
          abortContext.signal,
      },
    );

    const responseData =
      await parseJsonResponse(response);

    if (!response.ok) {
      throw createAdminAuditLogsApiError(
        response,
        responseData,
        "Unable to load the Audit Log record.",
      );
    }

    if (responseData?.success !== true) {
      throw new Error(
        normalizeText(
          responseData?.message,
        ) ||
          "Audit Log detail request was unsuccessful.",
      );
    }

    return normalizeAuditLogDetailResponse(
      responseData,
    );
  } catch (error) {
    if (
      error?.name === "AbortError" &&
      abortContext.wasTimedOut()
    ) {
      const timeoutError = new Error(
        "Audit Log request timed out. Please try again.",
      );

      timeoutError.name =
        "AdminAuditLogsTimeoutError";

      throw timeoutError;
    }

    throw error;
  } finally {
    abortContext.cleanup();
  }
}

export {
  AUDIT_ACTIONS,
  AUDIT_ACTOR_ROLES,
  AUDIT_CATEGORIES,
  AUDIT_OUTCOMES,
  AUDIT_RESOURCE_TYPES,
  fetchAdminAuditLogById,
  fetchAdminAuditLogs,
};
