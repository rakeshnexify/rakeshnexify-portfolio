import mongoose from "mongoose";

import CertificationAchievement, {
  CERTIFICATION_ACHIEVEMENT_TYPES,
  MAX_CERTIFICATION_ACHIEVEMENT_ORDER,
} from "../models/CertificationAchievement.js";
import Education from "../models/Education.js";
import Experience from "../models/Experience.js";
import { createAuditLog } from "../services/auditLog.service.js";

const ALLOWED_EDITABLE_FIELDS = new Set([
  "type",
  "title",
  "slug",
  "issuerName",
  "shortDescription",
  "description",
  "issueDate",
  "doesNotExpire",
  "expirationDate",
  "credentialId",
  "verificationUrl",
  "mediaUrl",
  "mediaAlt",
  "relatedEducation",
  "relatedExperience",
  "order",
  "isFeatured",
  "isVisible",
]);

const ALLOWED_LIST_QUERY_FIELDS = new Set([
  "search",
  "type",
  "isVisible",
  "isFeatured",
  "expiration",
]);

const EXPIRATION_FILTERS = ["all", "active", "expired"];
const BUSINESS_UTC_OFFSET_MINUTES = 5 * 60 + 45;

function createHttpError(message, statusCode = 400, fieldErrors = {}) {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.fieldErrors = fieldErrors;

  return error;
}

function hasOwnProperty(object, property) {
  return Object.prototype.hasOwnProperty.call(object, property);
}

function requireObjectBody(req) {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    throw createHttpError(
      "Certification/Achievement request body must be a JSON object.",
      400,
      {
        body: "Certification/Achievement request body must be a JSON object.",
      },
    );
  }

  return req.body;
}

function assertAllowedFields(requestBody) {
  const unsupportedFields = Object.keys(requestBody).filter(
    (fieldName) => !ALLOWED_EDITABLE_FIELDS.has(fieldName),
  );

  if (unsupportedFields.length === 0) {
    return;
  }

  throw createHttpError(
    `Unsupported Certification/Achievement field${
      unsupportedFields.length === 1 ? "" : "s"
    }: ${unsupportedFields.join(", ")}.`,
    400,
    Object.fromEntries(
      unsupportedFields.map((fieldName) => [
        fieldName,
        "This field is not supported.",
      ]),
    ),
  );
}

function assertValidListQuery(query = {}) {
  if (!query || typeof query !== "object" || Array.isArray(query)) {
    throw createHttpError(
      "Certification/Achievement query parameters are not valid.",
      400,
    );
  }

  const unsupportedFields = Object.keys(query).filter(
    (fieldName) => !ALLOWED_LIST_QUERY_FIELDS.has(fieldName),
  );

  if (unsupportedFields.length > 0) {
    throw createHttpError(
      `Unsupported Certification/Achievement query parameter${
        unsupportedFields.length === 1 ? "" : "s"
      }: ${unsupportedFields.join(", ")}.`,
      400,
      Object.fromEntries(
        unsupportedFields.map((fieldName) => [
          fieldName,
          "This query parameter is not supported.",
        ]),
      ),
    );
  }

  Object.entries(query).forEach(([fieldName, value]) => {
    if (typeof value !== "string") {
      throw createHttpError(
        `Query parameter "${fieldName}" must contain one text value.`,
        400,
        {
          [fieldName]:
            "Provide this query parameter once as a single text value.",
        },
      );
    }
  });
}

function cleanString(
  value,
  {
    fieldName,
    fieldLabel,
    required = false,
    minLength = 0,
    maxLength,
    singleLine = false,
  },
) {
  if (typeof value !== "string") {
    throw createHttpError(`${fieldLabel} must be text.`, 400, {
      [fieldName]: `${fieldLabel} must be a text value.`,
    });
  }

  const cleanValue = singleLine
    ? value.trim().replace(/\s+/g, " ")
    : value.trim();

  if (required && !cleanValue) {
    throw createHttpError(`${fieldLabel} is required.`, 400, {
      [fieldName]: `${fieldLabel} is required.`,
    });
  }

  if (cleanValue && minLength && cleanValue.length < minLength) {
    throw createHttpError(
      `${fieldLabel} must contain at least ${minLength} characters.`,
      400,
      {
        [fieldName]: `${fieldLabel} must contain at least ${minLength} characters.`,
      },
    );
  }

  if (cleanValue.length > maxLength) {
    throw createHttpError(
      `${fieldLabel} cannot exceed ${maxLength} characters.`,
      400,
      {
        [fieldName]: `${fieldLabel} cannot exceed ${maxLength} characters.`,
      },
    );
  }

  return cleanValue;
}

function createSlug(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createDefaultSlug(record = {}) {
  const issueDate = record.issueDate ? new Date(record.issueDate) : null;

  const issueYear =
    issueDate && !Number.isNaN(issueDate.getTime())
      ? String(issueDate.getUTCFullYear())
      : "";

  return createSlug(
    [record.title, record.issuerName, issueYear]
      .map((value) => String(value ?? "").trim())
      .filter(Boolean)
      .join(" "),
  );
}

function cleanType(value) {
  const cleanValue = cleanString(value, {
    fieldName: "type",
    fieldLabel: "Certification/Achievement type",
    required: true,
    maxLength: 30,
    singleLine: true,
  }).toLowerCase();

  if (!CERTIFICATION_ACHIEVEMENT_TYPES.includes(cleanValue)) {
    throw createHttpError("Invalid Certification/Achievement type.", 400, {
      type: "Please select a supported Certification/Achievement type.",
    });
  }

  return cleanValue;
}

function cleanBoolean(value, fieldName, fieldLabel) {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw createHttpError(`${fieldLabel} must be true or false.`, 400, {
    [fieldName]: `${fieldLabel} must be true or false.`,
  });
}

function cleanOrder(value) {
  let numericValue;

  if (typeof value === "number") {
    numericValue = value;
  } else if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    numericValue = Number(value.trim());
  } else {
    throw createHttpError("Display order must be a whole number.", 400, {
      order: "Display order must be a non-negative whole number.",
    });
  }

  if (
    !Number.isSafeInteger(numericValue) ||
    numericValue < 0 ||
    numericValue > MAX_CERTIFICATION_ACHIEVEMENT_ORDER
  ) {
    throw createHttpError("Display order is outside the allowed range.", 400, {
      order: `Display order must be an integer between 0 and ${MAX_CERTIFICATION_ACHIEVEMENT_ORDER}.`,
    });
  }

  return numericValue;
}

function cleanRequiredDate(value, fieldName, fieldLabel) {
  if (typeof value !== "string") {
    throw createHttpError(`${fieldLabel} must be a date-only text value.`, 400, {
      [fieldName]: `Enter ${fieldLabel.toLowerCase()} using YYYY-MM-DD.`,
    });
  }

  const cleanValue = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanValue)) {
    throw createHttpError(`${fieldLabel} must use YYYY-MM-DD.`, 400, {
      [fieldName]: `Enter ${fieldLabel.toLowerCase()} using YYYY-MM-DD.`,
    });
  }

  const date = new Date(`${cleanValue}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== cleanValue
  ) {
    throw createHttpError(`${fieldLabel} must be a real calendar date.`, 400, {
      [fieldName]: `Enter a real ${fieldLabel.toLowerCase()} using YYYY-MM-DD.`,
    });
  }

  return date;
}

function cleanOptionalDate(value, fieldName, fieldLabel) {
  if (value === "" || value === null) {
    return null;
  }

  return cleanRequiredDate(value, fieldName, fieldLabel);
}

function cleanUrl(value, fieldName, fieldLabel) {
  const cleanValue = cleanString(value, {
    fieldName,
    fieldLabel,
    maxLength: 500,
  });

  if (!cleanValue) {
    return "";
  }

  try {
    const parsedUrl = new URL(cleanValue);

    if (
      !["http:", "https:"].includes(parsedUrl.protocol) ||
      !parsedUrl.hostname ||
      parsedUrl.username ||
      parsedUrl.password
    ) {
      throw new Error("Unsafe URL");
    }
  } catch {
    throw createHttpError(`${fieldLabel} is invalid.`, 400, {
      [fieldName]:
        `${fieldLabel} must be a complete credential-free http:// or https:// URL.`,
    });
  }

  return cleanValue;
}

function cleanRelatedId(value, fieldName, fieldLabel) {
  if (value === "" || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw createHttpError(`${fieldLabel} must be a record ID.`, 400, {
      [fieldName]: `Please select a valid ${fieldLabel.toLowerCase()}.`,
    });
  }

  const cleanValue = value.trim();

  if (!mongoose.isValidObjectId(cleanValue)) {
    throw createHttpError(`Invalid ${fieldLabel}.`, 400, {
      [fieldName]: `Please select a valid ${fieldLabel.toLowerCase()}.`,
    });
  }

  return cleanValue;
}

function validateRecordId(value) {
  if (!mongoose.isValidObjectId(value)) {
    throw createHttpError("Invalid Certification/Achievement ID.", 400, {
      id: "Certification/Achievement ID must be a valid record ID.",
    });
  }
}

function buildPayload(requestBody) {
  assertAllowedFields(requestBody);

  const payload = {};

  if (hasOwnProperty(requestBody, "type")) {
    payload.type = cleanType(requestBody.type);
  }

  if (hasOwnProperty(requestBody, "title")) {
    payload.title = cleanString(requestBody.title, {
      fieldName: "title",
      fieldLabel: "Title",
      required: true,
      minLength: 2,
      maxLength: 180,
      singleLine: true,
    });
  }

  if (hasOwnProperty(requestBody, "slug")) {
    const rawSlug = cleanString(requestBody.slug, {
      fieldName: "slug",
      fieldLabel: "Slug",
      maxLength: 220,
      singleLine: true,
    });

    payload.slug = createSlug(rawSlug);
  }

  if (hasOwnProperty(requestBody, "issuerName")) {
    payload.issuerName = cleanString(requestBody.issuerName, {
      fieldName: "issuerName",
      fieldLabel: "Issuer name",
      maxLength: 180,
      singleLine: true,
    });
  }

  if (hasOwnProperty(requestBody, "shortDescription")) {
    payload.shortDescription = cleanString(requestBody.shortDescription, {
      fieldName: "shortDescription",
      fieldLabel: "Short description",
      required: true,
      minLength: 10,
      maxLength: 600,
    });
  }

  if (hasOwnProperty(requestBody, "description")) {
    payload.description = cleanString(requestBody.description, {
      fieldName: "description",
      fieldLabel: "Description",
      maxLength: 5000,
    });
  }

  if (hasOwnProperty(requestBody, "credentialId")) {
    payload.credentialId = cleanString(requestBody.credentialId, {
      fieldName: "credentialId",
      fieldLabel: "Credential ID",
      maxLength: 250,
      singleLine: true,
    });
  }

  if (hasOwnProperty(requestBody, "mediaAlt")) {
    payload.mediaAlt = cleanString(requestBody.mediaAlt, {
      fieldName: "mediaAlt",
      fieldLabel: "Media alt text",
      maxLength: 250,
      singleLine: true,
    });
  }

  if (hasOwnProperty(requestBody, "verificationUrl")) {
    payload.verificationUrl = cleanUrl(
      requestBody.verificationUrl,
      "verificationUrl",
      "Verification URL",
    );
  }

  if (hasOwnProperty(requestBody, "mediaUrl")) {
    payload.mediaUrl = cleanUrl(
      requestBody.mediaUrl,
      "mediaUrl",
      "Media URL",
    );
  }

  if (hasOwnProperty(requestBody, "issueDate")) {
    payload.issueDate = cleanRequiredDate(
      requestBody.issueDate,
      "issueDate",
      "Issue date",
    );
  }

  if (hasOwnProperty(requestBody, "expirationDate")) {
    payload.expirationDate = cleanOptionalDate(
      requestBody.expirationDate,
      "expirationDate",
      "Expiration date",
    );
  }

  if (hasOwnProperty(requestBody, "doesNotExpire")) {
    payload.doesNotExpire = cleanBoolean(
      requestBody.doesNotExpire,
      "doesNotExpire",
      "Does not expire",
    );

    if (payload.doesNotExpire) {
      payload.expirationDate = null;
    }
  }

  if (hasOwnProperty(requestBody, "relatedEducation")) {
    payload.relatedEducation = cleanRelatedId(
      requestBody.relatedEducation,
      "relatedEducation",
      "Related Education record",
    );
  }

  if (hasOwnProperty(requestBody, "relatedExperience")) {
    payload.relatedExperience = cleanRelatedId(
      requestBody.relatedExperience,
      "relatedExperience",
      "Related Experience record",
    );
  }

  if (hasOwnProperty(requestBody, "order")) {
    payload.order = cleanOrder(requestBody.order);
  }

  if (hasOwnProperty(requestBody, "isFeatured")) {
    payload.isFeatured = cleanBoolean(
      requestBody.isFeatured,
      "isFeatured",
      "Featured",
    );
  }

  if (hasOwnProperty(requestBody, "isVisible")) {
    payload.isVisible = cleanBoolean(
      requestBody.isVisible,
      "isVisible",
      "Visibility",
    );
  }

  return payload;
}

async function validateRelations(payload, session = null) {
  const relationChecks = [];

  if (
    hasOwnProperty(payload, "relatedEducation") &&
    payload.relatedEducation
  ) {
    let query = Education.exists({
      _id: payload.relatedEducation,
    });

    if (session) {
      query = query.session(session);
    }

    relationChecks.push(
      query.then((exists) => {
        if (!exists) {
          throw createHttpError("Related Education record not found.", 404, {
            relatedEducation: "Please select an existing Education record.",
          });
        }
      }),
    );
  }

  if (
    hasOwnProperty(payload, "relatedExperience") &&
    payload.relatedExperience
  ) {
    let query = Experience.exists({
      _id: payload.relatedExperience,
    });

    if (session) {
      query = query.session(session);
    }

    relationChecks.push(
      query.then((exists) => {
        if (!exists) {
          throw createHttpError("Related Experience record not found.", 404, {
            relatedExperience: "Please select an existing Experience record.",
          });
        }
      }),
    );
  }

  await Promise.all(relationChecks);
}

function buildStandardContentAuditChangeSet(previous, current) {
  const changedFields = [];
  const changes = {};

  for (const fieldName of [
    "isVisible",
    "isFeatured",
    "order",
  ]) {
    if (
      Object.prototype.hasOwnProperty.call(previous, fieldName) &&
      Object.prototype.hasOwnProperty.call(current, fieldName) &&
      previous[fieldName] !== current[fieldName]
    ) {
      changedFields.push(fieldName);
      changes[fieldName] = {
        from: previous[fieldName],
        to: current[fieldName],
      };
    }
  }

  let action = "update";

  if (
    Object.prototype.hasOwnProperty.call(previous, "isVisible") &&
    Object.prototype.hasOwnProperty.call(current, "isVisible") &&
    previous.isVisible !== current.isVisible
  ) {
    action = current.isVisible
      ? "publish"
      : "unpublish";
  }

  return {
    action,
    changedFields,
    changes,
  };
}

function parseQueryText(query, fieldName, { maxLength = 200 } = {}) {
  if (!hasOwnProperty(query, fieldName)) {
    return "";
  }

  const value = query[fieldName];

  if (typeof value !== "string") {
    throw createHttpError(
      `Query parameter "${fieldName}" must contain one text value.`,
      400,
      {
        [fieldName]:
          "Provide this query parameter once as a single text value.",
      },
    );
  }

  const cleanValue = value.trim();

  if (cleanValue.length > maxLength) {
    throw createHttpError(`Query parameter "${fieldName}" is too long.`, 400, {
      [fieldName]: `This query parameter cannot exceed ${maxLength} characters.`,
    });
  }

  return cleanValue;
}

function parseTypeFilter(query) {
  if (!hasOwnProperty(query, "type")) {
    return "";
  }

  const value = parseQueryText(query, "type", {
    maxLength: 30,
  }).toLowerCase();

  if (!CERTIFICATION_ACHIEVEMENT_TYPES.includes(value)) {
    throw createHttpError("Invalid Certification/Achievement type filter.", 400, {
      type: "Please select a supported Certification/Achievement type.",
    });
  }

  return value;
}

function parseBooleanFilter(query, fieldName, fieldLabel) {
  if (!hasOwnProperty(query, fieldName)) {
    return undefined;
  }

  const value = parseQueryText(query, fieldName, {
    maxLength: 5,
  });

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw createHttpError(`${fieldLabel} filter must be true or false.`, 400, {
    [fieldName]: `${fieldLabel} filter must be true or false.`,
  });
}

function parseExpirationFilter(query) {
  if (!hasOwnProperty(query, "expiration")) {
    return "all";
  }

  const value = parseQueryText(query, "expiration", {
    maxLength: 10,
  }).toLowerCase();

  if (!EXPIRATION_FILTERS.includes(value)) {
    throw createHttpError("Invalid expiration filter.", 400, {
      expiration: "Select all, active or expired.",
    });
  }

  return value;
}

function startOfBusinessDay() {
  const now = new Date();

  const shiftedNow = new Date(
    now.getTime() + BUSINESS_UTC_OFFSET_MINUTES * 60 * 1000,
  );

  const boundaryUtcMilliseconds =
    Date.UTC(
      shiftedNow.getUTCFullYear(),
      shiftedNow.getUTCMonth(),
      shiftedNow.getUTCDate(),
      0,
      0,
      0,
      0,
    ) -
    BUSINESS_UTC_OFFSET_MINUTES * 60 * 1000;

  return new Date(boundaryUtcMilliseconds);
}

function escapeRegularExpression(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function addAndCondition(filter, condition) {
  filter.$and = [...(filter.$and || []), condition];
}

function sendCertificationAchievementError(error, res, next) {
  if (error?.code === 11000) {
    const duplicateField =
      Object.keys(error.keyPattern || error.keyValue || {})[0] || "slug";

    if (duplicateField === "identityKey") {
      return res.status(409).json({
        success: false,
        message:
          "A Certification/Achievement with the same type, title, issuer and issue date already exists.",
        fieldErrors: {
          title:
            "A record with this type, title, issuer and issue date already exists.",
        },
      });
    }

    return res.status(409).json({
      success: false,
      message: "A Certification/Achievement with this slug already exists.",
      fieldErrors: {
        slug: "A Certification/Achievement with this slug already exists.",
      },
    });
  }

  if (error?.name === "ValidationError") {
    const fieldErrors = {};

    Object.entries(error.errors).forEach(([fieldName, fieldError]) => {
      if (fieldName !== "identityKey") {
        fieldErrors[fieldName] = fieldError.message;
      }
    });

    return res.status(400).json({
      success: false,
      message: "Please correct the Certification/Achievement details.",
      fieldErrors,
    });
  }

  if (error?.name === "CastError") {
    const fieldName = String(error.path || "").trim();

    return res.status(400).json({
      success: false,
      message: "A Certification/Achievement value or record ID is invalid.",
      fieldErrors: fieldName
        ? {
            [fieldName]: "Please provide a valid value.",
          }
        : {},
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

async function getAdminCertificationAchievements(req, res, next) {
  try {
    assertValidListQuery(req.query);

    const filter = {};

    const search = parseQueryText(req.query, "search");
    const type = parseTypeFilter(req.query);
    const isVisible = parseBooleanFilter(
      req.query,
      "isVisible",
      "Visibility",
    );
    const isFeatured = parseBooleanFilter(
      req.query,
      "isFeatured",
      "Featured",
    );
    const expiration = parseExpirationFilter(req.query);

    if (search) {
      const safeSearch = escapeRegularExpression(search);

      addAndCondition(filter, {
        $or: [
          { title: { $regex: safeSearch, $options: "i" } },
          { issuerName: { $regex: safeSearch, $options: "i" } },
          { credentialId: { $regex: safeSearch, $options: "i" } },
          { shortDescription: { $regex: safeSearch, $options: "i" } },
          { description: { $regex: safeSearch, $options: "i" } },
        ],
      });
    }

    if (type) {
      filter.type = type;
    }

    if (isVisible !== undefined) {
      filter.isVisible = isVisible;
    }

    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured;
    }

    if (expiration === "expired") {
      filter.expirationDate = {
        $ne: null,
        $lt: startOfBusinessDay(),
      };
    }

    if (expiration === "active") {
      addAndCondition(filter, {
        $or: [
          { doesNotExpire: true },
          { expirationDate: null },
          {
            expirationDate: {
              $gte: startOfBusinessDay(),
            },
          },
        ],
      });
    }

    const records = await CertificationAchievement.find(filter)
      .sort({
        isFeatured: -1,
        order: 1,
        issueDate: -1,
        createdAt: 1,
        _id: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    return sendCertificationAchievementError(error, res, next);
  }
}

async function getAdminCertificationAchievementById(req, res, next) {
  try {
    validateRecordId(req.params.id);

    const record = await CertificationAchievement.findById(
      req.params.id,
    ).lean();

    if (!record) {
      throw createHttpError("Certification/Achievement not found.", 404);
    }

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    return sendCertificationAchievementError(error, res, next);
  }
}

async function createAdminCertificationAchievement(req, res, next) {
  try {
    const requestBody = requireObjectBody(req);
    const recordData = buildPayload(requestBody);

    if (!recordData.slug) {
      recordData.slug = createDefaultSlug(recordData);
    }

    recordData.createdBy = req.admin._id;
    recordData.updatedBy = req.admin._id;

    const record = await mongoose.connection.transaction(
      async (session) => {
        await validateRelations(recordData, session);

        const [createdRecord] = await CertificationAchievement.create(
          [recordData],
          {
            session,
          },
        );

        await createAuditLog({
          actor: req.admin,
          category: "content",
          action: "create",
          outcome: "success",
          resource: {
            type: "certification-achievement",
            id: createdRecord._id,
            label: createdRecord.title,
            slug: createdRecord.slug,
          },
          request: req,
          session,
        });

        return createdRecord;
      },
    );

    return res.status(201).json({
      success: true,
      message: "Certification/Achievement created successfully.",
      data: record,
    });
  } catch (error) {
    return sendCertificationAchievementError(error, res, next);
  }
}

async function updateAdminCertificationAchievement(req, res, next) {
  try {
    validateRecordId(req.params.id);

    const requestBody = requireObjectBody(req);

    assertAllowedFields(requestBody);

    if (Object.keys(requestBody).length === 0) {
      throw createHttpError(
        "At least one Certification/Achievement field is required for updating.",
        400,
      );
    }

    const recordData = buildPayload(requestBody);

    const record = await mongoose.connection.transaction(
      async (session) => {
        const existingRecord = await CertificationAchievement.findById(
          req.params.id,
        ).session(session);

        if (!existingRecord) {
          throw createHttpError("Certification/Achievement not found.", 404);
        }

        if (hasOwnProperty(recordData, "slug") && !recordData.slug) {
          recordData.slug = createDefaultSlug({
            ...existingRecord.toObject(),
            ...recordData,
          });
        }

        if (hasOwnProperty(recordData, "slug") && !recordData.slug) {
          throw createHttpError("Slug cannot be empty.", 400, {
            slug: "Slug cannot be empty.",
          });
        }

        await validateRelations(recordData, session);

        const previous = {
          isVisible: existingRecord.isVisible,
          isFeatured: existingRecord.isFeatured,
          order: existingRecord.order,
        };

        existingRecord.set(recordData);
        existingRecord.updatedBy = req.admin._id;

        await existingRecord.save({
          session,
        });

        const auditChangeSet = buildStandardContentAuditChangeSet(
          previous,
          {
            isVisible: existingRecord.isVisible,
            isFeatured: existingRecord.isFeatured,
            order: existingRecord.order,
          },
        );

        await createAuditLog({
          actor: req.admin,
          category: "content",
          action: auditChangeSet.action,
          outcome: "success",
          resource: {
            type: "certification-achievement",
            id: existingRecord._id,
            label: existingRecord.title,
            slug: existingRecord.slug,
          },
          changedFields: auditChangeSet.changedFields,
          changes: auditChangeSet.changes,
          request: req,
          session,
        });

        return existingRecord;
      },
    );

    return res.status(200).json({
      success: true,
      message: "Certification/Achievement updated successfully.",
      data: record,
    });
  } catch (error) {
    return sendCertificationAchievementError(error, res, next);
  }
}

async function deleteAdminCertificationAchievement(req, res, next) {
  try {
    validateRecordId(req.params.id);

    const deletedRecord = await mongoose.connection.transaction(
      async (session) => {
        const record = await CertificationAchievement.findById(req.params.id)
          .select("_id title type slug")
          .session(session)
          .lean();

        if (!record) {
          throw createHttpError("Certification/Achievement not found.", 404);
        }

        const deleteResult = await CertificationAchievement.deleteOne(
          {
            _id: record._id,
          },
          {
            session,
          },
        );

        if (deleteResult.deletedCount !== 1) {
          throw createHttpError("Certification/Achievement not found.", 404);
        }

        await createAuditLog({
          actor: req.admin,
          category: "content",
          action: "delete",
          outcome: "success",
          resource: {
            type: "certification-achievement",
            id: record._id,
            label: record.title,
            slug: record.slug,
          },
          request: req,
          session,
        });

        return record;
      },
    );

    return res.status(200).json({
      success: true,
      message: "Certification/Achievement permanently deleted.",
      data: {
        id: deletedRecord._id,
        title: deletedRecord.title,
        type: deletedRecord.type,
      },
    });
  } catch (error) {
    return sendCertificationAchievementError(error, res, next);
  }
}

export {
  createAdminCertificationAchievement,
  deleteAdminCertificationAchievement,
  getAdminCertificationAchievementById,
  getAdminCertificationAchievements,
  updateAdminCertificationAchievement,
};
