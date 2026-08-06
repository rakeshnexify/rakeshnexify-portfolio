import mongoose from "mongoose";

import Education, {
  EDUCATION_TYPES,
  createEducationIdentityKey,
} from "../models/Education.js";

const editableStringFields = [
  "institutionName",
  "slug",
  "degree",
  "fieldOfStudy",
  "grade",
  "location",
  "shortDescription",
  "description",
  "institutionUrl",
  "certificateUrl",
  "logoUrl",
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

function createDefaultEducationSlug(educationData = {}) {
  const startDate = educationData.startDate
    ? new Date(educationData.startDate)
    : null;

  const startYear =
    startDate && !Number.isNaN(startDate.getTime())
      ? String(startDate.getUTCFullYear())
      : "";

  return createSlug(
    [
      educationData.institutionName,
      educationData.degree,
      educationData.fieldOfStudy,
      startYear,
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

function cleanEducationType(value) {
  const cleanValue = String(value || "")
    .trim()
    .toLowerCase();

  if (!EDUCATION_TYPES.includes(cleanValue)) {
    throw createHttpError("Invalid education type.", 400, {
      educationType: "Please select a supported education type.",
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

function buildEducationPayload(requestBody = {}) {
  if (!isPlainObject(requestBody)) {
    throw createHttpError(
      "Education request body must be a JSON object.",
      400,
      {
        body: "Education request body must be a JSON object.",
      },
    );
  }

  const payload = {};

  editableStringFields.forEach((fieldName) => {
    if (!hasOwnProperty(requestBody, fieldName)) {
      return;
    }

    const cleanValue = [
      "institutionName",
      "degree",
      "fieldOfStudy",
      "grade",
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

  if (hasOwnProperty(requestBody, "educationType")) {
    payload.educationType = cleanEducationType(requestBody.educationType);
  }

  if (hasOwnProperty(requestBody, "startDate")) {
    payload.startDate = cleanRequiredDate(requestBody.startDate, "startDate");
  }

  if (hasOwnProperty(requestBody, "endDate")) {
    payload.endDate = cleanOptionalDate(requestBody.endDate, "endDate");
  }

  if (hasOwnProperty(requestBody, "isCurrentlyStudying")) {
    payload.isCurrentlyStudying = cleanBoolean(
      requestBody.isCurrentlyStudying,
      "isCurrentlyStudying",
    );

    if (payload.isCurrentlyStudying) {
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

function validateEducationId(educationId) {
  if (!mongoose.isValidObjectId(educationId)) {
    throw createHttpError("Invalid Education ID.", 400);
  }
}

function hasCompleteIdentityFields(educationData) {
  const startDate = educationData?.startDate
    ? new Date(educationData.startDate)
    : null;

  return Boolean(
    cleanText(educationData?.institutionName) &&
      cleanText(educationData?.degree) &&
      cleanText(educationData?.fieldOfStudy) &&
      cleanText(educationData?.educationType) &&
      startDate &&
      !Number.isNaN(startDate.getTime()),
  );
}

async function ensureUniqueEducationIdentity(
  educationData,
  excludedEducationId = null,
) {
  if (!hasCompleteIdentityFields(educationData)) {
    return;
  }

  const filter = {
    identityKey: createEducationIdentityKey(educationData),
  };

  if (excludedEducationId) {
    filter._id = {
      $ne: excludedEducationId,
    };
  }

  const existingEducation = await Education.findOne(filter)
    .select("_id")
    .lean();

  if (existingEducation) {
    throw createHttpError(
      "The same Education record already exists.",
      409,
      {
        institutionName:
          "An Education record with the same institution, qualification, field, type and start date already exists.",
      },
    );
  }
}

function sendEducationError(error, res, next) {
  if (error?.code === 11000) {
    const duplicateDatabaseField =
      Object.keys(error.keyPattern || error.keyValue || {})[0] || "slug";

    const duplicateClientField =
      duplicateDatabaseField === "identityKey"
        ? "institutionName"
        : duplicateDatabaseField;

    return res.status(409).json({
      success: false,
      message: "An Education record with the same unique information exists.",
      fieldErrors: {
        [duplicateClientField]:
          duplicateClientField === "institutionName"
            ? "The same Education record already exists."
            : `An Education record with this ${duplicateClientField} already exists.`,
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
      message: "Please correct the Education details.",
      fieldErrors,
    });
  }

  if (error?.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "An Education value or record ID is invalid.",
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

async function getAdminEducation(req, res, next) {
  try {
    const filter = {};

    const search = String(req.query.search || "").trim();

    const educationType = String(req.query.educationType || "")
      .trim()
      .toLowerCase();

    const isVisible = parseBooleanQuery(req.query.isVisible, "isVisible");
    const isFeatured = parseBooleanQuery(req.query.isFeatured, "isFeatured");

    const isCurrentlyStudying = parseBooleanQuery(
      req.query.isCurrentlyStudying,
      "isCurrentlyStudying",
    );

    if (search) {
      const safeSearch = escapeRegularExpression(search);

      filter.$or = [
        {
          institutionName: {
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
          degree: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          fieldOfStudy: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          grade: {
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
      ];
    }

    if (educationType) {
      filter.educationType = cleanEducationType(educationType);
    }

    if (isVisible !== undefined) {
      filter.isVisible = isVisible;
    }

    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured;
    }

    if (isCurrentlyStudying !== undefined) {
      filter.isCurrentlyStudying = isCurrentlyStudying;
    }

    const educationRecords = await Education.find(filter)
      .sort({
        order: 1,
        startDate: -1,
        createdAt: 1,
        _id: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: educationRecords.length,
      data: educationRecords,
    });
  } catch (error) {
    return sendEducationError(error, res, next);
  }
}

async function getAdminEducationById(req, res, next) {
  try {
    validateEducationId(req.params.id);

    const education = await Education.findById(req.params.id).lean();

    if (!education) {
      throw createHttpError("Education record not found.", 404);
    }

    return res.status(200).json({
      success: true,
      data: education,
    });
  } catch (error) {
    return sendEducationError(error, res, next);
  }
}

async function createAdminEducation(req, res, next) {
  try {
    const educationData = buildEducationPayload(req.body);

    if (!educationData.slug) {
      educationData.slug = createDefaultEducationSlug(educationData);
    }

    await ensureUniqueEducationIdentity(educationData);

    educationData.createdBy = req.admin._id;
    educationData.updatedBy = req.admin._id;

    const education = await Education.create(educationData);

    return res.status(201).json({
      success: true,
      message: "Education record created successfully.",
      data: education,
    });
  } catch (error) {
    return sendEducationError(error, res, next);
  }
}

async function updateAdminEducation(req, res, next) {
  try {
    validateEducationId(req.params.id);

    const educationData = buildEducationPayload(req.body);

    if (Object.keys(educationData).length === 0) {
      throw createHttpError(
        "At least one Education field is required for updating.",
        400,
      );
    }

    const education = await Education.findById(req.params.id);

    if (!education) {
      throw createHttpError("Education record not found.", 404);
    }

    if (hasOwnProperty(educationData, "slug") && !educationData.slug) {
      educationData.slug = createDefaultEducationSlug({
        ...education.toObject(),
        ...educationData,
      });
    }

    if (hasOwnProperty(educationData, "slug") && !educationData.slug) {
      throw createHttpError("Education slug cannot be empty.", 400, {
        slug: "Education slug cannot be empty.",
      });
    }

    education.set(educationData);

    await ensureUniqueEducationIdentity(education, education._id);

    education.updatedBy = req.admin._id;

    await education.save();

    return res.status(200).json({
      success: true,
      message: "Education record updated successfully.",
      data: education,
    });
  } catch (error) {
    return sendEducationError(error, res, next);
  }
}

async function deleteAdminEducation(req, res, next) {
  try {
    validateEducationId(req.params.id);

    const deletedEducation = await Education.findByIdAndDelete(req.params.id);

    if (!deletedEducation) {
      throw createHttpError("Education record not found.", 404);
    }

    return res.status(200).json({
      success: true,
      message: "Education record permanently deleted.",
      data: {
        id: deletedEducation._id,
        institutionName: deletedEducation.institutionName,
        degree: deletedEducation.degree,
      },
    });
  } catch (error) {
    return sendEducationError(error, res, next);
  }
}

export {
  createAdminEducation,
  deleteAdminEducation,
  getAdminEducation,
  getAdminEducationById,
  updateAdminEducation,
};
