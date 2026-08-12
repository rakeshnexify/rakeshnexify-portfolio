import mongoose from "mongoose";

import PackageDesign, {
  MAX_PACKAGE_DESIGN_ORDER,
  MAX_PACKAGE_DESIGN_SCREENSHOTS,
  PACKAGE_DESIGN_DEVICES,
} from "../models/PackageDesign.js";
import ServicePackage, {
  SERVICE_PACKAGE_GROUPS,
} from "../models/ServicePackage.js";
import {
  acquirePackageDesignParentGuards,
  runPackageDesignParentTransaction,
} from "../services/packageDesignParentGuard.service.js";
import { createAuditLog } from "../services/auditLog.service.js";

const ALLOWED_EDITABLE_FIELDS = new Set([
  "servicePackage",
  "name",
  "slug",
  "shortDescription",
  "description",
  "thumbnailUrl",
  "thumbnailAlt",
  "screenshots",
  "liveDemoUrl",
  "liveDemoLabel",
  "order",
  "isDefault",
  "isFeatured",
  "isVisible",
]);

const ALLOWED_LIST_QUERY_FIELDS = new Set([
  "search",
  "servicePackage",
  "service",
  "group",
  "isVisible",
  "isDefault",
  "isFeatured",
]);

const SCREENSHOT_FIELDS = new Set([
  "url",
  "alt",
  "device",
  "order",
]);

function createHttpError(
  message,
  statusCode = 400,
  fieldErrors = {},
) {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.fieldErrors = fieldErrors;

  return error;
}

function hasOwnProperty(
  object,
  property,
) {
  return Object.prototype.hasOwnProperty.call(
    object,
    property,
  );
}

function requireObjectBody(req) {
  if (
    !req.body ||
    typeof req.body !== "object" ||
    Array.isArray(req.body)
  ) {
    throw createHttpError(
      "Package Design request body must be a JSON object.",
      400,
      {
        body:
          "Package Design request body must be a JSON object.",
      },
    );
  }

  return req.body;
}

function assertAllowedFields(
  requestBody,
) {
  const unsupportedFields =
    Object.keys(requestBody).filter(
      (fieldName) =>
        !ALLOWED_EDITABLE_FIELDS.has(
          fieldName,
        ),
    );

  if (
    unsupportedFields.length === 0
  ) {
    return;
  }

  throw createHttpError(
    `Unsupported Package Design field${
      unsupportedFields.length === 1
        ? ""
        : "s"
    }: ${unsupportedFields.join(", ")}.`,
    400,
    Object.fromEntries(
      unsupportedFields.map(
        (fieldName) => [
          fieldName,
          "This field is not supported.",
        ],
      ),
    ),
  );
}

function assertValidListQuery(
  query = {},
) {
  const unsupportedFields =
    Object.keys(query).filter(
      (fieldName) =>
        !ALLOWED_LIST_QUERY_FIELDS.has(
          fieldName,
        ),
    );

  if (
    unsupportedFields.length > 0
  ) {
    throw createHttpError(
      `Unsupported Package Design query parameter${
        unsupportedFields.length === 1
          ? ""
          : "s"
      }: ${unsupportedFields.join(", ")}.`,
      400,
      Object.fromEntries(
        unsupportedFields.map(
          (fieldName) => [
            fieldName,
            "This query parameter is not supported.",
          ],
        ),
      ),
    );
  }

  Object.entries(query).forEach(
    ([fieldName, value]) => {
      if (
        typeof value !== "string"
      ) {
        throw createHttpError(
          `Query parameter "${fieldName}" must contain one text value.`,
          400,
          {
            [fieldName]:
              "Provide this query parameter once as a single text value.",
          },
        );
      }
    },
  );
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
  if (
    typeof value !== "string"
  ) {
    throw createHttpError(
      `${fieldLabel} must be text.`,
      400,
      {
        [fieldName]:
          `${fieldLabel} must be a text value.`,
      },
    );
  }

  const cleanValue =
    singleLine
      ? value
          .trim()
          .replace(/\s+/g, " ")
      : value.trim();

  if (
    required &&
    !cleanValue
  ) {
    throw createHttpError(
      `${fieldLabel} is required.`,
      400,
      {
        [fieldName]:
          `${fieldLabel} is required.`,
      },
    );
  }

  if (
    cleanValue &&
    minLength &&
    cleanValue.length < minLength
  ) {
    throw createHttpError(
      `${fieldLabel} must contain at least ${minLength} characters.`,
      400,
      {
        [fieldName]:
          `${fieldLabel} must contain at least ${minLength} characters.`,
      },
    );
  }

  if (
    cleanValue.length > maxLength
  ) {
    throw createHttpError(
      `${fieldLabel} cannot exceed ${maxLength} characters.`,
      400,
      {
        [fieldName]:
          `${fieldLabel} cannot exceed ${maxLength} characters.`,
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

function cleanBoolean(
  value,
  fieldName,
  fieldLabel,
) {
  if (
    typeof value === "boolean"
  ) {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw createHttpError(
    `${fieldLabel} must be true or false.`,
    400,
    {
      [fieldName]:
        `${fieldLabel} must be true or false.`,
    },
  );
}

function cleanOrder(
  value,
  fieldName = "order",
  fieldLabel = "Display order",
) {
  let numericValue;

  if (
    typeof value === "number"
  ) {
    numericValue = value;
  } else if (
    typeof value === "string" &&
    /^\d+$/.test(
      value.trim(),
    )
  ) {
    numericValue = Number(
      value.trim(),
    );
  } else {
    throw createHttpError(
      `${fieldLabel} must be a whole number.`,
      400,
      {
        [fieldName]:
          `${fieldLabel} must be a non-negative whole number.`,
      },
    );
  }

  if (
    !Number.isSafeInteger(
      numericValue,
    ) ||
    numericValue < 0 ||
    numericValue >
      MAX_PACKAGE_DESIGN_ORDER
  ) {
    throw createHttpError(
      `${fieldLabel} is outside the allowed range.`,
      400,
      {
        [fieldName]:
          `${fieldLabel} must be an integer between 0 and ${MAX_PACKAGE_DESIGN_ORDER}.`,
      },
    );
  }

  return numericValue;
}

function cleanHttpUrl(
  value,
  fieldName,
  fieldLabel,
  {
    required = false,
  } = {},
) {
  const cleanValue =
    cleanString(value, {
      fieldName,
      fieldLabel,
      required,
      maxLength: 2000,
      singleLine: true,
    });

  if (!cleanValue) {
    return "";
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(
      cleanValue,
    );
  } catch {
    throw createHttpError(
      `${fieldLabel} is invalid.`,
      400,
      {
        [fieldName]:
          `${fieldLabel} must be a valid http or https URL.`,
      },
    );
  }

  if (
    !["http:", "https:"].includes(
      parsedUrl.protocol,
    )
  ) {
    throw createHttpError(
      `${fieldLabel} must use http or https.`,
      400,
      {
        [fieldName]:
          `${fieldLabel} must use http or https.`,
      },
    );
  }

  return cleanValue;
}

function cleanObjectId(
  value,
  fieldName,
  fieldLabel,
) {
  if (
    typeof value !== "string"
  ) {
    throw createHttpError(
      `${fieldLabel} must be a record ID.`,
      400,
      {
        [fieldName]:
          `Please select a valid ${fieldLabel}.`,
      },
    );
  }

  const cleanValue =
    value.trim();

  if (
    !mongoose.isValidObjectId(
      cleanValue,
    )
  ) {
    throw createHttpError(
      `Invalid ${fieldLabel}.`,
      400,
      {
        [fieldName]:
          `Please select a valid ${fieldLabel}.`,
      },
    );
  }

  return cleanValue;
}

function cleanScreenshots(
  value,
) {
  if (
    !Array.isArray(value)
  ) {
    throw createHttpError(
      "Screenshots must be an array.",
      400,
      {
        screenshots:
          "Screenshots must be an array.",
      },
    );
  }

  if (
    value.length >
    MAX_PACKAGE_DESIGN_SCREENSHOTS
  ) {
    throw createHttpError(
      `A design can contain at most ${MAX_PACKAGE_DESIGN_SCREENSHOTS} screenshots.`,
      400,
      {
        screenshots:
          `Use at most ${MAX_PACKAGE_DESIGN_SCREENSHOTS} screenshots.`,
      },
    );
  }

  const seenUrls = new Set();

  return value.map(
    (screenshot, index) => {
      if (
        !screenshot ||
        typeof screenshot !==
          "object" ||
        Array.isArray(screenshot)
      ) {
        throw createHttpError(
          `Screenshot ${index + 1} must be an object.`,
          400,
          {
            screenshots:
              `Screenshot ${index + 1} must be an object.`,
          },
        );
      }

      const unsupportedFields =
        Object.keys(
          screenshot,
        ).filter(
          (fieldName) =>
            !SCREENSHOT_FIELDS.has(
              fieldName,
            ),
        );

      if (
        unsupportedFields.length >
        0
      ) {
        throw createHttpError(
          `Screenshot ${index + 1} contains unsupported field${
            unsupportedFields.length ===
            1
              ? ""
              : "s"
          }: ${unsupportedFields.join(", ")}.`,
          400,
          {
            screenshots:
              `Screenshot ${index + 1} contains unsupported fields.`,
          },
        );
      }

      const url =
        cleanHttpUrl(
          screenshot.url,
          "screenshots",
          `Screenshot ${index + 1} URL`,
          {
            required: true,
          },
        );

      const normalizedUrl =
        url.toLowerCase();

      if (
        seenUrls.has(
          normalizedUrl,
        )
      ) {
        throw createHttpError(
          `Screenshot ${index + 1} duplicates another screenshot URL.`,
          400,
          {
            screenshots:
              "Screenshot URLs must be unique within a design.",
          },
        );
      }

      seenUrls.add(
        normalizedUrl,
      );

      const rawDevice =
        hasOwnProperty(
          screenshot,
          "device",
        )
          ? cleanString(
              screenshot.device,
              {
                fieldName:
                  "screenshots",
                fieldLabel:
                  `Screenshot ${index + 1} device`,
                required: true,
                maxLength: 20,
                singleLine: true,
              },
            ).toLowerCase()
          : "desktop";

      if (
        !PACKAGE_DESIGN_DEVICES.includes(
          rawDevice,
        )
      ) {
        throw createHttpError(
          `Screenshot ${index + 1} device is invalid.`,
          400,
          {
            screenshots:
              `Select one of: ${PACKAGE_DESIGN_DEVICES.join(", ")}.`,
          },
        );
      }

      return {
        url,
        alt: hasOwnProperty(
          screenshot,
          "alt",
        )
          ? cleanString(
              screenshot.alt,
              {
                fieldName:
                  "screenshots",
                fieldLabel:
                  `Screenshot ${index + 1} alt text`,
                maxLength: 220,
                singleLine: true,
              },
            )
          : "",
        device: rawDevice,
        order: hasOwnProperty(
          screenshot,
          "order",
        )
          ? cleanOrder(
              screenshot.order,
              "screenshots",
              `Screenshot ${index + 1} order`,
            )
          : index,
      };
    },
  );
}

function buildPayload(
  requestBody,
) {
  assertAllowedFields(
    requestBody,
  );

  const payload = {};

  if (
    hasOwnProperty(
      requestBody,
      "servicePackage",
    )
  ) {
    payload.servicePackage =
      cleanObjectId(
        requestBody.servicePackage,
        "servicePackage",
        "Service Package",
      );
  }

  if (
    hasOwnProperty(
      requestBody,
      "name",
    )
  ) {
    payload.name =
      cleanString(
        requestBody.name,
        {
          fieldName: "name",
          fieldLabel:
            "Design name",
          required: true,
          minLength: 2,
          maxLength: 140,
          singleLine: true,
        },
      );
  }

  if (
    hasOwnProperty(
      requestBody,
      "slug",
    )
  ) {
    const rawSlug =
      cleanString(
        requestBody.slug,
        {
          fieldName: "slug",
          fieldLabel:
            "Design slug",
          maxLength: 160,
          singleLine: true,
        },
      );

    payload.slug =
      createSlug(rawSlug);
  }

  if (
    hasOwnProperty(
      requestBody,
      "shortDescription",
    )
  ) {
    payload.shortDescription =
      cleanString(
        requestBody.shortDescription,
        {
          fieldName:
            "shortDescription",
          fieldLabel:
            "Short description",
          required: true,
          minLength: 10,
          maxLength: 500,
        },
      );
  }

  if (
    hasOwnProperty(
      requestBody,
      "description",
    )
  ) {
    payload.description =
      cleanString(
        requestBody.description,
        {
          fieldName:
            "description",
          fieldLabel:
            "Description",
          maxLength: 5000,
        },
      );
  }

  if (
    hasOwnProperty(
      requestBody,
      "thumbnailUrl",
    )
  ) {
    payload.thumbnailUrl =
      cleanHttpUrl(
        requestBody.thumbnailUrl,
        "thumbnailUrl",
        "Thumbnail URL",
      );
  }

  if (
    hasOwnProperty(
      requestBody,
      "thumbnailAlt",
    )
  ) {
    payload.thumbnailAlt =
      cleanString(
        requestBody.thumbnailAlt,
        {
          fieldName:
            "thumbnailAlt",
          fieldLabel:
            "Thumbnail alt text",
          maxLength: 220,
          singleLine: true,
        },
      );
  }

  if (
    hasOwnProperty(
      requestBody,
      "screenshots",
    )
  ) {
    payload.screenshots =
      cleanScreenshots(
        requestBody.screenshots,
      );
  }

  if (
    hasOwnProperty(
      requestBody,
      "liveDemoUrl",
    )
  ) {
    payload.liveDemoUrl =
      cleanHttpUrl(
        requestBody.liveDemoUrl,
        "liveDemoUrl",
        "Live demo URL",
      );
  }

  if (
    hasOwnProperty(
      requestBody,
      "liveDemoLabel",
    )
  ) {
    payload.liveDemoLabel =
      cleanString(
        requestBody.liveDemoLabel,
        {
          fieldName:
            "liveDemoLabel",
          fieldLabel:
            "Live demo label",
          maxLength: 80,
          singleLine: true,
        },
      );
  }

  if (
    hasOwnProperty(
      requestBody,
      "order",
    )
  ) {
    payload.order =
      cleanOrder(
        requestBody.order,
      );
  }

  if (
    hasOwnProperty(
      requestBody,
      "isDefault",
    )
  ) {
    payload.isDefault =
      cleanBoolean(
        requestBody.isDefault,
        "isDefault",
        "Default",
      );
  }

  if (
    hasOwnProperty(
      requestBody,
      "isFeatured",
    )
  ) {
    payload.isFeatured =
      cleanBoolean(
        requestBody.isFeatured,
        "isFeatured",
        "Featured",
      );
  }

  if (
    hasOwnProperty(
      requestBody,
      "isVisible",
    )
  ) {
    payload.isVisible =
      cleanBoolean(
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

function validateRecordId(
  value,
) {
  if (
    !mongoose.isValidObjectId(
      value,
    )
  ) {
    throw createHttpError(
      "Invalid Package Design ID.",
      400,
      {
        id:
          "Package Design ID must be a valid record ID.",
      },
    );
  }
}

function parseQueryText(
  query,
  fieldName,
  {
    maxLength = 200,
  } = {},
) {
  if (
    !hasOwnProperty(
      query,
      fieldName,
    )
  ) {
    return "";
  }

  const value =
    query[fieldName];

  if (
    typeof value !== "string"
  ) {
    throw createHttpError(
      `Query parameter "${fieldName}" must contain one text value.`,
      400,
      {
        [fieldName]:
          "Provide this query parameter once as a single text value.",
      },
    );
  }

  const cleanValue =
    value.trim();

  if (
    cleanValue.length >
    maxLength
  ) {
    throw createHttpError(
      `Query parameter "${fieldName}" is too long.`,
      400,
      {
        [fieldName]:
          `This query parameter cannot exceed ${maxLength} characters.`,
      },
    );
  }

  return cleanValue;
}

function parseObjectIdFilter(
  query,
  fieldName,
  fieldLabel,
) {
  if (
    !hasOwnProperty(
      query,
      fieldName,
    )
  ) {
    return "";
  }

  const value =
    parseQueryText(
      query,
      fieldName,
      {
        maxLength: 30,
      },
    );

  if (
    !mongoose.isValidObjectId(
      value,
    )
  ) {
    throw createHttpError(
      `Invalid ${fieldLabel.toLowerCase()} filter.`,
      400,
      {
        [fieldName]:
          `Please select a valid ${fieldLabel}.`,
      },
    );
  }

  return value;
}

function parseBooleanFilter(
  query,
  fieldName,
  fieldLabel,
) {
  if (
    !hasOwnProperty(
      query,
      fieldName,
    )
  ) {
    return undefined;
  }

  const value =
    parseQueryText(
      query,
      fieldName,
      {
        maxLength: 5,
      },
    );

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw createHttpError(
    `${fieldLabel} filter must be true or false.`,
    400,
    {
      [fieldName]:
        `${fieldLabel} filter must be true or false.`,
    },
  );
}

function parseGroupFilter(
  query,
) {
  if (
    !hasOwnProperty(
      query,
      "group",
    )
  ) {
    return "";
  }

  const value =
    parseQueryText(
      query,
      "group",
      {
        maxLength: 40,
      },
    ).toLowerCase();

  if (
    !SERVICE_PACKAGE_GROUPS.includes(
      value,
    )
  ) {
    throw createHttpError(
      "Invalid package group filter.",
      400,
      {
        group:
          `Select one of: ${SERVICE_PACKAGE_GROUPS.join(", ")}.`,
      },
    );
  }

  return value;
}

function escapeRegularExpression(
  value,
) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
}

function createAdminPackagePopulate() {
  return {
    path: "servicePackage",
    select: [
      "service",
      "group",
      "name",
      "slug",
      "pricingMode",
      "price",
      "currency",
      "billingCycle",
      "isVisible",
      "isFeatured",
      "order",
    ].join(" "),
    populate: {
      path: "service",
      select:
        "title slug isVisible order",
    },
  };
}

function sendPackageDesignError(
  error,
  res,
  next,
) {
  if (error?.code === 11000) {
    const keyPattern =
      error.keyPattern || {};

    if (
      keyPattern.identityKey
    ) {
      return res
        .status(409)
        .json({
          success: false,
          message:
            "A design with the same Service Package and name already exists.",
          fieldErrors: {
            name:
              "A design with this name already exists in the selected Service Package.",
          },
        });
    }

    if (
      keyPattern.isDefault
    ) {
      return res
        .status(409)
        .json({
          success: false,
          message:
            "This Service Package already has a default design.",
          fieldErrors: {
            isDefault:
              "Only one default design is allowed per Service Package.",
          },
        });
    }

    return res
      .status(409)
      .json({
        success: false,
        message:
          "A design with this slug already exists in the selected Service Package.",
        fieldErrors: {
          slug:
            "This design slug is already used in the selected Service Package.",
        },
      });
  }

  if (
    error?.name ===
    "ValidationError"
  ) {
    const fieldErrors = {};

    Object.entries(
      error.errors,
    ).forEach(
      ([
        fieldName,
        fieldError,
      ]) => {
        if (
          fieldName !==
          "identityKey"
        ) {
          fieldErrors[fieldName] =
            fieldError.message;
        }
      },
    );

    return res
      .status(400)
      .json({
        success: false,
        message:
          "Please correct the Package Design details.",
        fieldErrors,
      });
  }

  if (
    error?.name === "CastError"
  ) {
    const fieldName =
      String(
        error.path || "",
      ).trim();

    return res
      .status(400)
      .json({
        success: false,
        message:
          "A Package Design value or record ID is invalid.",
        fieldErrors:
          fieldName
            ? {
                [fieldName]:
                  "Please provide a valid value.",
              }
            : {},
      });
  }

  if (error?.statusCode) {
    return res
      .status(
        error.statusCode,
      )
      .json({
        success: false,
        message: error.message,
        fieldErrors:
          error.fieldErrors || {},
      });
  }

  return next(error);
}

async function getAdminPackageDesigns(
  req,
  res,
  next,
) {
  try {
    assertValidListQuery(
      req.query,
    );

    const filter = {};

    const search =
      parseQueryText(
        req.query,
        "search",
      );

    const servicePackage =
      parseObjectIdFilter(
        req.query,
        "servicePackage",
        "Service Package",
      );

    const service =
      parseObjectIdFilter(
        req.query,
        "service",
        "Service",
      );

    const group =
      parseGroupFilter(
        req.query,
      );

    const isVisible =
      parseBooleanFilter(
        req.query,
        "isVisible",
        "Visibility",
      );

    const isDefault =
      parseBooleanFilter(
        req.query,
        "isDefault",
        "Default",
      );

    const isFeatured =
      parseBooleanFilter(
        req.query,
        "isFeatured",
        "Featured",
      );

    if (search) {
      const safeSearch =
        escapeRegularExpression(
          search,
        );

      filter.$or = [
        {
          name: {
            $regex:
              safeSearch,
            $options: "i",
          },
        },
        {
          slug: {
            $regex:
              safeSearch,
            $options: "i",
          },
        },
        {
          shortDescription: {
            $regex:
              safeSearch,
            $options: "i",
          },
        },
        {
          description: {
            $regex:
              safeSearch,
            $options: "i",
          },
        },
        {
          liveDemoLabel: {
            $regex:
              safeSearch,
            $options: "i",
          },
        },
      ];
    }

    if (
      servicePackage ||
      service ||
      group
    ) {
      const packageFilter = {};

      if (servicePackage) {
        packageFilter._id =
          servicePackage;
      }

      if (service) {
        packageFilter.service =
          service;
      }

      if (group) {
        packageFilter.group =
          group;
      }

      const packages =
        await ServicePackage.find(
          packageFilter,
        )
          .select("_id")
          .lean();

      filter.servicePackage = {
        $in: packages.map(
          (record) =>
            record._id,
        ),
      };
    }

    if (
      isVisible !==
      undefined
    ) {
      filter.isVisible =
        isVisible;
    }

    if (
      isDefault !==
      undefined
    ) {
      filter.isDefault =
        isDefault;
    }

    if (
      isFeatured !==
      undefined
    ) {
      filter.isFeatured =
        isFeatured;
    }

    const records =
      await PackageDesign.find(
        filter,
      )
        .populate(
          createAdminPackagePopulate(),
        )
        .sort({
          servicePackage: 1,
          isDefault: -1,
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
    return sendPackageDesignError(
      error,
      res,
      next,
    );
  }
}

async function getAdminPackageDesignById(
  req,
  res,
  next,
) {
  try {
    validateRecordId(
      req.params.id,
    );

    const record =
      await PackageDesign.findById(
        req.params.id,
      )
        .populate(
          createAdminPackagePopulate(),
        )
        .lean();

    if (!record) {
      throw createHttpError(
        "Package Design not found.",
        404,
      );
    }

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    return sendPackageDesignError(
      error,
      res,
      next,
    );
  }
}

async function createAdminPackageDesign(
  req,
  res,
  next,
) {
  try {
    const requestBody =
      requireObjectBody(req);

    const recordData =
      buildPayload(
        requestBody,
      );

    if (
      !recordData.slug &&
      recordData.name
    ) {
      recordData.slug =
        createSlug(
          recordData.name,
        );
    }

    if (
      !recordData.servicePackage
    ) {
      throw createHttpError(
        "Related Service Package is required.",
        400,
        {
          servicePackage:
            "Please select an existing Service Package.",
        },
      );
    }

    recordData.createdBy =
      req.admin._id;
    recordData.updatedBy =
      req.admin._id;

    const record =
      await runPackageDesignParentTransaction(
        async (session) => {
          const guardResult =
            await acquirePackageDesignParentGuards(
              [
                recordData.servicePackage,
              ],
              session,
            );

          if (!guardResult.ok) {
            throw createHttpError(
              "Related Service Package not found.",
              404,
              {
                servicePackage:
                  "Please select an existing Service Package.",
              },
            );
          }

          if (
            recordData.isDefault ===
            true
          ) {
            await PackageDesign.updateMany(
              {
                servicePackage:
                  recordData.servicePackage,
                isDefault: true,
              },
              {
                $set: {
                  isDefault: false,
                  updatedBy:
                    req.admin._id,
                },
              },
              {
                session,
              },
            );
          }

          const [createdRecord] =
            await PackageDesign.create(
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
              type: "package-design",
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
      message:
        "Package Design created successfully.",
      data: record,
    });
  } catch (error) {
    return sendPackageDesignError(
      error,
      res,
      next,
    );
  }
}

async function updateAdminPackageDesign(
  req,
  res,
  next,
) {
  try {
    validateRecordId(
      req.params.id,
    );

    const requestBody =
      requireObjectBody(req);

    assertAllowedFields(
      requestBody,
    );

    if (
      Object.keys(
        requestBody,
      ).length === 0
    ) {
      throw createHttpError(
        "At least one Package Design field is required for updating.",
        400,
      );
    }

    const recordData =
      buildPayload(
        requestBody,
      );

    const record =
      await runPackageDesignParentTransaction(
        async (session) => {
          const existingRecord =
            await PackageDesign.findById(
              req.params.id,
            ).session(
              session,
            );

          if (!existingRecord) {
            throw createHttpError(
              "Package Design not found.",
              404,
            );
          }

          if (
            hasOwnProperty(
              recordData,
              "slug",
            ) &&
            !recordData.slug
          ) {
            recordData.slug =
              createSlug(
                recordData.name ||
                  existingRecord.name,
              );
          }

          if (
            hasOwnProperty(
              recordData,
              "slug",
            ) &&
            !recordData.slug
          ) {
            throw createHttpError(
              "Design slug cannot be empty.",
              400,
              {
                slug:
                  "Design slug cannot be empty.",
              },
            );
          }

          const currentPackageId =
            String(
              existingRecord.servicePackage,
            );

          const nextPackageId =
            hasOwnProperty(
              recordData,
              "servicePackage",
            )
              ? String(
                  recordData.servicePackage,
                )
              : currentPackageId;

          const guardResult =
            await acquirePackageDesignParentGuards(
              [
                currentPackageId,
                nextPackageId,
              ],
              session,
            );

          if (!guardResult.ok) {
            if (
              guardResult.missingServicePackageId ===
              nextPackageId
            ) {
              throw createHttpError(
                "Related Service Package not found.",
                404,
                {
                  servicePackage:
                    "Please select an existing Service Package.",
                },
              );
            }

            throw createHttpError(
              "The current related Service Package no longer exists.",
              409,
              {
                servicePackage:
                  "This design references a missing Service Package and cannot be updated until the relation is repaired.",
              },
            );
          }

          const previous = {
            servicePackage:
              existingRecord.servicePackage,
            isVisible:
              existingRecord.isVisible,
            isFeatured:
              existingRecord.isFeatured,
            order:
              existingRecord.order,
          };

          const finalIsDefault =
            hasOwnProperty(
              recordData,
              "isDefault",
            )
              ? recordData.isDefault
              : existingRecord.isDefault;

          if (
            finalIsDefault ===
            true
          ) {
            await PackageDesign.updateMany(
              {
                _id: {
                  $ne:
                    existingRecord._id,
                },
                servicePackage:
                  nextPackageId,
                isDefault: true,
              },
              {
                $set: {
                  isDefault: false,
                  updatedBy:
                    req.admin._id,
                },
              },
              {
                session,
              },
            );
          }

          existingRecord.set(
            recordData,
          );

          existingRecord.updatedBy =
            req.admin._id;

          await existingRecord.save(
            {
              session,
            },
          );

          const auditChangeSet =
            buildContentAuditChangeSet({
              previous,
              current: {
                servicePackage:
                  existingRecord.servicePackage,
                isVisible:
                  existingRecord.isVisible,
                isFeatured:
                  existingRecord.isFeatured,
                order:
                  existingRecord.order,
              },
              relationshipField:
                "servicePackage",
              relationshipAuditField:
                "servicePackageId",
            });

          await createAuditLog({
            actor: req.admin,
            category: "content",
            action: auditChangeSet.action,
            outcome: "success",
            resource: {
              type: "package-design",
              id: existingRecord._id,
              label: existingRecord.name,
              slug: existingRecord.slug,
            },
            changedFields:
              auditChangeSet.changedFields,
            changes:
              auditChangeSet.changes,
            request: req,
            session,
          });

          return existingRecord;
        },
      );

    return res.status(200).json({
      success: true,
      message:
        "Package Design updated successfully.",
      data: record,
    });
  } catch (error) {
    return sendPackageDesignError(
      error,
      res,
      next,
    );
  }
}

async function deleteAdminPackageDesign(
  req,
  res,
  next,
) {
  try {
    validateRecordId(
      req.params.id,
    );

    const deletedRecord =
      await runPackageDesignParentTransaction(
        async (session) => {
          const record =
            await PackageDesign.findById(
              req.params.id,
            )
              .select(
                "_id name slug servicePackage",
              )
              .session(
                session,
              );

          if (!record) {
            throw createHttpError(
              "Package Design not found.",
              404,
            );
          }

          const deleteResult =
            await PackageDesign.deleteOne(
              {
                _id:
                  record._id,
              },
              {
                session,
              },
            );

          if (
            deleteResult.deletedCount !==
            1
          ) {
            throw createHttpError(
              "Package Design not found.",
              404,
            );
          }

          await createAuditLog({
            actor: req.admin,
            category: "content",
            action: "delete",
            outcome: "success",
            resource: {
              type: "package-design",
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
      message:
        "Package Design permanently deleted.",
      data: {
        id:
          deletedRecord._id,
        name:
          deletedRecord.name,
        servicePackage:
          deletedRecord.servicePackage,
      },
    });
  } catch (error) {
    return sendPackageDesignError(
      error,
      res,
      next,
    );
  }
}

export {
  createAdminPackageDesign,
  deleteAdminPackageDesign,
  getAdminPackageDesignById,
  getAdminPackageDesigns,
  updateAdminPackageDesign,
};
