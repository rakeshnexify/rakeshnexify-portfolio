import mongoose from "mongoose";

import PackageDesign from "../models/PackageDesign.js";
import ServicePackage, {
  MAX_SERVICE_PACKAGE_ORDER,
  MAX_SERVICE_PACKAGE_PRICE,
  SERVICE_PACKAGE_BILLING_CYCLES,
  SERVICE_PACKAGE_GROUPS,
  SERVICE_PACKAGE_PRICING_MODES,
} from "../models/ServicePackage.js";
import {
  acquirePackageDesignParentGuards,
  runPackageDesignParentTransaction,
} from "../services/packageDesignParentGuard.service.js";
import {
  acquireServicePackageParentGuards,
  runServicePackageParentTransaction,
} from "../services/servicePackageParentGuard.service.js";
import { createAuditLog } from "../services/auditLog.service.js";

const ALLOWED_EDITABLE_FIELDS = new Set([
  "service",
  "group",
  "name",
  "slug",
  "shortDescription",
  "description",
  "pricingMode",
  "price",
  "currency",
  "priceLabel",
  "billingCycle",
  "billingLabel",
  "bestFor",
  "deliveryLabel",
  "supportLabel",
  "revisionsLabel",
  "features",
  "badge",
  "ctaLabel",
  "whatsappEnabled",
  "order",
  "isFeatured",
  "isVisible",
]);

const ALLOWED_LIST_QUERY_FIELDS = new Set([
  "search",
  "service",
  "group",
  "billingCycle",
  "pricingMode",
  "isVisible",
  "isFeatured",
]);

const FEATURE_FIELDS = new Set([
  "key",
  "label",
  "value",
  "included",
  "order",
]);

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
      "Service Package request body must be a JSON object.",
      400,
      {
        body: "Service Package request body must be a JSON object.",
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
    `Unsupported Service Package field${
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
  const unsupportedFields = Object.keys(query).filter(
    (fieldName) => !ALLOWED_LIST_QUERY_FIELDS.has(fieldName),
  );

  if (unsupportedFields.length > 0) {
    throw createHttpError(
      `Unsupported Service Package query parameter${
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
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanEnum(value, {
  fieldName,
  fieldLabel,
  allowedValues,
}) {
  const cleanValue = cleanString(value, {
    fieldName,
    fieldLabel,
    required: true,
    maxLength: 40,
    singleLine: true,
  }).toLowerCase();

  if (!allowedValues.includes(cleanValue)) {
    throw createHttpError(`Invalid ${fieldLabel.toLowerCase()}.`, 400, {
      [fieldName]: `Select one of: ${allowedValues.join(", ")}.`,
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

function cleanOrder(value, fieldName = "order", fieldLabel = "Display order") {
  let numericValue;

  if (typeof value === "number") {
    numericValue = value;
  } else if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    numericValue = Number(value.trim());
  } else {
    throw createHttpError(`${fieldLabel} must be a whole number.`, 400, {
      [fieldName]: `${fieldLabel} must be a non-negative whole number.`,
    });
  }

  if (
    !Number.isSafeInteger(numericValue) ||
    numericValue < 0 ||
    numericValue > MAX_SERVICE_PACKAGE_ORDER
  ) {
    throw createHttpError(`${fieldLabel} is outside the allowed range.`, 400, {
      [fieldName]:
        `${fieldLabel} must be an integer between 0 and ${MAX_SERVICE_PACKAGE_ORDER}.`,
    });
  }

  return numericValue;
}

function cleanPrice(value) {
  if (value === "" || value === null) {
    return null;
  }

  let numericValue;

  if (typeof value === "number") {
    numericValue = value;
  } else if (
    typeof value === "string" &&
    /^\d+(?:\.\d{1,2})?$/.test(value.trim())
  ) {
    numericValue = Number(value.trim());
  } else {
    throw createHttpError("Package price must be a valid amount.", 400, {
      price: "Enter a non-negative amount with at most 2 decimal places.",
    });
  }

  if (
    !Number.isFinite(numericValue) ||
    numericValue < 0 ||
    numericValue > MAX_SERVICE_PACKAGE_PRICE ||
    !/^\d+(?:\.\d{1,2})?$/.test(String(numericValue))
  ) {
    throw createHttpError("Package price is outside the allowed range.", 400, {
      price:
        `Package price must be between 0 and ${MAX_SERVICE_PACKAGE_PRICE} with at most 2 decimal places.`,
    });
  }

  return numericValue;
}

function cleanCurrency(value) {
  const cleanValue = cleanString(value, {
    fieldName: "currency",
    fieldLabel: "Currency",
    required: true,
    minLength: 3,
    maxLength: 3,
    singleLine: true,
  }).toUpperCase();

  if (!/^[A-Z]{3}$/.test(cleanValue)) {
    throw createHttpError("Currency must use a 3-letter code.", 400, {
      currency: "Use a 3-letter currency code such as NPR, INR or USD.",
    });
  }

  return cleanValue;
}

function cleanServiceId(value) {
  if (typeof value !== "string") {
    throw createHttpError("Related Service must be a record ID.", 400, {
      service: "Please select a valid Service.",
    });
  }

  const cleanValue = value.trim();

  if (!mongoose.isValidObjectId(cleanValue)) {
    throw createHttpError("Invalid related Service.", 400, {
      service: "Please select a valid Service.",
    });
  }

  return cleanValue;
}

function cleanFeatures(value) {
  if (!Array.isArray(value)) {
    throw createHttpError("Package features must be an array.", 400, {
      features: "Package features must be an array.",
    });
  }

  const seenKeys = new Set();

  return value.map((feature, index) => {
    if (!feature || typeof feature !== "object" || Array.isArray(feature)) {
      throw createHttpError(
        `Feature ${index + 1} must be an object.`,
        400,
        {
          features: `Feature ${index + 1} must be an object.`,
        },
      );
    }

    const unsupportedFields = Object.keys(feature).filter(
      (fieldName) => !FEATURE_FIELDS.has(fieldName),
    );

    if (unsupportedFields.length > 0) {
      throw createHttpError(
        `Feature ${index + 1} contains unsupported field${
          unsupportedFields.length === 1 ? "" : "s"
        }: ${unsupportedFields.join(", ")}.`,
        400,
        {
          features: `Feature ${index + 1} contains unsupported fields.`,
        },
      );
    }

    const label = cleanString(feature.label, {
      fieldName: "features",
      fieldLabel: `Feature ${index + 1} label`,
      required: true,
      minLength: 2,
      maxLength: 160,
      singleLine: true,
    });

    const rawKey = hasOwnProperty(feature, "key")
      ? cleanString(feature.key, {
          fieldName: "features",
          fieldLabel: `Feature ${index + 1} key`,
          maxLength: 120,
          singleLine: true,
        })
      : "";

    const key = createSlug(rawKey || label);

    if (!key) {
      throw createHttpError(
        `Feature ${index + 1} key is invalid.`,
        400,
        {
          features: `Feature ${index + 1} needs a valid key or label.`,
        },
      );
    }

    if (seenKeys.has(key)) {
      throw createHttpError(
        `Feature key "${key}" is duplicated.`,
        400,
        {
          features: "Feature keys must be unique within a package.",
        },
      );
    }

    seenKeys.add(key);

    return {
      key,
      label,
      value: hasOwnProperty(feature, "value")
        ? cleanString(feature.value, {
            fieldName: "features",
            fieldLabel: `Feature ${index + 1} value`,
            maxLength: 220,
            singleLine: true,
          })
        : "",
      included: hasOwnProperty(feature, "included")
        ? cleanBoolean(
            feature.included,
            "features",
            `Feature ${index + 1} included`,
          )
        : true,
      order: hasOwnProperty(feature, "order")
        ? cleanOrder(
            feature.order,
            "features",
            `Feature ${index + 1} order`,
          )
        : index,
    };
  });
}

function buildPayload(requestBody) {
  assertAllowedFields(requestBody);

  const payload = {};

  if (hasOwnProperty(requestBody, "service")) {
    payload.service = cleanServiceId(requestBody.service);
  }

  if (hasOwnProperty(requestBody, "group")) {
    payload.group = cleanEnum(requestBody.group, {
      fieldName: "group",
      fieldLabel: "Package group",
      allowedValues: SERVICE_PACKAGE_GROUPS,
    });
  }

  if (hasOwnProperty(requestBody, "name")) {
    payload.name = cleanString(requestBody.name, {
      fieldName: "name",
      fieldLabel: "Package name",
      required: true,
      minLength: 2,
      maxLength: 140,
      singleLine: true,
    });
  }

  if (hasOwnProperty(requestBody, "slug")) {
    const rawSlug = cleanString(requestBody.slug, {
      fieldName: "slug",
      fieldLabel: "Package slug",
      maxLength: 160,
      singleLine: true,
    });

    payload.slug = createSlug(rawSlug);
  }

  if (hasOwnProperty(requestBody, "shortDescription")) {
    payload.shortDescription = cleanString(requestBody.shortDescription, {
      fieldName: "shortDescription",
      fieldLabel: "Short description",
      required: true,
      minLength: 10,
      maxLength: 500,
    });
  }

  if (hasOwnProperty(requestBody, "description")) {
    payload.description = cleanString(requestBody.description, {
      fieldName: "description",
      fieldLabel: "Description",
      maxLength: 5000,
    });
  }

  if (hasOwnProperty(requestBody, "pricingMode")) {
    payload.pricingMode = cleanEnum(requestBody.pricingMode, {
      fieldName: "pricingMode",
      fieldLabel: "Pricing mode",
      allowedValues: SERVICE_PACKAGE_PRICING_MODES,
    });

    if (payload.pricingMode === "custom") {
      payload.price = null;
    }
  }

  if (hasOwnProperty(requestBody, "price")) {
    payload.price = cleanPrice(requestBody.price);
  }

  if (hasOwnProperty(requestBody, "currency")) {
    payload.currency = cleanCurrency(requestBody.currency);
  }

  if (hasOwnProperty(requestBody, "priceLabel")) {
    payload.priceLabel = cleanString(requestBody.priceLabel, {
      fieldName: "priceLabel",
      fieldLabel: "Price label",
      maxLength: 120,
      singleLine: true,
    });
  }

  if (hasOwnProperty(requestBody, "billingCycle")) {
    payload.billingCycle = cleanEnum(requestBody.billingCycle, {
      fieldName: "billingCycle",
      fieldLabel: "Billing cycle",
      allowedValues: SERVICE_PACKAGE_BILLING_CYCLES,
    });
  }

  if (hasOwnProperty(requestBody, "billingLabel")) {
    payload.billingLabel = cleanString(requestBody.billingLabel, {
      fieldName: "billingLabel",
      fieldLabel: "Billing label",
      maxLength: 120,
      singleLine: true,
    });
  }

  if (hasOwnProperty(requestBody, "bestFor")) {
    payload.bestFor = cleanString(requestBody.bestFor, {
      fieldName: "bestFor",
      fieldLabel: "Best-for text",
      maxLength: 250,
    });
  }

  if (hasOwnProperty(requestBody, "deliveryLabel")) {
    payload.deliveryLabel = cleanString(requestBody.deliveryLabel, {
      fieldName: "deliveryLabel",
      fieldLabel: "Delivery label",
      maxLength: 120,
      singleLine: true,
    });
  }

  if (hasOwnProperty(requestBody, "supportLabel")) {
    payload.supportLabel = cleanString(requestBody.supportLabel, {
      fieldName: "supportLabel",
      fieldLabel: "Support label",
      maxLength: 120,
      singleLine: true,
    });
  }

  if (hasOwnProperty(requestBody, "revisionsLabel")) {
    payload.revisionsLabel = cleanString(requestBody.revisionsLabel, {
      fieldName: "revisionsLabel",
      fieldLabel: "Revisions label",
      maxLength: 120,
      singleLine: true,
    });
  }

  if (hasOwnProperty(requestBody, "features")) {
    payload.features = cleanFeatures(requestBody.features);
  }

  if (hasOwnProperty(requestBody, "badge")) {
    payload.badge = cleanString(requestBody.badge, {
      fieldName: "badge",
      fieldLabel: "Package badge",
      maxLength: 80,
      singleLine: true,
    });
  }

  if (hasOwnProperty(requestBody, "ctaLabel")) {
    payload.ctaLabel = cleanString(requestBody.ctaLabel, {
      fieldName: "ctaLabel",
      fieldLabel: "CTA label",
      maxLength: 80,
      singleLine: true,
    });
  }

  if (hasOwnProperty(requestBody, "whatsappEnabled")) {
    payload.whatsappEnabled = cleanBoolean(
      requestBody.whatsappEnabled,
      "whatsappEnabled",
      "WhatsApp enabled",
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

function valuesMatch(first, second) {
  if (first === null || first === undefined) {
    return second === null || second === undefined;
  }

  if (second === null || second === undefined) {
    return false;
  }

  if (
    typeof first === "object" &&
    first?._bsontype === "ObjectId"
  ) {
    return String(first) === String(second);
  }

  if (
    typeof second === "object" &&
    second?._bsontype === "ObjectId"
  ) {
    return String(first) === String(second);
  }

  return first === second;
}

function buildContentAuditChangeSet({
  previous,
  current,
  relationshipField = null,
  relationshipAuditField = null,
}) {
  const changedFields = [];
  const changes = {};

  const safeFields = [
    "isVisible",
    "isFeatured",
    "order",
  ];

  for (const fieldName of safeFields) {
    if (
      Object.prototype.hasOwnProperty.call(previous, fieldName) &&
      Object.prototype.hasOwnProperty.call(current, fieldName) &&
      !valuesMatch(previous[fieldName], current[fieldName])
    ) {
      changedFields.push(fieldName);
      changes[fieldName] = {
        from: previous[fieldName],
        to: current[fieldName],
      };
    }
  }

  if (
    relationshipField &&
    relationshipAuditField &&
    Object.prototype.hasOwnProperty.call(previous, relationshipField) &&
    Object.prototype.hasOwnProperty.call(current, relationshipField) &&
    !valuesMatch(
      previous[relationshipField],
      current[relationshipField],
    )
  ) {
    changedFields.push(relationshipAuditField);
    changes[relationshipAuditField] = {
      from: previous[relationshipField] || null,
      to: current[relationshipField] || null,
    };
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

function validateRecordId(value) {
  if (!mongoose.isValidObjectId(value)) {
    throw createHttpError("Invalid Service Package ID.", 400, {
      id: "Service Package ID must be a valid record ID.",
    });
  }
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

function parseOptionalEnumFilter(query, fieldName, fieldLabel, allowedValues) {
  if (!hasOwnProperty(query, fieldName)) {
    return "";
  }

  const value = parseQueryText(query, fieldName, {
    maxLength: 40,
  }).toLowerCase();

  if (!allowedValues.includes(value)) {
    throw createHttpError(`Invalid ${fieldLabel.toLowerCase()} filter.`, 400, {
      [fieldName]: `Select one of: ${allowedValues.join(", ")}.`,
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

function parseServiceFilter(query) {
  if (!hasOwnProperty(query, "service")) {
    return "";
  }

  const value = parseQueryText(query, "service", {
    maxLength: 30,
  });

  if (!mongoose.isValidObjectId(value)) {
    throw createHttpError("Invalid Service filter.", 400, {
      service: "Please select a valid Service.",
    });
  }

  return value;
}

function escapeRegularExpression(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sendServicePackageError(error, res, next) {
  if (error?.code === 11000) {
    const keyPattern = error.keyPattern || {};
    const duplicateIdentity = Boolean(keyPattern.identityKey);

    if (duplicateIdentity) {
      return res.status(409).json({
        success: false,
        message:
          "A package with the same Service, group and name already exists.",
        fieldErrors: {
          name:
            "A package with this name already exists in the selected Service and group.",
        },
      });
    }

    return res.status(409).json({
      success: false,
      message:
        "A package with this slug already exists in the selected Service and group.",
      fieldErrors: {
        slug:
          "This package slug is already used in the selected Service and group.",
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
      message: "Please correct the Service Package details.",
      fieldErrors,
    });
  }

  if (error?.name === "CastError") {
    const fieldName = String(error.path || "").trim();

    return res.status(400).json({
      success: false,
      message: "A Service Package value or record ID is invalid.",
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

async function getAdminServicePackages(req, res, next) {
  try {
    assertValidListQuery(req.query);

    const filter = {};
    const search = parseQueryText(req.query, "search");
    const service = parseServiceFilter(req.query);
    const group = parseOptionalEnumFilter(
      req.query,
      "group",
      "Package group",
      SERVICE_PACKAGE_GROUPS,
    );
    const billingCycle = parseOptionalEnumFilter(
      req.query,
      "billingCycle",
      "Billing cycle",
      SERVICE_PACKAGE_BILLING_CYCLES,
    );
    const pricingMode = parseOptionalEnumFilter(
      req.query,
      "pricingMode",
      "Pricing mode",
      SERVICE_PACKAGE_PRICING_MODES,
    );
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

    if (search) {
      const safeSearch = escapeRegularExpression(search);

      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { slug: { $regex: safeSearch, $options: "i" } },
        { shortDescription: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } },
        { badge: { $regex: safeSearch, $options: "i" } },
      ];
    }

    if (service) {
      filter.service = service;
    }

    if (group) {
      filter.group = group;
    }

    if (billingCycle) {
      filter.billingCycle = billingCycle;
    }

    if (pricingMode) {
      filter.pricingMode = pricingMode;
    }

    if (isVisible !== undefined) {
      filter.isVisible = isVisible;
    }

    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured;
    }

    const records = await ServicePackage.find(filter)
      .populate({
        path: "service",
        select: "title slug isVisible order",
      })
      .sort({
        group: 1,
        isFeatured: -1,
        order: 1,
        _id: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    return sendServicePackageError(error, res, next);
  }
}

async function getAdminServicePackageById(req, res, next) {
  try {
    validateRecordId(req.params.id);

    const record = await ServicePackage.findById(req.params.id)
      .populate({
        path: "service",
        select: "title slug isVisible order",
      })
      .lean();

    if (!record) {
      throw createHttpError("Service Package not found.", 404);
    }

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    return sendServicePackageError(error, res, next);
  }
}

async function createAdminServicePackage(req, res, next) {
  try {
    const requestBody = requireObjectBody(req);
    const recordData = buildPayload(requestBody);

    if (!recordData.slug && recordData.name) {
      recordData.slug = createSlug(recordData.name);
    }

    if (!recordData.service) {
      throw createHttpError("Related Service is required.", 400, {
        service: "Please select an existing Service.",
      });
    }

    recordData.createdBy = req.admin._id;
    recordData.updatedBy = req.admin._id;

    const record = await runServicePackageParentTransaction(
      async (session) => {
        const guardResult = await acquireServicePackageParentGuards(
          [recordData.service],
          session,
        );

        if (!guardResult.ok) {
          throw createHttpError("Related Service not found.", 404, {
            service: "Please select an existing Service.",
          });
        }

        const [createdRecord] = await ServicePackage.create(
          [recordData],
          { session },
        );

        await createAuditLog({
          actor: req.admin,
          category: "content",
          action: "create",
          outcome: "success",
          resource: {
            type: "service-package",
            id: createdRecord._id,
            label: createdRecord.name,
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
      message: "Service Package created successfully.",
      data: record,
    });
  } catch (error) {
    return sendServicePackageError(error, res, next);
  }
}

async function updateAdminServicePackage(req, res, next) {
  try {
    validateRecordId(req.params.id);

    const requestBody = requireObjectBody(req);

    assertAllowedFields(requestBody);

    if (Object.keys(requestBody).length === 0) {
      throw createHttpError(
        "At least one Service Package field is required for updating.",
        400,
      );
    }

    const recordData = buildPayload(requestBody);

    const record = await runServicePackageParentTransaction(
      async (session) => {
        const existingRecord = await ServicePackage.findById(req.params.id)
          .session(session);

        if (!existingRecord) {
          throw createHttpError("Service Package not found.", 404);
        }

        if (hasOwnProperty(recordData, "slug") && !recordData.slug) {
          recordData.slug = createSlug(recordData.name || existingRecord.name);
        }

        if (hasOwnProperty(recordData, "slug") && !recordData.slug) {
          throw createHttpError("Package slug cannot be empty.", 400, {
            slug: "Package slug cannot be empty.",
          });
        }

        const currentServiceId = String(existingRecord.service);
        const nextServiceId = hasOwnProperty(recordData, "service")
          ? String(recordData.service)
          : currentServiceId;

        const guardResult = await acquireServicePackageParentGuards(
          [currentServiceId, nextServiceId],
          session,
        );

        if (!guardResult.ok) {
          if (guardResult.missingServiceId === nextServiceId) {
            throw createHttpError("Related Service not found.", 404, {
              service: "Please select an existing Service.",
            });
          }

          throw createHttpError(
            "The current related Service no longer exists.",
            409,
            {
              service:
                "This package references a missing Service and cannot be updated until the relation is repaired.",
            },
          );
        }

        const previous = {
          service: existingRecord.service,
          isVisible: existingRecord.isVisible,
          isFeatured: existingRecord.isFeatured,
          order: existingRecord.order,
        };

        existingRecord.set(recordData);
        existingRecord.updatedBy = req.admin._id;

        await existingRecord.save({ session });

        const auditChangeSet = buildContentAuditChangeSet({
          previous,
          current: {
            service: existingRecord.service,
            isVisible: existingRecord.isVisible,
            isFeatured: existingRecord.isFeatured,
            order: existingRecord.order,
          },
          relationshipField: "service",
          relationshipAuditField: "serviceId",
        });

        await createAuditLog({
          actor: req.admin,
          category: "content",
          action: auditChangeSet.action,
          outcome: "success",
          resource: {
            type: "service-package",
            id: existingRecord._id,
            label: existingRecord.name,
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
      message: "Service Package updated successfully.",
      data: record,
    });
  } catch (error) {
    return sendServicePackageError(error, res, next);
  }
}

async function deleteAdminServicePackage(req, res, next) {
  try {
    validateRecordId(req.params.id);

    const deletedRecord = await runPackageDesignParentTransaction(
      async (session) => {
        const guardResult = await acquirePackageDesignParentGuards(
          [req.params.id],
          session,
        );

        if (!guardResult.ok) {
          throw createHttpError("Service Package not found.", 404);
        }

        const relatedDesign = await PackageDesign.exists({
          servicePackage: req.params.id,
        }).session(session);

        if (relatedDesign) {
          throw createHttpError(
            "This Service Package cannot be deleted while Package Designs reference it.",
            409,
            {
              packageDesigns:
                "Delete or move the related Package Designs before deleting this Service Package.",
            },
          );
        }

        const record = await ServicePackage.findOneAndDelete(
          {
            _id: req.params.id,
          },
          {
            session,
          },
        );

        if (!record) {
          throw createHttpError("Service Package not found.", 404);
        }

        await createAuditLog({
          actor: req.admin,
          category: "content",
          action: "delete",
          outcome: "success",
          resource: {
            type: "service-package",
            id: record._id,
            label: record.name,
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
      message: "Service Package permanently deleted.",
      data: {
        id: deletedRecord._id,
        name: deletedRecord.name,
        group: deletedRecord.group,
      },
    });
  } catch (error) {
    return sendServicePackageError(error, res, next);
  }
}

export {
  createAdminServicePackage,
  deleteAdminServicePackage,
  getAdminServicePackageById,
  getAdminServicePackages,
  updateAdminServicePackage,
};
