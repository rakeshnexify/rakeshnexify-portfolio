import mongoose from "mongoose";

import Project from "../models/Project.js";
import Testimonial from "../models/Testimonial.js";

const editableStringFields = [
  "clientName",
  "clientRole",
  "companyName",
  "reviewText",
  "profileImageUrl",
  "profileImageAlt",
  "companyWebsiteUrl",
];

const relatedProjectAdminFields = [
  "title",
  "slug",
  "shortDescription",
  "coverImageUrl",
  "category",
  "status",
  "isVisible",
].join(" ");

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

function requireJsonContentType(req) {
  if (!req.is("application/json")) {
    throw createHttpError(
      "Testimonial write requests must use application/json.",
      415,
      {
        body: "Send the Testimonial request body using application/json.",
      },
    );
  }
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
  const isSupportedScalar =
    typeof value === "number" || typeof value === "string";

  const hasNonEmptyStringValue =
    typeof value !== "string" || value.trim().length > 0;

  if (!isSupportedScalar || !hasNonEmptyStringValue) {
    throw createHttpError(`${fieldName} must be a non-negative number.`, 400, {
      [fieldName]: `${fieldName} must be a non-negative number.`,
    });
  }

  const numericOrder = Number(value);

  if (!Number.isFinite(numericOrder) || numericOrder < 0) {
    throw createHttpError(`${fieldName} must be a non-negative number.`, 400, {
      [fieldName]: `${fieldName} must be a non-negative number.`,
    });
  }

  return numericOrder;
}

function cleanRating(value, fieldName = "rating") {
  const numericRating = Number(value);

  if (
    !Number.isInteger(numericRating) ||
    numericRating < 1 ||
    numericRating > 5
  ) {
    throw createHttpError(
      `${fieldName} must be a whole number from 1 to 5.`,
      400,
      {
        [fieldName]: "Select a whole-number rating from 1 to 5.",
      },
    );
  }

  return numericRating;
}

function cleanOptionalObjectId(value, fieldName) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const objectId = String(value).trim();

  if (!mongoose.isValidObjectId(objectId)) {
    throw createHttpError(`${fieldName} must be a valid record ID.`, 400, {
      [fieldName]: "Please select a valid related Project.",
    });
  }

  return objectId;
}

function buildTestimonialPayload(requestBody = {}) {
  if (!isPlainObject(requestBody)) {
    throw createHttpError(
      "Testimonial request body must be a JSON object.",
      400,
      {
        body: "Testimonial request body must be a JSON object.",
      },
    );
  }

  const payload = {};

  editableStringFields.forEach((fieldName) => {
    if (!hasOwnProperty(requestBody, fieldName)) {
      return;
    }

    payload[fieldName] = [
      "clientName",
      "clientRole",
      "companyName",
      "profileImageAlt",
    ].includes(fieldName)
      ? normalizeSingleLineText(requestBody[fieldName])
      : cleanText(requestBody[fieldName]);
  });

  if (hasOwnProperty(requestBody, "rating")) {
    payload.rating = cleanRating(requestBody.rating);
  }

  if (hasOwnProperty(requestBody, "relatedProject")) {
    payload.relatedProject = cleanOptionalObjectId(
      requestBody.relatedProject,
      "relatedProject",
    );
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

function parseRatingQuery(value) {
  if (value === undefined || value === "") {
    return undefined;
  }

  return cleanRating(value, "rating");
}

function escapeRegularExpression(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validateTestimonialId(testimonialId) {
  if (!mongoose.isValidObjectId(testimonialId)) {
    throw createHttpError("Invalid Testimonial ID.", 400);
  }
}

async function validateRelatedProject(projectId) {
  if (!projectId) {
    return;
  }

  const projectExists = await Project.exists({
    _id: projectId,
  });

  if (!projectExists) {
    throw createHttpError("Related Project was not found.", 400, {
      relatedProject: "Please select an existing Project.",
    });
  }
}

async function populateRelatedProject(testimonial) {
  await testimonial.populate({
    path: "relatedProject",
    select: relatedProjectAdminFields,
  });

  return testimonial;
}

function sendTestimonialError(error, res, next) {
  if (error?.name === "ValidationError") {
    const fieldErrors = {};

    Object.entries(error.errors).forEach(([fieldName, fieldError]) => {
      fieldErrors[fieldName] = fieldError.message;
    });

    return res.status(400).json({
      success: false,
      message: "Please correct the Testimonial details.",
      fieldErrors,
    });
  }

  if (error?.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "A Testimonial value or related record ID is invalid.",
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

async function getAdminTestimonials(req, res, next) {
  try {
    const filter = {};

    const search = String(req.query.search || "").trim();
    const rating = parseRatingQuery(req.query.rating);
    const isVisible = parseBooleanQuery(req.query.isVisible, "isVisible");
    const isFeatured = parseBooleanQuery(req.query.isFeatured, "isFeatured");

    if (search) {
      const safeSearch = escapeRegularExpression(search);

      filter.$or = [
        {
          clientName: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          clientRole: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          companyName: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          reviewText: {
            $regex: safeSearch,
            $options: "i",
          },
        },
      ];
    }

    if (rating !== undefined) {
      filter.rating = rating;
    }

    if (isVisible !== undefined) {
      filter.isVisible = isVisible;
    }

    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured;
    }

    if (req.query.relatedProject !== undefined) {
      filter.relatedProject = cleanOptionalObjectId(
        req.query.relatedProject,
        "relatedProject",
      );
    }

    const testimonials = await Testimonial.find(filter)
      .populate({
        path: "relatedProject",
        select: relatedProjectAdminFields,
      })
      .sort({
        order: 1,
        createdAt: 1,
        _id: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: testimonials.length,
      data: testimonials,
    });
  } catch (error) {
    return sendTestimonialError(error, res, next);
  }
}

async function getAdminTestimonialById(req, res, next) {
  try {
    validateTestimonialId(req.params.id);

    const testimonial = await Testimonial.findById(req.params.id)
      .populate({
        path: "relatedProject",
        select: relatedProjectAdminFields,
      })
      .lean();

    if (!testimonial) {
      throw createHttpError("Testimonial record not found.", 404);
    }

    return res.status(200).json({
      success: true,
      data: testimonial,
    });
  } catch (error) {
    return sendTestimonialError(error, res, next);
  }
}

async function createAdminTestimonial(req, res, next) {
  try {
    requireJsonContentType(req);

    const testimonialData = buildTestimonialPayload(req.body);

    await validateRelatedProject(testimonialData.relatedProject);

    testimonialData.createdBy = req.admin._id;
    testimonialData.updatedBy = req.admin._id;

    const testimonial = await Testimonial.create(testimonialData);

    await populateRelatedProject(testimonial);

    return res.status(201).json({
      success: true,
      message: "Testimonial created successfully.",
      data: testimonial,
    });
  } catch (error) {
    return sendTestimonialError(error, res, next);
  }
}

async function updateAdminTestimonial(req, res, next) {
  try {
    requireJsonContentType(req);
    validateTestimonialId(req.params.id);

    const testimonialData = buildTestimonialPayload(req.body);

    if (Object.keys(testimonialData).length === 0) {
      throw createHttpError(
        "At least one Testimonial field is required for updating.",
        400,
      );
    }

    if (hasOwnProperty(testimonialData, "relatedProject")) {
      await validateRelatedProject(testimonialData.relatedProject);
    }

    testimonialData.updatedBy = req.admin._id;

    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      {
        $set: testimonialData,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!testimonial) {
      throw createHttpError("Testimonial record not found.", 404);
    }

    await populateRelatedProject(testimonial);

    return res.status(200).json({
      success: true,
      message: "Testimonial updated successfully.",
      data: testimonial,
    });
  } catch (error) {
    return sendTestimonialError(error, res, next);
  }
}

async function deleteAdminTestimonial(req, res, next) {
  try {
    validateTestimonialId(req.params.id);

    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);

    if (!testimonial) {
      throw createHttpError("Testimonial record not found.", 404);
    }

    return res.status(200).json({
      success: true,
      message: "Testimonial permanently deleted.",
      data: {
        id: testimonial._id,
        clientName: testimonial.clientName,
      },
    });
  } catch (error) {
    return sendTestimonialError(error, res, next);
  }
}

export {
  createAdminTestimonial,
  deleteAdminTestimonial,
  getAdminTestimonialById,
  getAdminTestimonials,
  updateAdminTestimonial,
};
