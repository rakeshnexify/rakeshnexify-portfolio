import mongoose from "mongoose";

import Experience, {
  EMPLOYMENT_TYPES,
  EXPERIENCE_ARRAY_LIMITS,
  LOCATION_TYPES,
  createExperienceIdentityKey,
  normalizeExperienceStringArray,
} from "../models/Experience.js";

const editableStringFields = [
  "organizationName",
  "slug",
  "jobTitle",
  "location",
  "shortDescription",
  "description",
  "organizationLogoUrl",
  "organizationWebsiteUrl",
];

const editableArrayFields = [
  "responsibilities",
  "achievements",
  "skills",
  "tools",
];

function createHttpError(message, statusCode = 400, fieldErrors = {}) {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.fieldErrors = fieldErrors;

  return error;
}

function hasOwnProperty(object, property) {
  return Object.prototype.hasOwnProperty.call(object, property);
}

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeSingleLineText(value) {
  return cleanText(value).replace(/\s+/g, " ");
}

function createSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createDefaultExperienceSlug(experienceData = {}) {
  const startDate = experienceData.startDate
    ? new Date(experienceData.startDate)
    : null;

  const startDateKey =
    startDate && !Number.isNaN(startDate.getTime())
      ? startDate.toISOString().slice(0, 10)
      : "";

  return createSlug(
    [
      experienceData.organizationName,
      experienceData.jobTitle,
      startDateKey,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function cleanBoolean(value, fieldName) {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw createHttpError(`${fieldName} must be true or false.`, 400, {
    [fieldName]: `${fieldName} must be true or false.`,
  });
}

function cleanOrder(value, fieldName = "order") {
  const numericOrder = Number(value);

  if (!Number.isFinite(numericOrder) || numericOrder < 0) {
    throw createHttpError(`${fieldName} must be a non-negative number.`, 400, {
      [fieldName]: `${fieldName} must be a non-negative number.`,
    });
  }

  return numericOrder;
}

function cleanEmploymentType(value) {
  const cleanValue = String(value || "")
    .trim()
    .toLowerCase();

  if (!EMPLOYMENT_TYPES.includes(cleanValue)) {
    throw createHttpError("Invalid employment type.", 400, {
      employmentType: "Please select a supported employment type.",
    });
  }

  return cleanValue;
}

function cleanLocationType(value) {
  const cleanValue = String(value ?? "")
    .trim()
    .toLowerCase();

  if (!cleanValue) {
    return "";
  }

  if (!LOCATION_TYPES.includes(cleanValue)) {
    throw createHttpError("Invalid location type.", 400, {
      locationType: "Please select a supported location type.",
    });
  }

  return cleanValue;
}

function cleanRequiredDate(value, fieldName) {
  const cleanValue = String(value ?? "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanValue)) {
    throw createHttpError(
      `${fieldName} must use the YYYY-MM-DD format.`,
      400,
      {
        [fieldName]: "Enter a valid date using the YYYY-MM-DD format.",
      },
    );
  }

  const date = new Date(`${cleanValue}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== cleanValue
  ) {
    throw createHttpError(`${fieldName} must be a valid calendar date.`, 400, {
      [fieldName]: "Enter a real calendar date using the YYYY-MM-DD format.",
    });
  }

  return date;
}

function cleanOptionalDate(value, fieldName) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  return cleanRequiredDate(value, fieldName);
}

function cleanStringArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createHttpError(`${fieldName} must be an array of text values.`, 400, {
      [fieldName]: `${fieldName} must be an array of text values.`,
    });
  }

  const containsNonTextItem = value.some((item) => typeof item !== "string");

  if (containsNonTextItem) {
    throw createHttpError(
      `${fieldName} must contain text values only.`,
      400,
      {
        [fieldName]: `${fieldName} must contain text values only.`,
      },
    );
  }

  const normalizedItems = normalizeExperienceStringArray(value);
  const limits = EXPERIENCE_ARRAY_LIMITS[fieldName];

  if (normalizedItems.length > limits.maxItems) {
    throw createHttpError(
      `${fieldName} cannot contain more than ${limits.maxItems} items.`,
      400,
      {
        [fieldName]: `${fieldName} cannot contain more than ${limits.maxItems} items.`,
      },
    );
  }

  const oversizedItem = normalizedItems.find(
    (item) => item.length > limits.maxLength,
  );

  if (oversizedItem) {
    throw createHttpError(
      `Each ${fieldName} item cannot exceed ${limits.maxLength} characters.`,
      400,
      {
        [fieldName]: `Each ${fieldName} item cannot exceed ${limits.maxLength} characters.`,
      },
    );
  }

  return normalizedItems;
}

function buildExperiencePayload(requestBody = {}) {
  if (!isPlainObject(requestBody)) {
    throw createHttpError(
      "Experience request body must be a JSON object.",
      400,
      {
        body: "Experience request body must be a JSON object.",
      },
    );
  }

  const payload = {};

  editableStringFields.forEach((fieldName) => {
    if (!hasOwnProperty(requestBody, fieldName)) {
      return;
    }

    const cleanValue = [
      "organizationName",
      "jobTitle",
      "location",
    ].includes(fieldName)
      ? normalizeSingleLineText(requestBody[fieldName])
      : cleanText(requestBody[fieldName]);

    if (fieldName === "slug") {
      payload.slug = createSlug(cleanValue);
      return;
    }

    payload[fieldName] = cleanValue;
  });

  editableArrayFields.forEach((fieldName) => {
    if (!hasOwnProperty(requestBody, fieldName)) {
      return;
    }

    payload[fieldName] = cleanStringArray(
      requestBody[fieldName],
      fieldName,
    );
  });

  if (hasOwnProperty(requestBody, "employmentType")) {
    payload.employmentType = cleanEmploymentType(requestBody.employmentType);
  }

  if (hasOwnProperty(requestBody, "locationType")) {
    payload.locationType = cleanLocationType(requestBody.locationType);
  }

  if (hasOwnProperty(requestBody, "startDate")) {
    payload.startDate = cleanRequiredDate(requestBody.startDate, "startDate");
  }

  if (hasOwnProperty(requestBody, "endDate")) {
    payload.endDate = cleanOptionalDate(requestBody.endDate, "endDate");
  }

  if (hasOwnProperty(requestBody, "isCurrent")) {
    payload.isCurrent = cleanBoolean(requestBody.isCurrent, "isCurrent");

    if (payload.isCurrent) {
      payload.endDate = null;
    }
  }

  if (hasOwnProperty(requestBody, "order")) {
    payload.order = cleanOrder(requestBody.order);
  }

  if (hasOwnProperty(requestBody, "isFeatured")) {
    payload.isFeatured = cleanBoolean(requestBody.isFeatured, "isFeatured");
  }

  if (hasOwnProperty(requestBody, "isVisible")) {
    payload.isVisible = cleanBoolean(requestBody.isVisible, "isVisible");
  }

  return payload;
}

function parseBooleanQuery(value, fieldName) {
  if (value === undefined) {
    return undefined;
  }

  return cleanBoolean(value, fieldName);
}

function escapeRegularExpression(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validateExperienceId(experienceId) {
  if (!mongoose.isValidObjectId(experienceId)) {
    throw createHttpError("Invalid Experience ID.", 400);
  }
}

function hasCompleteIdentityFields(experienceData) {
  const startDate = experienceData?.startDate
    ? new Date(experienceData.startDate)
    : null;

  return Boolean(
    cleanText(experienceData?.organizationName) &&
      cleanText(experienceData?.jobTitle) &&
      cleanText(experienceData?.employmentType) &&
      startDate &&
      !Number.isNaN(startDate.getTime()),
  );
}

async function ensureUniqueExperienceIdentity(
  experienceData,
  excludedExperienceId = null,
) {
  if (!hasCompleteIdentityFields(experienceData)) {
    return;
  }

  const filter = {
    identityKey: createExperienceIdentityKey(experienceData),
  };

  if (excludedExperienceId) {
    filter._id = {
      $ne: excludedExperienceId,
    };
  }

  const existingExperience = await Experience.findOne(filter)
    .select("_id")
    .lean();

  if (existingExperience) {
    throw createHttpError(
      "The same Experience record already exists.",
      409,
      {
        organizationName:
          "An Experience record with the same organization, role, employment type and start date already exists.",
      },
    );
  }
}

function sendExperienceError(error, res, next) {
  if (error?.code === 11000) {
    const duplicateDatabaseField =
      Object.keys(error.keyPattern || error.keyValue || {})[0] || "slug";

    const duplicateClientField =
      duplicateDatabaseField === "identityKey"
        ? "organizationName"
        : duplicateDatabaseField;

    return res.status(409).json({
      success: false,
      message:
        "An Experience record with the same unique information exists.",
      fieldErrors: {
        [duplicateClientField]:
          duplicateClientField === "organizationName"
            ? "The same Experience record already exists."
            : `An Experience record with this ${duplicateClientField} already exists.`,
      },
    });
  }

  if (error?.name === "ValidationError") {
    const fieldErrors = {};

    Object.entries(error.errors).forEach(([fieldName, fieldError]) => {
      if (fieldName === "identityKey") {
        return;
      }

      fieldErrors[fieldName] = fieldError.message;
    });

    return res.status(400).json({
      success: false,
      message: "Please correct the Experience details.",
      fieldErrors,
    });
  }

  if (error?.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "An Experience value or record ID is invalid.",
      fieldErrors: {},
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

async function getAdminExperience(req, res, next) {
  try {
    const filter = {};

    const search = String(req.query.search || "").trim();

    const employmentType = String(req.query.employmentType || "")
      .trim()
      .toLowerCase();

    const isCurrent = parseBooleanQuery(req.query.isCurrent, "isCurrent");
    const isVisible = parseBooleanQuery(req.query.isVisible, "isVisible");
    const isFeatured = parseBooleanQuery(req.query.isFeatured, "isFeatured");

    if (search) {
      const safeSearch = escapeRegularExpression(search);

      filter.$or = [
        {
          organizationName: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          slug: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          jobTitle: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          location: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          shortDescription: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          description: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          responsibilities: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          achievements: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          skills: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          tools: {
            $regex: safeSearch,
            $options: "i",
          },
        },
      ];
    }

    if (employmentType) {
      filter.employmentType = cleanEmploymentType(employmentType);
    }

    if (isCurrent !== undefined) {
      filter.isCurrent = isCurrent;
    }

    if (isVisible !== undefined) {
      filter.isVisible = isVisible;
    }

    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured;
    }

    const experienceRecords = await Experience.find(filter)
      .sort({
        order: 1,
        startDate: -1,
        createdAt: 1,
        _id: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: experienceRecords.length,
      data: experienceRecords,
    });
  } catch (error) {
    return sendExperienceError(error, res, next);
  }
}

async function getAdminExperienceById(req, res, next) {
  try {
    validateExperienceId(req.params.id);

    const experience = await Experience.findById(req.params.id).lean();

    if (!experience) {
      throw createHttpError("Experience record not found.", 404);
    }

    return res.status(200).json({
      success: true,
      data: experience,
    });
  } catch (error) {
    return sendExperienceError(error, res, next);
  }
}

async function createAdminExperience(req, res, next) {
  try {
    const experienceData = buildExperiencePayload(req.body);

    if (!experienceData.slug) {
      experienceData.slug = createDefaultExperienceSlug(experienceData);
    }

    await ensureUniqueExperienceIdentity(experienceData);

    experienceData.createdBy = req.admin._id;
    experienceData.updatedBy = req.admin._id;

    const experience = await Experience.create(experienceData);

    return res.status(201).json({
      success: true,
      message: "Experience record created successfully.",
      data: experience,
    });
  } catch (error) {
    return sendExperienceError(error, res, next);
  }
}

async function updateAdminExperience(req, res, next) {
  try {
    validateExperienceId(req.params.id);

    const experienceData = buildExperiencePayload(req.body);

    if (Object.keys(experienceData).length === 0) {
      throw createHttpError(
        "At least one Experience field is required for updating.",
        400,
      );
    }

    const experience = await Experience.findById(req.params.id);

    if (!experience) {
      throw createHttpError("Experience record not found.", 404);
    }

    if (hasOwnProperty(experienceData, "slug") && !experienceData.slug) {
      experienceData.slug = createDefaultExperienceSlug({
        ...experience.toObject(),
        ...experienceData,
      });
    }

    if (hasOwnProperty(experienceData, "slug") && !experienceData.slug) {
      throw createHttpError("Experience slug cannot be empty.", 400, {
        slug: "Experience slug cannot be empty.",
      });
    }

    experience.set(experienceData);

    await ensureUniqueExperienceIdentity(experience, experience._id);

    experience.updatedBy = req.admin._id;

    await experience.save();

    return res.status(200).json({
      success: true,
      message: "Experience record updated successfully.",
      data: experience,
    });
  } catch (error) {
    return sendExperienceError(error, res, next);
  }
}

async function deleteAdminExperience(req, res, next) {
  try {
    validateExperienceId(req.params.id);

    const deletedExperience = await Experience.findByIdAndDelete(req.params.id);

    if (!deletedExperience) {
      throw createHttpError("Experience record not found.", 404);
    }

    return res.status(200).json({
      success: true,
      message: "Experience record permanently deleted.",
      data: {
        id: deletedExperience._id,
        organizationName: deletedExperience.organizationName,
        jobTitle: deletedExperience.jobTitle,
      },
    });
  } catch (error) {
    return sendExperienceError(error, res, next);
  }
}

export {
  createAdminExperience,
  deleteAdminExperience,
  getAdminExperience,
  getAdminExperienceById,
  updateAdminExperience,
};
