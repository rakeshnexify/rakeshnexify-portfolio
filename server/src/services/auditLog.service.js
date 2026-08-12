import mongoose from "mongoose";

import {
  AUDIT_ACTIONS,
  AUDIT_ACTOR_ROLES,
  AUDIT_ACTOR_TYPES,
  AUDIT_CATEGORIES,
  AUDIT_FORBIDDEN_FIELD_NAME_PATTERN,
  AUDIT_LIMITS,
  AUDIT_OUTCOMES,
  AUDIT_RESOURCE_TYPES,
  AUDIT_SAFE_CHANGE_FIELDS,
  AUDIT_SAFE_METADATA_KEYS,
} from "../constants/auditLog.constants.js";
import AuditLog from "../models/AuditLog.js";

const HTTP_METHOD_PATTERN =
  /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/;

function isPlainObject(value) {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const prototype =
    Object.getPrototypeOf(value);

  return (
    prototype === Object.prototype ||
    prototype === null
  );
}

function normalizeString(
  value,
  maxLength,
) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .slice(0, maxLength);
}

function normalizeObjectId(value) {
  if (!value) {
    return null;
  }

  if (
    value instanceof
      mongoose.Types.ObjectId
  ) {
    return value;
  }

  const stringValue =
    String(value).trim();

  if (
    !mongoose.isValidObjectId(
      stringValue,
    )
  ) {
    return null;
  }

  return new mongoose.Types.ObjectId(
    stringValue,
  );
}

function normalizeSafePrimitive(
  value,
  {
    depth = 0,
  } = {},
) {
  if (value === null) {
    return null;
  }

  if (
    typeof value === "string"
  ) {
    return value.slice(
      0,
      AUDIT_LIMITS.stringValue,
    );
  }

  if (
    typeof value === "number"
  ) {
    return Number.isFinite(value)
      ? value
      : null;
  }

  if (
    typeof value === "boolean"
  ) {
    return value;
  }

  if (value instanceof Date) {
    return Number.isNaN(
      value.getTime(),
    )
      ? null
      : value.toISOString();
  }

  if (
    value instanceof
      mongoose.Types.ObjectId
  ) {
    return value.toString();
  }

  if (
    depth >=
    AUDIT_LIMITS.nestingDepth
  ) {
    return null;
  }

  if (Array.isArray(value)) {
    return value
      .slice(
        0,
        AUDIT_LIMITS.arrayItems,
      )
      .map((item) =>
        normalizeSafePrimitive(
          item,
          {
            depth: depth + 1,
          },
        ),
      );
  }

  if (isPlainObject(value)) {
    const result = {};

    Object.entries(value)
      .slice(
        0,
        AUDIT_LIMITS.metadataEntries,
      )
      .forEach(
        ([key, nestedValue]) => {
          if (
            key === "__proto__" ||
            key === "prototype" ||
            key === "constructor" ||
            AUDIT_FORBIDDEN_FIELD_NAME_PATTERN.test(
              key,
            )
          ) {
            return;
          }

          result[
            key.slice(
              0,
              AUDIT_LIMITS.changedFieldName,
            )
          ] =
            normalizeSafePrimitive(
              nestedValue,
              {
                depth:
                  depth + 1,
              },
            );
        },
      );

    return result;
  }

  return null;
}

function normalizeAuditValue(value) {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value instanceof Date ||
    value instanceof mongoose.Types.ObjectId
  ) {
    return normalizeSafePrimitive(value);
  }

  return null;
}

function sanitizeChangedFields(
  changedFields,
) {
  if (!Array.isArray(changedFields)) {
    return [];
  }

  const result = [];
  const seen = new Set();

  changedFields
    .slice(
      0,
      AUDIT_LIMITS.changedFields,
    )
    .forEach((fieldName) => {
      const normalized =
        normalizeString(
          fieldName,
          AUDIT_LIMITS.changedFieldName,
        );

      if (
        !normalized ||
        !AUDIT_SAFE_CHANGE_FIELDS.has(
          normalized,
        ) ||
        seen.has(normalized) ||
        AUDIT_FORBIDDEN_FIELD_NAME_PATTERN.test(
          normalized,
        )
      ) {
        return;
      }

      seen.add(normalized);
      result.push(normalized);
    });

  return result;
}

function sanitizeChanges(changes) {
  if (!isPlainObject(changes)) {
    return {};
  }

  const result = {};

  Object.entries(changes)
    .slice(
      0,
      AUDIT_LIMITS.changeEntries,
    )
    .forEach(
      ([fieldName, transition]) => {
        if (
          !AUDIT_SAFE_CHANGE_FIELDS.has(
            fieldName,
          ) ||
          !isPlainObject(transition)
        ) {
          return;
        }

        const normalizedTransition =
          {};

        if (
          Object.hasOwn(
            transition,
            "from",
          )
        ) {
          normalizedTransition.from =
            normalizeAuditValue(
              transition.from,
            );
        }

        if (
          Object.hasOwn(
            transition,
            "to",
          )
        ) {
          normalizedTransition.to =
            normalizeAuditValue(
              transition.to,
            );
        }

        if (
          Object.keys(
            normalizedTransition,
          ).length > 0
        ) {
          result[fieldName] =
            normalizedTransition;
        }
      },
    );

  return result;
}

function sanitizeMetadata(metadata) {
  if (!isPlainObject(metadata)) {
    return {};
  }

  const result = {};

  Object.entries(metadata)
    .slice(
      0,
      AUDIT_LIMITS.metadataEntries,
    )
    .forEach(([key, value]) => {
      if (
        !AUDIT_SAFE_METADATA_KEYS.has(
          key,
        )
      ) {
        return;
      }

      const normalizedValue =
        normalizeAuditValue(value);

      if (normalizedValue !== null) {
        result[key] =
          normalizedValue;
      }
    });

  return result;
}

function buildAuditActor(
  actor,
  {
    actorType,
  } = {},
) {
  const normalizedActorType =
    AUDIT_ACTOR_TYPES.includes(
      actorType,
    )
      ? actorType
      : actor
        ? "admin"
        : "system";

  if (
    normalizedActorType !==
      "admin" ||
    !actor
  ) {
    return {
      actorType:
        normalizedActorType,
      actorAdminId: null,
      actorNameSnapshot: "",
      actorEmailSnapshot: "",
      actorRoleSnapshot: "",
    };
  }

  const actorAdminId =
    normalizeObjectId(
      actor._id || actor.id,
    );

  const actorRoleSnapshot =
    AUDIT_ACTOR_ROLES.includes(
      actor.role,
    )
      ? actor.role
      : "";

  if (
    !actorAdminId ||
    !actorRoleSnapshot
  ) {
    throw new Error(
      "Authenticated Audit actor is missing a valid Admin identity.",
    );
  }

  return {
    actorType: "admin",
    actorAdminId,
    actorNameSnapshot:
      normalizeString(
        actor.name,
        AUDIT_LIMITS.actorName,
      ),
    actorEmailSnapshot:
      normalizeString(
        actor.email,
        AUDIT_LIMITS.actorEmail,
      ).toLowerCase(),
    actorRoleSnapshot,
  };
}

function buildAuditRequestContext(
  request,
) {
  if (!request) {
    return {
      httpMethod: "",
      routePath: "",
      ip: "",
      userAgent: "",
    };
  }

  const receivedMethod =
    normalizeString(
      request.method,
      12,
    ).toUpperCase();

  const routePath =
    normalizeString(
      request.route?.path
        ? `${request.baseUrl || ""}${request.route.path}`
        : request.path ||
            request.baseUrl ||
            "",
      AUDIT_LIMITS.routePath,
    ).split("?")[0];

  const userAgentHeader =
    request.get?.("user-agent") ||
    request.headers?.[
      "user-agent"
    ] ||
    "";

  return {
    httpMethod:
      HTTP_METHOD_PATTERN.test(
        receivedMethod,
      )
        ? receivedMethod
        : "",
    routePath,
    ip: normalizeString(
      request.ip,
      AUDIT_LIMITS.ip,
    ),
    userAgent:
      normalizeString(
        userAgentHeader,
        AUDIT_LIMITS.userAgent,
      ),
  };
}

function buildAuditResource(
  resource,
) {
  if (
    !isPlainObject(resource) ||
    !AUDIT_RESOURCE_TYPES.includes(
      resource.type,
    )
  ) {
    throw new Error(
      "Audit resource type is invalid.",
    );
  }

  const hasResourceId =
    Object.hasOwn(
      resource,
      "id",
    );

  const resourceId =
    hasResourceId
      ? normalizeObjectId(
          resource.id,
        )
      : null;

  if (
    hasResourceId &&
    resource.id !== null &&
    !resourceId
  ) {
    throw new Error(
      "Audit resource identifier is invalid.",
    );
  }

  return {
    resourceType:
      resource.type,
    resourceId,
    resourceLabel:
      normalizeString(
        resource.label,
        AUDIT_LIMITS.resourceLabel,
      ),
    resourceSlug:
      normalizeString(
        resource.slug,
        AUDIT_LIMITS.resourceSlug,
      ),
  };
}

function validateAuditClassification({
  category,
  action,
  outcome,
}) {
  if (
    !AUDIT_CATEGORIES.includes(
      category,
    )
  ) {
    throw new Error(
      "Audit category is invalid.",
    );
  }

  if (
    !AUDIT_ACTIONS.includes(action)
  ) {
    throw new Error(
      "Audit action is invalid.",
    );
  }

  if (
    !AUDIT_OUTCOMES.includes(
      outcome,
    )
  ) {
    throw new Error(
      "Audit outcome is invalid.",
    );
  }
}

async function createAuditLog({
  actor = null,
  actorType,
  category,
  action,
  outcome = "success",
  resource,
  changedFields = [],
  changes = {},
  metadata = {},
  request = null,
  session = null,
} = {}) {
  validateAuditClassification({
    category,
    action,
    outcome,
  });

  const payload = {
    ...buildAuditActor(
      actor,
      {
        actorType,
      },
    ),
    category,
    action,
    outcome,
    ...buildAuditResource(
      resource,
    ),
    changedFields:
      sanitizeChangedFields(
        changedFields,
      ),
    changes:
      sanitizeChanges(changes),
    metadata:
      sanitizeMetadata(
        metadata,
      ),
    ...buildAuditRequestContext(
      request,
    ),
  };

  const auditLog =
    new AuditLog(payload);

  await auditLog.save(
    session
      ? {
          session,
        }
      : undefined,
  );

  return auditLog;
}

async function createAuditLogBestEffort(
  options,
  {
    logger = console,
  } = {},
) {
  try {
    return await createAuditLog(
      options,
    );
  } catch (error) {
    logger?.error?.(
      "Audit Log write failed:",
      error.message,
    );

    return null;
  }
}

export {
  buildAuditActor,
  buildAuditRequestContext,
  buildAuditResource,
  createAuditLog,
  createAuditLogBestEffort,
  sanitizeChangedFields,
  sanitizeChanges,
  sanitizeMetadata,
};
