import mongoose from "mongoose";

import {
  AUDIT_ACTIONS,
  AUDIT_ACTOR_ROLES,
  AUDIT_CATEGORIES,
  AUDIT_LIMITS,
  AUDIT_OUTCOMES,
  AUDIT_RESOURCE_TYPES,
} from "../constants/auditLog.constants.js";
import AuditLog from "../models/AuditLog.js";

const ALLOWED_QUERY_FIELDS = new Set([
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
]);

const ISO_UTC_TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function readSingleString(
  value,
) {
  return typeof value === "string"
    ? value.trim()
    : null;
}

function parsePositiveInteger(
  value,
  {
    fieldName,
    fallback,
    minimum = 1,
    maximum,
    fieldErrors,
  },
) {
  if (value === undefined) {
    return fallback;
  }

  const received =
    readSingleString(value);

  if (
    !received ||
    !/^\d+$/.test(received)
  ) {
    fieldErrors[fieldName] =
      `${fieldName} must be a whole number.`;
    return fallback;
  }

  const parsed = Number(received);

  if (
    !Number.isSafeInteger(parsed) ||
    parsed < minimum ||
    (maximum !== undefined &&
      parsed > maximum)
  ) {
    fieldErrors[fieldName] =
      `${fieldName} is outside the allowed range.`;
    return fallback;
  }

  return parsed;
}

function parseEnumValue(
  value,
  {
    fieldName,
    allowedValues,
    fieldErrors,
  },
) {
  if (value === undefined) {
    return "";
  }

  const received =
    readSingleString(value);

  if (
    !received ||
    !allowedValues.includes(
      received,
    )
  ) {
    fieldErrors[fieldName] =
      `${fieldName} has an unsupported value.`;
    return "";
  }

  return received;
}

function parseObjectIdValue(
  value,
  {
    fieldName,
    fieldErrors,
  },
) {
  if (value === undefined) {
    return "";
  }

  const received =
    readSingleString(value);

  if (
    !received ||
    !mongoose.isValidObjectId(
      received,
    )
  ) {
    fieldErrors[fieldName] =
      `${fieldName} must be a valid identifier.`;
    return "";
  }

  return received;
}

function parseDateValue(
  value,
  {
    fieldName,
    fieldErrors,
  },
) {
  if (value === undefined) {
    return null;
  }

  const received =
    readSingleString(value);

  if (
    !received ||
    !ISO_UTC_TIMESTAMP_PATTERN.test(
      received,
    )
  ) {
    fieldErrors[fieldName] =
      `${fieldName} must be a UTC ISO timestamp ending in Z.`;
    return null;
  }

  const date = new Date(received);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    fieldErrors[fieldName] =
      `${fieldName} must be a valid timestamp.`;
    return null;
  }

  return date;
}

function parseAuditLogQuery(
  query,
) {
  const fieldErrors = {};

  if (!isPlainObject(query)) {
    return {
      fieldErrors: {
        query:
          "Audit Log query parameters must be a valid query object.",
      },
      filters: null,
    };
  }

  Object.keys(query).forEach(
    (fieldName) => {
      if (
        !ALLOWED_QUERY_FIELDS.has(
          fieldName,
        )
      ) {
        fieldErrors[fieldName] =
          "This Audit Log query parameter is not supported.";
      }
    },
  );

  const page =
    parsePositiveInteger(
      query.page,
      {
        fieldName: "page",
        fallback: 1,
        fieldErrors,
      },
    );

  const limit =
    parsePositiveInteger(
      query.limit,
      {
        fieldName: "limit",
        fallback: 20,
        maximum:
          AUDIT_LIMITS.pageLimit,
        fieldErrors,
      },
    );

  let search = "";

  if (query.search !== undefined) {
    const received =
      readSingleString(
        query.search,
      );

    if (
      received === null ||
      !received ||
      received.length >
        AUDIT_LIMITS.search
    ) {
      fieldErrors.search =
        `search must be between 1 and ${AUDIT_LIMITS.search} characters.`;
    } else {
      search = received;
    }
  }

  const actorAdminId =
    parseObjectIdValue(
      query.actorAdminId,
      {
        fieldName:
          "actorAdminId",
        fieldErrors,
      },
    );

  const resourceId =
    parseObjectIdValue(
      query.resourceId,
      {
        fieldName:
          "resourceId",
        fieldErrors,
      },
    );

  const actorRole =
    parseEnumValue(
      query.actorRole,
      {
        fieldName:
          "actorRole",
        allowedValues:
          AUDIT_ACTOR_ROLES,
        fieldErrors,
      },
    );

  const category =
    parseEnumValue(
      query.category,
      {
        fieldName:
          "category",
        allowedValues:
          AUDIT_CATEGORIES,
        fieldErrors,
      },
    );

  const action =
    parseEnumValue(
      query.action,
      {
        fieldName:
          "action",
        allowedValues:
          AUDIT_ACTIONS,
        fieldErrors,
      },
    );

  const resourceType =
    parseEnumValue(
      query.resourceType,
      {
        fieldName:
          "resourceType",
        allowedValues:
          AUDIT_RESOURCE_TYPES,
        fieldErrors,
      },
    );

  const outcome =
    parseEnumValue(
      query.outcome,
      {
        fieldName:
          "outcome",
        allowedValues:
          AUDIT_OUTCOMES,
        fieldErrors,
      },
    );

  const dateFrom =
    parseDateValue(
      query.dateFrom,
      {
        fieldName:
          "dateFrom",
        fieldErrors,
      },
    );

  const dateTo =
    parseDateValue(
      query.dateTo,
      {
        fieldName:
          "dateTo",
        fieldErrors,
      },
    );

  if (
    dateFrom &&
    dateTo &&
    dateFrom.getTime() >
      dateTo.getTime()
  ) {
    fieldErrors.dateFrom =
      "dateFrom cannot be later than dateTo.";
    fieldErrors.dateTo =
      "dateTo cannot be earlier than dateFrom.";
  }

  return {
    fieldErrors,
    filters: {
      page,
      limit,
      search,
      actorAdminId,
      actorRole,
      category,
      action,
      resourceType,
      resourceId,
      outcome,
      dateFrom,
      dateTo,
    },
  };
}

function createMongoFilter(
  filters,
) {
  const filter = {};

  if (filters.search) {
    filter.$text = {
      $search:
        filters.search,
    };
  }

  if (filters.actorAdminId) {
    filter.actorAdminId =
      new mongoose.Types.ObjectId(
        filters.actorAdminId,
      );
  }

  if (filters.actorRole) {
    filter.actorRoleSnapshot =
      filters.actorRole;
  }

  if (filters.category) {
    filter.category =
      filters.category;
  }

  if (filters.action) {
    filter.action =
      filters.action;
  }

  if (filters.resourceType) {
    filter.resourceType =
      filters.resourceType;
  }

  if (filters.resourceId) {
    filter.resourceId =
      new mongoose.Types.ObjectId(
        filters.resourceId,
      );
  }

  if (filters.outcome) {
    filter.outcome =
      filters.outcome;
  }

  if (
    filters.dateFrom ||
    filters.dateTo
  ) {
    filter.createdAt = {};

    if (filters.dateFrom) {
      filter.createdAt.$gte =
        filters.dateFrom;
    }

    if (filters.dateTo) {
      filter.createdAt.$lte =
        filters.dateTo;
    }
  }

  return filter;
}

function serializeCompactAuditLog(
  auditLog,
) {
  return {
    _id: auditLog._id,
    actorType:
      auditLog.actorType,
    actorAdminId:
      auditLog.actorAdminId,
    actorNameSnapshot:
      auditLog.actorNameSnapshot,
    actorEmailSnapshot:
      auditLog.actorEmailSnapshot,
    actorRoleSnapshot:
      auditLog.actorRoleSnapshot,
    category:
      auditLog.category,
    action:
      auditLog.action,
    outcome:
      auditLog.outcome,
    resourceType:
      auditLog.resourceType,
    resourceId:
      auditLog.resourceId,
    resourceLabel:
      auditLog.resourceLabel,
    resourceSlug:
      auditLog.resourceSlug,
    changedFields:
      Array.isArray(
        auditLog.changedFields,
      )
        ? auditLog.changedFields
        : [],
    createdAt:
      auditLog.createdAt,
  };
}

function serializeAuditLogDetail(
  auditLog,
) {
  return {
    ...serializeCompactAuditLog(
      auditLog,
    ),
    changes:
      isPlainObject(
        auditLog.changes,
      )
        ? auditLog.changes
        : {},
    metadata:
      isPlainObject(
        auditLog.metadata,
      )
        ? auditLog.metadata
        : {},
    request: {
      method:
        auditLog.httpMethod,
      path:
        auditLog.routePath,
      ip:
        auditLog.ip,
      userAgent:
        auditLog.userAgent,
    },
  };
}

async function getAdminAuditLogs(
  req,
  res,
  next,
) {
  const {
    fieldErrors,
    filters,
  } =
    parseAuditLogQuery(
      req.query,
    );

  if (
    Object.keys(fieldErrors).length >
    0
  ) {
    return res
      .status(400)
      .json({
        success: false,
        message:
          "Please correct the Audit Log query parameters.",
        fieldErrors,
      });
  }

  const mongoFilter =
    createMongoFilter(filters);

  const skip =
    (filters.page - 1) *
    filters.limit;

  try {
    const [
      auditLogs,
      total,
    ] = await Promise.all([
      AuditLog.find(
        mongoFilter,
      )
        .sort({
          createdAt: -1,
          _id: -1,
        })
        .skip(skip)
        .limit(filters.limit)
        .lean(),
      AuditLog.countDocuments(
        mongoFilter,
      ),
    ]);

    const pages =
      Math.max(
        1,
        Math.ceil(
          total /
            filters.limit,
        ),
      );

    return res
      .status(200)
      .json({
        success: true,
        data:
          auditLogs.map(
            serializeCompactAuditLog,
          ),
        count:
          auditLogs.length,
        total,
        page:
          filters.page,
        limit:
          filters.limit,
        pages,
      });
  } catch (error) {
    return next(error);
  }
}

async function getAdminAuditLogById(
  req,
  res,
  next,
) {
  const auditLogId =
    typeof req.params?.id ===
      "string"
      ? req.params.id.trim()
      : "";

  if (
    !mongoose.isValidObjectId(
      auditLogId,
    )
  ) {
    return res
      .status(400)
      .json({
        success: false,
        message:
          "Audit Log identifier is invalid.",
        fieldErrors: {
          id:
            "Audit Log identifier must be a valid identifier.",
        },
      });
  }

  try {
    const auditLog =
      await AuditLog.findById(
        auditLogId,
      ).lean();

    if (!auditLog) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "Audit Log record was not found.",
        });
    }

    return res
      .status(200)
      .json({
        success: true,
        data:
          serializeAuditLogDetail(
            auditLog,
          ),
      });
  } catch (error) {
    return next(error);
  }
}

export {
  getAdminAuditLogById,
  getAdminAuditLogs,
};
