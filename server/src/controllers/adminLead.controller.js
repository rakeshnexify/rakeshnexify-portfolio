import mongoose from "mongoose";

import AdminUser from "../models/AdminUser.js";
import ContactMessage from "../models/ContactMessage.js";
import Lead, {
  leadPriorities,
  leadStatuses,
} from "../models/Lead.js";
import Service from "../models/Service.js";
import { createAuditLog } from "../services/auditLog.service.js";
import { createEventNotification } from "../services/notification.service.js";
import { sendStoredEventNotificationPushSafely } from "../services/pushNotification.service.js";

const ACTIVE_LEAD_STATUSES = [
  "new",
  "qualified",
  "contacted",
  "proposal",
  "negotiation",
];

const ALLOWED_CREATE_FIELDS = new Set([
  "name",
  "email",
  "phone",
  "company",
  "source",
  "service",
  "serviceSlug",
  "serviceTitle",
  "subject",
  "requirementSummary",
  "status",
  "priority",
  "estimatedValue",
  "currency",
  "assignedTo",
  "nextFollowUpAt",
  "lastContactedAt",
  "lostReason",
  "order",
]);

const ALLOWED_UPDATE_FIELDS = new Set([
  "name",
  "email",
  "phone",
  "company",
  "source",
  "service",
  "serviceSlug",
  "serviceTitle",
  "subject",
  "requirementSummary",
  "status",
  "priority",
  "estimatedValue",
  "currency",
  "assignedTo",
  "nextFollowUpAt",
  "lastContactedAt",
  "lostReason",
  "order",
]);

const ALLOWED_LIST_QUERY_FIELDS = new Set([
  "search",
  "status",
  "priority",
  "source",
  "service",
  "assignedTo",
  "followUp",
  "sort",
  "page",
  "limit",
]);

const CRM_BUSINESS_UTC_OFFSET_MINUTES = 5 * 60 + 45;

const MAX_LEAD_ORDER = 1_000_000;
const MAX_PAGE_NUMBER = 100_000;

function createHttpError(message, statusCode = 400, fieldErrors = {}) {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.fieldErrors = fieldErrors;

  return error;
}

function hasOwnProperty(object, property) {
  return Object.prototype.hasOwnProperty.call(object, property);
}

function escapeRegularExpression(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function requireObjectBody(req) {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    throw createHttpError("A valid JSON object is required.", 400);
  }

  return req.body;
}

function assertAllowedFields(requestBody, allowedFields) {
  const unsupportedFields = Object.keys(requestBody).filter(
    (fieldName) => !allowedFields.has(fieldName),
  );

  if (unsupportedFields.length > 0) {
    throw createHttpError(
      `Unsupported lead field${unsupportedFields.length === 1 ? "" : "s"}: ${unsupportedFields.join(", ")}.`,
      400,
    );
  }
}

function assertValidListQuery(query = {}) {
  if (!query || typeof query !== "object" || Array.isArray(query)) {
    throw createHttpError("Lead query parameters are not valid.", 400);
  }

  const unsupportedFields = Object.keys(query).filter(
    (fieldName) => !ALLOWED_LIST_QUERY_FIELDS.has(fieldName),
  );

  if (unsupportedFields.length > 0) {
    const fieldErrors = Object.fromEntries(
      unsupportedFields.map((fieldName) => [
        fieldName,
        "This lead query parameter is not supported.",
      ]),
    );

    throw createHttpError(
      `Unsupported lead query parameter${unsupportedFields.length === 1 ? "" : "s"}: ${unsupportedFields.join(", ")}.`,
      400,
      fieldErrors,
    );
  }

  Object.entries(query).forEach(([fieldName, value]) => {
    if (typeof value !== "string") {
      throw createHttpError(
        `Lead query parameter "${fieldName}" must contain one text value.`,
        400,
        {
          [fieldName]:
            "Provide this query parameter once as a single text value.",
        },
      );
    }
  });
}

function validateObjectId(value, fieldName, fieldLabel) {
  if (typeof value !== "string") {
    throw createHttpError(`${fieldLabel} must be a string.`, 400, {
      [fieldName]: `Please provide a valid ${fieldLabel}.`,
    });
  }

  const cleanedValue = value.trim();

  if (!mongoose.isValidObjectId(cleanedValue)) {
    throw createHttpError(`Invalid ${fieldLabel}.`, 400, {
      [fieldName]: `Please provide a valid ${fieldLabel}.`,
    });
  }

  return cleanedValue;
}

function validateLeadId(leadId) {
  validateObjectId(leadId, "id", "lead ID");
}

function cleanString(
  value,
  {
    fieldName,
    fieldLabel,
    required = false,
    minLength = 0,
    maxLength = null,
    lowercase = false,
    uppercase = false,
  },
) {
  if (value === undefined) {
    if (required) {
      throw createHttpError(`${fieldLabel} is required.`, 400, {
        [fieldName]: `${fieldLabel} is required.`,
      });
    }

    return "";
  }

  if (typeof value !== "string") {
    throw createHttpError(`${fieldLabel} must be text.`, 400, {
      [fieldName]: `${fieldLabel} must be a text value.`,
    });
  }

  let cleanedValue = value.trim();

  if (lowercase) {
    cleanedValue = cleanedValue.toLowerCase();
  }

  if (uppercase) {
    cleanedValue = cleanedValue.toUpperCase();
  }

  if (required && !cleanedValue) {
    throw createHttpError(`${fieldLabel} is required.`, 400, {
      [fieldName]: `${fieldLabel} is required.`,
    });
  }

  if (cleanedValue && minLength && cleanedValue.length < minLength) {
    throw createHttpError(
      `${fieldLabel} must contain at least ${minLength} characters.`,
      400,
      {
        [fieldName]: `${fieldLabel} must contain at least ${minLength} characters.`,
      },
    );
  }

  if (
    cleanedValue &&
    Number.isInteger(maxLength) &&
    cleanedValue.length > maxLength
  ) {
    throw createHttpError(
      `${fieldLabel} cannot exceed ${maxLength} characters.`,
      400,
      {
        [fieldName]: `${fieldLabel} cannot exceed ${maxLength} characters.`,
      },
    );
  }

  return cleanedValue;
}

function cleanQueryString(value, fieldName) {
  if (value === undefined) {
    return "";
  }

  if (typeof value !== "string") {
    throw createHttpError(
      `Lead query parameter "${fieldName}" must contain one text value.`,
      400,
      {
        [fieldName]:
          "Provide this query parameter once as a single text value.",
      },
    );
  }

  return value.trim();
}

function cleanEmail(value) {
  const email = cleanString(value, {
    fieldName: "email",
    fieldLabel: "Lead email",
    maxLength: 150,
    lowercase: true,
  });

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createHttpError("Please provide a valid lead email address.", 400, {
      email: "Please provide a valid lead email address.",
    });
  }

  return email;
}

function cleanServiceSlug(value) {
  const serviceSlug = cleanString(value, {
    fieldName: "serviceSlug",
    fieldLabel: "Service slug",
    maxLength: 160,
    lowercase: true,
  });

  if (serviceSlug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(serviceSlug)) {
    throw createHttpError("Service slug is not valid.", 400, {
      serviceSlug:
        "Service slug can contain lowercase letters, numbers and hyphens only.",
    });
  }

  return serviceSlug;
}

function cleanStatus(value) {
  if (typeof value !== "string") {
    throw createHttpError("Lead status must be text.", 400, {
      status: "Please select a valid lead status.",
    });
  }

  const status = value.trim().toLowerCase();

  if (!leadStatuses.includes(status)) {
    throw createHttpError("Invalid lead status.", 400, {
      status: "Please select a valid lead status.",
    });
  }

  return status;
}

function cleanPriority(value) {
  if (typeof value !== "string") {
    throw createHttpError("Lead priority must be text.", 400, {
      priority: "Please select a valid lead priority.",
    });
  }

  const priority = value.trim().toLowerCase();

  if (!leadPriorities.includes(priority)) {
    throw createHttpError("Invalid lead priority.", 400, {
      priority: "Please select a valid lead priority.",
    });
  }

  return priority;
}

function cleanCurrency(value) {
  if (typeof value !== "string") {
    throw createHttpError("Currency must be text.", 400, {
      currency: "Currency must use a 3-letter code such as USD, NPR or INR.",
    });
  }

  const currency = value.trim().toUpperCase();

  if (!/^[A-Z]{3}$/.test(currency)) {
    throw createHttpError("Currency must use a 3-letter code.", 400, {
      currency: "Currency must use a 3-letter code such as USD, NPR or INR.",
    });
  }

  return currency;
}

function cleanNullableMoney(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  let number = value;

  if (typeof value === "string") {
    const cleanedValue = value.trim();

    if (!/^\d+(?:\.\d+)?$/.test(cleanedValue)) {
      throw createHttpError(
        "Estimated value must be a non-negative number.",
        400,
        {
          estimatedValue: "Estimated value must be a non-negative number.",
        },
      );
    }

    number = Number(cleanedValue);
  } else if (typeof value !== "number") {
    throw createHttpError(
      "Estimated value must be a non-negative number.",
      400,
      {
        estimatedValue: "Estimated value must be a non-negative number.",
      },
    );
  }

  if (!Number.isFinite(number) || number < 0) {
    throw createHttpError(
      "Estimated value must be a non-negative number.",
      400,
      {
        estimatedValue: "Estimated value must be a non-negative number.",
      },
    );
  }

  return number;
}

function cleanOrder(value) {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  let order = value;

  if (typeof value === "string") {
    const cleanedValue = value.trim();

    if (!/^\d+$/.test(cleanedValue)) {
      throw createHttpError("Lead order must be a non-negative integer.", 400, {
        order: "Lead order must be a non-negative integer.",
      });
    }

    order = Number(cleanedValue);
  } else if (typeof value !== "number") {
    throw createHttpError("Lead order must be a non-negative integer.", 400, {
      order: "Lead order must be a non-negative integer.",
    });
  }

  if (
    !Number.isSafeInteger(order) ||
    order < 0 ||
    order > MAX_LEAD_ORDER
  ) {
    throw createHttpError(
      `Lead order must be an integer between 0 and ${MAX_LEAD_ORDER}.`,
      400,
      {
        order: `Lead order must be an integer between 0 and ${MAX_LEAD_ORDER}.`,
      },
    );
  }

  return order;
}

function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year, month) {
  const monthLengths = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return monthLengths[month - 1] || 0;
}

function isValidCalendarDate(year, month, day) {
  return (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth(year, month)
  );
}

function cleanNullableDate(value, fieldName, fieldLabel) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw createHttpError(`${fieldLabel} must be an ISO date string.`, 400, {
      [fieldName]: `Please provide a valid ${fieldLabel.toLowerCase()}.`,
    });
  }

  const cleanedValue = value.trim();

  const dateOnlyMatch =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(cleanedValue);

  const dateTimeMatch =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|([+-])(\d{2}):(\d{2}))$/.exec(
      cleanedValue,
    );

  if (!dateOnlyMatch && !dateTimeMatch) {
    throw createHttpError(`${fieldLabel} must be an ISO date string.`, 400, {
      [fieldName]:
        "Use YYYY-MM-DD or an ISO date-time with an explicit timezone.",
    });
  }

  const matchedValue = dateOnlyMatch || dateTimeMatch;

  const year = Number(matchedValue[1]);
  const month = Number(matchedValue[2]);
  const day = Number(matchedValue[3]);

  if (!isValidCalendarDate(year, month, day)) {
    throw createHttpError(`${fieldLabel} is not a valid calendar date.`, 400, {
      [fieldName]: `Please provide a valid ${fieldLabel.toLowerCase()}.`,
    });
  }

  if (dateTimeMatch) {
    const hour = Number(dateTimeMatch[4]);
    const minute = Number(dateTimeMatch[5]);
    const second =
      dateTimeMatch[6] === undefined ? 0 : Number(dateTimeMatch[6]);

    if (
      !Number.isInteger(hour) ||
      !Number.isInteger(minute) ||
      !Number.isInteger(second) ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59 ||
      second < 0 ||
      second > 59
    ) {
      throw createHttpError(`${fieldLabel} contains an invalid time.`, 400, {
        [fieldName]: `Please provide a valid ${fieldLabel.toLowerCase()}.`,
      });
    }

    if (dateTimeMatch[8] !== "Z") {
      const offsetHour = Number(dateTimeMatch[10]);
      const offsetMinute = Number(dateTimeMatch[11]);

      const isValidOffset =
        Number.isInteger(offsetHour) &&
        Number.isInteger(offsetMinute) &&
        offsetHour >= 0 &&
        offsetHour <= 14 &&
        offsetMinute >= 0 &&
        offsetMinute <= 59 &&
        (offsetHour < 14 || offsetMinute === 0);

      if (!isValidOffset) {
        throw createHttpError(
          `${fieldLabel} contains an invalid timezone offset.`,
          400,
          {
            [fieldName]:
              "Use Z or a valid timezone offset between -14:00 and +14:00.",
          },
        );
      }
    }
  }

  const date = new Date(cleanedValue);

  if (Number.isNaN(date.getTime())) {
    throw createHttpError(`${fieldLabel} is not a valid date.`, 400, {
      [fieldName]: `Please provide a valid ${fieldLabel.toLowerCase()}.`,
    });
  }

  return date;
}

function cleanPageNumber(value, fallback = 1) {
  if (value === undefined || value === "") {
    return fallback;
  }

  if (typeof value !== "string" || !/^\d+$/.test(value.trim())) {
    throw createHttpError("Page must be a positive integer.", 400, {
      page: "Page must be a positive integer.",
    });
  }

  const page = Number(value.trim());

  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    page > MAX_PAGE_NUMBER
  ) {
    throw createHttpError(
      `Page must be an integer between 1 and ${MAX_PAGE_NUMBER}.`,
      400,
      {
        page: `Page must be an integer between 1 and ${MAX_PAGE_NUMBER}.`,
      },
    );
  }

  return page;
}

function cleanLimit(value) {
  if (value === undefined || value === "") {
    return 20;
  }

  if (typeof value !== "string" || !/^\d+$/.test(value.trim())) {
    throw createHttpError("Limit must be between 1 and 100.", 400, {
      limit: "Limit must be between 1 and 100.",
    });
  }

  const limit = Number(value.trim());

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw createHttpError("Limit must be between 1 and 100.", 400, {
      limit: "Limit must be between 1 and 100.",
    });
  }

  return limit;
}

function startOfBusinessDay(dayOffset = 0) {
  /*
   * CRM follow-up buckets use the business calendar day at UTC+05:45.
   * Calculate the boundary in UTC so deployment-host timezone does not
   * change overdue/today/upcoming classification.
   */
  const now = new Date();

  const shiftedNow = new Date(
    now.getTime() + CRM_BUSINESS_UTC_OFFSET_MINUTES * 60 * 1000,
  );

  const boundaryUtcMilliseconds =
    Date.UTC(
      shiftedNow.getUTCFullYear(),
      shiftedNow.getUTCMonth(),
      shiftedNow.getUTCDate() + dayOffset,
      0,
      0,
      0,
      0,
    ) -
    CRM_BUSINESS_UTC_OFFSET_MINUTES * 60 * 1000;

  return new Date(boundaryUtcMilliseconds);
}

function startOfToday() {
  return startOfBusinessDay(0);
}

function startOfTomorrow() {
  return startOfBusinessDay(1);
}

function addAndCondition(filter, condition) {
  filter.$and = [...(filter.$and || []), condition];
}

function buildListFilter(query = {}) {
  assertValidListQuery(query);

  const filter = {};

  const search = cleanQueryString(query.search, "search");

  const status = cleanQueryString(query.status, "status").toLowerCase();

  const priority = cleanQueryString(query.priority, "priority").toLowerCase();

  const source = cleanQueryString(query.source, "source");

  const service = cleanQueryString(query.service, "service");

  const assignedTo = cleanQueryString(query.assignedTo, "assignedTo");

  const followUp = cleanQueryString(query.followUp, "followUp").toLowerCase();

  if (search) {
    const safeSearch = escapeRegularExpression(search);

    filter.$or = [
      {
        name: {
          $regex: safeSearch,
          $options: "i",
        },
      },
      {
        email: {
          $regex: safeSearch,
          $options: "i",
        },
      },
      {
        phone: {
          $regex: safeSearch,
          $options: "i",
        },
      },
      {
        company: {
          $regex: safeSearch,
          $options: "i",
        },
      },
      {
        subject: {
          $regex: safeSearch,
          $options: "i",
        },
      },
      {
        requirementSummary: {
          $regex: safeSearch,
          $options: "i",
        },
      },
      {
        serviceSlug: {
          $regex: safeSearch,
          $options: "i",
        },
      },
      {
        serviceTitle: {
          $regex: safeSearch,
          $options: "i",
        },
      },
    ];
  }

  if (status) {
    filter.status = cleanStatus(status);
  }

  if (priority) {
    filter.priority = cleanPriority(priority);
  }

  if (source) {
    filter.source = {
      $regex: `^${escapeRegularExpression(source)}$`,
      $options: "i",
    };
  }

  if (service) {
    const safeService = escapeRegularExpression(service);

    addAndCondition(filter, {
      $or: [
        {
          serviceSlug: {
            $regex: `^${safeService}$`,
            $options: "i",
          },
        },
        {
          serviceTitle: {
            $regex: `^${safeService}$`,
            $options: "i",
          },
        },
      ],
    });
  }

  if (assignedTo) {
    filter.assignedTo = validateObjectId(
      assignedTo,
      "assignedTo",
      "assigned Admin ID",
    );
  }

  if (followUp) {
    const today = startOfToday();
    const tomorrow = startOfTomorrow();

    if (followUp === "overdue") {
      filter.nextFollowUpAt = {
        $ne: null,
        $lt: today,
      };

      addAndCondition(filter, {
        status: {
          $in: ACTIVE_LEAD_STATUSES,
        },
      });
    } else if (followUp === "today") {
      filter.nextFollowUpAt = {
        $gte: today,
        $lt: tomorrow,
      };

      addAndCondition(filter, {
        status: {
          $in: ACTIVE_LEAD_STATUSES,
        },
      });
    } else if (followUp === "upcoming") {
      filter.nextFollowUpAt = {
        $gte: tomorrow,
      };

      addAndCondition(filter, {
        status: {
          $in: ACTIVE_LEAD_STATUSES,
        },
      });
    } else if (followUp === "none") {
      filter.nextFollowUpAt = null;
    } else {
      throw createHttpError("Invalid follow-up filter.", 400, {
        followUp:
          "Follow-up filter must be overdue, today, upcoming or none.",
      });
    }
  }

  return filter;
}

function buildSort(query = {}) {
  const sort = cleanQueryString(query.sort, "sort").toLowerCase();

  if (!sort || sort === "newest") {
    return {
      createdAt: -1,
      _id: -1,
    };
  }

  if (sort === "oldest") {
    return {
      createdAt: 1,
      _id: 1,
    };
  }

  if (sort === "followup") {
    return {
      nextFollowUpAt: 1,
      createdAt: -1,
    };
  }

  if (sort === "value-high") {
    return {
      estimatedValue: -1,
      createdAt: -1,
    };
  }

  if (sort === "value-low") {
    return {
      estimatedValue: 1,
      createdAt: -1,
    };
  }

  throw createHttpError("Invalid lead sort option.", 400, {
    sort: "Please select a valid lead sort option.",
  });
}

function createEmptyStatusCounts() {
  return leadStatuses.reduce(
    (counts, status) => ({
      ...counts,
      [status]: 0,
    }),
    {},
  );
}

function buildStatusCounts(aggregationResults) {
  const counts = createEmptyStatusCounts();

  aggregationResults.forEach((result) => {
    if (leadStatuses.includes(result._id)) {
      counts[result._id] = result.count;
    }
  });

  return counts;
}

async function resolveAssignedAdmin(value, session = null) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  const adminId = validateObjectId(
    value,
    "assignedTo",
    "assigned Admin ID",
  );

  let adminQuery = AdminUser.findOne({
    _id: adminId,
    isActive: true,
  }).select("_id");

  if (session) {
    adminQuery = adminQuery.session(session);
  }

  const adminUser = await adminQuery.lean();

  if (!adminUser) {
    throw createHttpError("Assigned Admin is unavailable.", 400, {
      assignedTo: "Please select an active Admin account.",
    });
  }

  return adminUser._id;
}

async function resolveService(value, session = null) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  const serviceId = validateObjectId(value, "service", "service ID");

  let serviceQuery = Service.findById(serviceId)
    .select("_id slug title");

  if (session) {
    serviceQuery = serviceQuery.session(session);
  }

  const service = await serviceQuery.lean();

  if (!service) {
    throw createHttpError("Selected Service was not found.", 400, {
      service: "Please select a valid Service.",
    });
  }

  return service;
}

function objectIdValuesMatch(first, second) {
  const firstValue = first ? String(first) : "";
  const secondValue = second ? String(second) : "";

  return firstValue === secondValue;
}

function buildLeadAuditChangeSet({
  previousStatus,
  nextStatus,
  previousAssignedTo,
  nextAssignedTo,
}) {
  const changedFields = [];
  const changes = {};

  if (previousStatus !== nextStatus) {
    changedFields.push("status");
    changes.status = {
      from: previousStatus,
      to: nextStatus,
    };
  }

  if (!objectIdValuesMatch(previousAssignedTo, nextAssignedTo)) {
    changedFields.push("assignedTo");
    changes.assignedTo = {
      from: previousAssignedTo || null,
      to: nextAssignedTo || null,
    };
  }

  let action = "update";

  if (changedFields.includes("status")) {
    action = "status-change";
  } else if (changedFields.includes("assignedTo")) {
    action = "assignment-change";
  }

  return {
    action,
    changedFields,
    changes,
  };
}

function applyStatusMetadata(lead, nextStatus, adminId) {
  if (lead.status === nextStatus) {
    return;
  }

  const now = new Date();

  lead.status = nextStatus;
  lead.statusUpdatedAt = now;
  lead.statusUpdatedBy = adminId;

  if (nextStatus === "won") {
    lead.wonAt = now;
    lead.lostAt = null;
    lead.archivedAt = null;
    lead.lostReason = "";

    return;
  }

  if (nextStatus === "lost") {
    lead.wonAt = null;
    lead.lostAt = now;
    lead.archivedAt = null;

    return;
  }

  if (nextStatus === "archived") {
    lead.wonAt = null;
    lead.lostAt = null;
    lead.lostReason = "";
    lead.archivedAt = now;

    return;
  }

  lead.wonAt = null;
  lead.lostAt = null;
  lead.archivedAt = null;
  lead.lostReason = "";
}

function buildCommonLeadFields(requestBody, { isCreate = false } = {}) {
  const fields = {};

  if (isCreate || hasOwnProperty(requestBody, "name")) {
    fields.name = cleanString(requestBody.name, {
      fieldName: "name",
      fieldLabel: "Lead name",
      required: true,
      minLength: 2,
      maxLength: 100,
    });
  }

  if (isCreate || hasOwnProperty(requestBody, "email")) {
    fields.email = cleanEmail(requestBody.email);
  }

  if (isCreate || hasOwnProperty(requestBody, "phone")) {
    fields.phone = cleanString(requestBody.phone, {
      fieldName: "phone",
      fieldLabel: "Lead phone",
      maxLength: 30,
    });
  }

  if (isCreate || hasOwnProperty(requestBody, "company")) {
    fields.company = cleanString(requestBody.company, {
      fieldName: "company",
      fieldLabel: "Company name",
      maxLength: 160,
    });
  }

  if (isCreate || hasOwnProperty(requestBody, "source")) {
    fields.source =
      requestBody.source === undefined
        ? "manual"
        : cleanString(requestBody.source, {
            fieldName: "source",
            fieldLabel: "Lead source",
            maxLength: 100,
            lowercase: true,
          });
  }

  if (isCreate || hasOwnProperty(requestBody, "serviceSlug")) {
    fields.serviceSlug = cleanServiceSlug(requestBody.serviceSlug);
  }

  if (isCreate || hasOwnProperty(requestBody, "serviceTitle")) {
    fields.serviceTitle = cleanString(requestBody.serviceTitle, {
      fieldName: "serviceTitle",
      fieldLabel: "Service title",
      maxLength: 150,
    });
  }

  if (isCreate || hasOwnProperty(requestBody, "subject")) {
    fields.subject = cleanString(requestBody.subject, {
      fieldName: "subject",
      fieldLabel: "Lead subject",
      required: true,
      minLength: 3,
      maxLength: 150,
    });
  }

  if (isCreate || hasOwnProperty(requestBody, "requirementSummary")) {
    fields.requirementSummary = cleanString(requestBody.requirementSummary, {
      fieldName: "requirementSummary",
      fieldLabel: "Requirement summary",
      maxLength: 5000,
    });
  }

  if (isCreate || hasOwnProperty(requestBody, "priority")) {
    fields.priority =
      requestBody.priority === undefined
        ? "medium"
        : cleanPriority(requestBody.priority);
  }

  if (isCreate || hasOwnProperty(requestBody, "estimatedValue")) {
    fields.estimatedValue = cleanNullableMoney(requestBody.estimatedValue);
  }

  if (isCreate || hasOwnProperty(requestBody, "currency")) {
    fields.currency =
      requestBody.currency === undefined
        ? "USD"
        : cleanCurrency(requestBody.currency);
  }

  if (isCreate || hasOwnProperty(requestBody, "nextFollowUpAt")) {
    fields.nextFollowUpAt = cleanNullableDate(
      requestBody.nextFollowUpAt,
      "nextFollowUpAt",
      "Next follow-up date",
    );
  }

  if (isCreate || hasOwnProperty(requestBody, "lastContactedAt")) {
    fields.lastContactedAt = cleanNullableDate(
      requestBody.lastContactedAt,
      "lastContactedAt",
      "Last contacted date",
    );
  }

  if (isCreate || hasOwnProperty(requestBody, "order")) {
    fields.order = cleanOrder(requestBody.order);
  }

  return fields;
}

function cleanLostReasonForStatus(value, status) {
  const lostReason = cleanString(value, {
    fieldName: "lostReason",
    fieldLabel: "Lost reason",
    maxLength: 1000,
  });

  if (lostReason && status !== "lost") {
    throw createHttpError(
      "Lost reason can only be saved when lead status is lost.",
      400,
      {
        lostReason:
          "Set lead status to lost before saving a non-empty lost reason.",
      },
    );
  }

  return status === "lost" ? lostReason : "";
}

function populateLeadQuery(query) {
  return query
    .populate({
      path: "assignedTo",
      select: "_id name email role isActive",
    })
    .populate({
      path: "service",
      select: "_id title slug",
    })
    .populate({
      path: "createdBy",
      select: "_id name email role",
    })
    .populate({
      path: "updatedBy",
      select: "_id name email role",
    })
    .populate({
      path: "statusUpdatedBy",
      select: "_id name email role",
    })
    .populate({
      path: "notes.createdBy",
      select: "_id name email role",
    });
}

function populateLeadDetailQuery(query) {
  return populateLeadQuery(query).populate({
    path: "sourceContactMessage",
    select:
      "_id name email phone service serviceTitle subject message source status createdAt",
  });
}

function sendLeadError(error, res, next) {
  if (error?.name === "ValidationError") {
    const fieldErrors = {};

    Object.entries(error.errors).forEach(([fieldName, fieldError]) => {
      fieldErrors[fieldName] = fieldError.message;
    });

    return res.status(400).json({
      success: false,
      message: "Please correct the lead details.",
      fieldErrors,
    });
  }

  if (error?.code === 11000 && error?.keyPattern?.sourceContactMessage) {
    return res.status(409).json({
      success: false,
      message: "This contact message has already been converted to a lead.",
      fieldErrors: {
        sourceContactMessage:
          "This contact message has already been converted to a lead.",
      },
    });
  }

  if (error?.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      fieldErrors: error.fieldErrors || {},
    });
  }

  return next(error);
}

async function getAdminLeads(req, res, next) {
  try {
    assertValidListQuery(req.query);

    const filter = buildListFilter(req.query);

    const page = cleanPageNumber(req.query.page);

    const limit = cleanLimit(req.query.limit);

    const sort = buildSort(req.query);

    const skip = (page - 1) * limit;

    const today = startOfToday();
    const tomorrow = startOfTomorrow();

    const [leads, total, statusResults, overdueFollowUps, todayFollowUps] =
      await Promise.all([
        populateLeadQuery(
          Lead.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit),
        ).lean(),

        Lead.countDocuments(filter),

        Lead.aggregate([
          {
            $group: {
              _id: "$status",
              count: {
                $sum: 1,
              },
            },
          },
        ]),

        Lead.countDocuments({
          status: {
            $in: ACTIVE_LEAD_STATUSES,
          },
          nextFollowUpAt: {
            $ne: null,
            $lt: today,
          },
        }),

        Lead.countDocuments({
          status: {
            $in: ACTIVE_LEAD_STATUSES,
          },
          nextFollowUpAt: {
            $gte: today,
            $lt: tomorrow,
          },
        }),
      ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return res.status(200).json({
      success: true,
      count: leads.length,
      total,
      page,
      limit,
      totalPages,
      statusCounts: buildStatusCounts(statusResults),
      followUpCounts: {
        overdue: overdueFollowUps,
        today: todayFollowUps,
      },
      data: leads,
    });
  } catch (error) {
    return sendLeadError(error, res, next);
  }
}

async function getAdminLeadById(req, res, next) {
  try {
    validateLeadId(req.params.id);

    const lead = await populateLeadDetailQuery(
      Lead.findById(req.params.id),
    ).lean();

    if (!lead) {
      throw createHttpError("Lead not found.", 404);
    }

    return res.status(200).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    return sendLeadError(error, res, next);
  }
}

async function createAdminLead(req, res, next) {
  const session = await mongoose.startSession();

  try {
    const requestBody = requireObjectBody(req);

    assertAllowedFields(requestBody, ALLOWED_CREATE_FIELDS);

    const commonFields = buildCommonLeadFields(requestBody, {
      isCreate: true,
    });

    const nextStatus =
      requestBody.status === undefined
        ? "new"
        : cleanStatus(requestBody.status);

    const lostReason = hasOwnProperty(requestBody, "lostReason")
      ? cleanLostReasonForStatus(requestBody.lostReason, nextStatus)
      : "";

    let createdLeadId = null;

    await session.withTransaction(async () => {
      const fields = {
        ...commonFields,
      };

      const assignedTo = await resolveAssignedAdmin(
        requestBody.assignedTo,
        session,
      );

      const service = await resolveService(
        requestBody.service,
        session,
      );

      if (assignedTo !== undefined) {
        fields.assignedTo = assignedTo;
      }

      if (service !== undefined) {
        fields.service = service?._id || null;

        if (service) {
          fields.serviceSlug = service.slug;
          fields.serviceTitle = service.title;
        }
      }

      const lead = new Lead({
        ...fields,
        status: "new",
        lostReason,
        createdBy: req.admin._id,
        updatedBy: req.admin._id,
      });

      if (nextStatus !== "new") {
        applyStatusMetadata(lead, nextStatus, req.admin._id);

        if (nextStatus === "lost") {
          lead.lostReason = lostReason;
        }
      }

      await lead.save({
        session,
      });

      await createEventNotification(
        {
          type: "lead",
          resource: lead,
        },
        {
          session,
        },
      );

      await createAuditLog({
        actor: req.admin,
        category: "workflow",
        action: "create",
        outcome: "success",
        resource: {
          type: "lead",
          id: lead._id,
          label: "CRM lead",
        },
        request: req,
        session,
      });

      createdLeadId = lead._id;
    });

    void sendStoredEventNotificationPushSafely(
      "lead",
      createdLeadId,
    );

    const savedLead = await populateLeadDetailQuery(
      Lead.findById(createdLeadId),
    ).lean();

    return res.status(201).json({
      success: true,
      message: "Lead created successfully.",
      data: savedLead,
    });
  } catch (error) {
    return sendLeadError(error, res, next);
  } finally {
    await session.endSession();
  }
}

async function updateAdminLead(req, res, next) {
  const session = await mongoose.startSession();

  try {
    validateLeadId(req.params.id);

    const requestBody = requireObjectBody(req);

    assertAllowedFields(requestBody, ALLOWED_UPDATE_FIELDS);

    if (Object.keys(requestBody).length === 0) {
      throw createHttpError("At least one lead field is required.", 400);
    }

    let updatedLeadId = null;

    await session.withTransaction(async () => {
      const lead = await Lead.findById(req.params.id)
        .session(session);

      if (!lead) {
        throw createHttpError("Lead not found.", 404);
      }

      const previousStatus = lead.status;
      const previousAssignedTo = lead.assignedTo;

      const nextStatus = hasOwnProperty(requestBody, "status")
        ? cleanStatus(requestBody.status)
        : lead.status;

      const nextLostReason = hasOwnProperty(requestBody, "lostReason")
        ? cleanLostReasonForStatus(requestBody.lostReason, nextStatus)
        : undefined;

      const previousServiceId = lead.service ? String(lead.service) : "";
      const previousServiceSlug = lead.serviceSlug;
      const previousServiceTitle = lead.serviceTitle;

      const fields = buildCommonLeadFields(requestBody);

      Object.entries(fields).forEach(([fieldName, fieldValue]) => {
        lead[fieldName] = fieldValue;
      });

      if (hasOwnProperty(requestBody, "assignedTo")) {
        lead.assignedTo = await resolveAssignedAdmin(
          requestBody.assignedTo,
          session,
        );
      }

      if (hasOwnProperty(requestBody, "service")) {
        const service = await resolveService(
          requestBody.service,
          session,
        );

        const nextServiceId = service?._id ? String(service._id) : "";

        const serviceRelationshipChanged =
          previousServiceId !== nextServiceId;

        lead.service = service?._id || null;

        if (serviceRelationshipChanged && service) {
          lead.serviceSlug = service.slug;
          lead.serviceTitle = service.title;
        }

        if (serviceRelationshipChanged && !service) {
          lead.serviceSlug = previousServiceSlug;
          lead.serviceTitle = previousServiceTitle;
        }

        if (!serviceRelationshipChanged) {
          lead.serviceSlug = previousServiceSlug;
          lead.serviceTitle = previousServiceTitle;
        }
      }

      if (hasOwnProperty(requestBody, "status")) {
        applyStatusMetadata(lead, nextStatus, req.admin._id);
      }

      if (nextLostReason !== undefined) {
        lead.lostReason = nextLostReason;
      }

      lead.updatedBy = req.admin._id;

      await lead.save({
        session,
      });

      const auditChangeSet = buildLeadAuditChangeSet({
        previousStatus,
        nextStatus: lead.status,
        previousAssignedTo,
        nextAssignedTo: lead.assignedTo,
      });

      await createAuditLog({
        actor: req.admin,
        category: "workflow",
        action: auditChangeSet.action,
        outcome: "success",
        resource: {
          type: "lead",
          id: lead._id,
          label: "CRM lead",
        },
        changedFields: auditChangeSet.changedFields,
        changes: auditChangeSet.changes,
        request: req,
        session,
      });

      updatedLeadId = lead._id;
    });

    const updatedLead = await populateLeadDetailQuery(
      Lead.findById(updatedLeadId),
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Lead updated successfully.",
      data: updatedLead,
    });
  } catch (error) {
    return sendLeadError(error, res, next);
  } finally {
    await session.endSession();
  }
}

async function addAdminLeadNote(req, res, next) {
  const session = await mongoose.startSession();

  try {
    validateLeadId(req.params.id);

    const requestBody = requireObjectBody(req);

    assertAllowedFields(requestBody, new Set(["text"]));

    const text = cleanString(requestBody.text, {
      fieldName: "text",
      fieldLabel: "Lead note",
      required: true,
      minLength: 1,
      maxLength: 3000,
    });

    let updatedLeadId = null;

    await session.withTransaction(async () => {
      const lead = await Lead.findById(req.params.id)
        .session(session);

      if (!lead) {
        throw createHttpError("Lead not found.", 404);
      }

      lead.notes.push({
        text,
        createdBy: req.admin._id,
      });

      const addedNote = lead.notes[lead.notes.length - 1];

      lead.updatedBy = req.admin._id;

      await lead.save({
        session,
      });

      await createAuditLog({
        actor: req.admin,
        category: "workflow",
        action: "note-added",
        outcome: "success",
        resource: {
          type: "lead",
          id: lead._id,
          label: "CRM lead",
        },
        metadata: {
          noteId: addedNote._id,
        },
        request: req,
        session,
      });

      updatedLeadId = lead._id;
    });

    const updatedLead = await populateLeadDetailQuery(
      Lead.findById(updatedLeadId),
    ).lean();

    return res.status(201).json({
      success: true,
      message: "Lead note added successfully.",
      data: updatedLead,
    });
  } catch (error) {
    return sendLeadError(error, res, next);
  } finally {
    await session.endSession();
  }
}

async function deleteAdminLead(req, res, next) {
  const session = await mongoose.startSession();

  try {
    validateLeadId(req.params.id);

    let deletedLeadSnapshot = null;

    await session.withTransaction(async () => {
      const lead = await Lead.findById(req.params.id)
        .select("_id name email subject")
        .session(session)
        .lean();

      if (!lead) {
        throw createHttpError("Lead not found.", 404);
      }

      const deleteResult = await Lead.deleteOne({
        _id: lead._id,
      }).session(session);

      if (deleteResult.deletedCount !== 1) {
        throw createHttpError("Lead not found.", 404);
      }

      await createAuditLog({
        actor: req.admin,
        category: "workflow",
        action: "delete",
        outcome: "success",
        resource: {
          type: "lead",
          id: lead._id,
          label: "CRM lead",
        },
        request: req,
        session,
      });

      deletedLeadSnapshot = lead;
    });

    return res.status(200).json({
      success: true,
      message: "Lead permanently deleted.",
      data: {
        id: deletedLeadSnapshot._id,
        name: deletedLeadSnapshot.name,
        email: deletedLeadSnapshot.email,
        subject: deletedLeadSnapshot.subject,
      },
    });
  } catch (error) {
    return sendLeadError(error, res, next);
  } finally {
    await session.endSession();
  }
}

async function convertContactMessageToLead(req, res, next) {
  const session = await mongoose.startSession();

  try {
    validateObjectId(req.params.id, "id", "contact message ID");

    const requestBody =
      req.body === undefined
        ? {}
        : requireObjectBody(req);

    const allowedConversionFields = new Set([
      "company",
      "priority",
      "estimatedValue",
      "currency",
      "assignedTo",
      "nextFollowUpAt",
    ]);

    assertAllowedFields(requestBody, allowedConversionFields);

    let createdLeadId = null;

    await session.withTransaction(async () => {
      const message = await ContactMessage.findById(req.params.id)
        .session(session)
        .lean();

      if (!message) {
        throw createHttpError("Contact message not found.", 404);
      }

      const existingLead = await Lead.findOne({
        sourceContactMessage: message._id,
      })
        .select("_id")
        .session(session)
        .lean();

      if (existingLead) {
        throw createHttpError(
          "This contact message has already been converted to a lead.",
          409,
          {
            sourceContactMessage:
              "This contact message has already been converted to a lead.",
          },
        );
      }

      const assignedTo = hasOwnProperty(requestBody, "assignedTo")
        ? await resolveAssignedAdmin(requestBody.assignedTo, session)
        : null;

      let serviceQuery = message.service
        ? Service.findOne({
            slug: message.service,
          }).select("_id slug title")
        : null;

      if (serviceQuery) {
        serviceQuery = serviceQuery.session(session);
      }

      const service = serviceQuery
        ? await serviceQuery.lean()
        : null;

      const lead = new Lead({
        name: message.name,
        email: message.email,
        phone: message.phone || "",
        company: hasOwnProperty(requestBody, "company")
          ? cleanString(requestBody.company, {
              fieldName: "company",
              fieldLabel: "Company name",
              maxLength: 160,
            })
          : "",
        source: message.source || "portfolio-website",
        sourceContactMessage: message._id,
        service: service?._id || null,
        serviceSlug: message.service || service?.slug || "",
        serviceTitle: message.serviceTitle || service?.title || "",
        subject: message.subject,
        requirementSummary: message.message || "",
        status: "new",
        priority: hasOwnProperty(requestBody, "priority")
          ? cleanPriority(requestBody.priority)
          : "medium",
        estimatedValue: hasOwnProperty(requestBody, "estimatedValue")
          ? cleanNullableMoney(requestBody.estimatedValue)
          : null,
        currency: hasOwnProperty(requestBody, "currency")
          ? cleanCurrency(requestBody.currency)
          : "USD",
        assignedTo,
        nextFollowUpAt: hasOwnProperty(requestBody, "nextFollowUpAt")
          ? cleanNullableDate(
              requestBody.nextFollowUpAt,
              "nextFollowUpAt",
              "Next follow-up date",
            )
          : null,
        createdBy: req.admin._id,
        updatedBy: req.admin._id,
      });

      const messageTouchResult = await ContactMessage.updateOne(
        {
          _id: message._id,
        },
        {
          $set: {
            updatedAt: new Date(),
          },
        },
        {
          session,
        },
      );

      if (messageTouchResult.matchedCount !== 1) {
        throw createHttpError("Contact message not found.", 404);
      }

      await lead.save({
        session,
      });

      await createEventNotification(
        {
          type: "lead",
          resource: lead,
        },
        {
          session,
        },
      );

      await createAuditLog({
        actor: req.admin,
        category: "workflow",
        action: "convert",
        outcome: "success",
        resource: {
          type: "contact-message",
          id: message._id,
          label: "Contact message",
        },
        metadata: {
          sourceResourceId: message._id,
          createdLeadId: lead._id,
        },
        request: req,
        session,
      });

      createdLeadId = lead._id;
    });

    void sendStoredEventNotificationPushSafely(
      "lead",
      createdLeadId,
    );

    const savedLead = await populateLeadDetailQuery(
      Lead.findById(createdLeadId),
    ).lean();

    return res.status(201).json({
      success: true,
      message: "Contact message converted to a lead successfully.",
      data: savedLead,
    });
  } catch (error) {
    return sendLeadError(error, res, next);
  } finally {
    await session.endSession();
  }
}

export {
  addAdminLeadNote,
  convertContactMessageToLead,
  createAdminLead,
  deleteAdminLead,
  getAdminLeadById,
  getAdminLeads,
  updateAdminLead,
};
