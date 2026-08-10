import mongoose from "mongoose";

import Service from "../models/Service.js";
import ServicePackage from "../models/ServicePackage.js";
import {
  acquireServicePackageParentGuards,
  runServicePackageParentTransaction,
} from "../services/servicePackageParentGuard.service.js";

const editableStringFields = [
  "title",
  "slug",
  "shortDescription",
  "description",
  "icon",
  "iconUrl",
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

function createSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanStringArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createHttpError(`${fieldName} must be an array.`, 400, {
      [fieldName]: `${fieldName} must be an array.`,
    });
  }

  return value.map((item) => String(item).trim()).filter(Boolean);
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

function cleanOrder(value) {
  const numericOrder = Number(value);

  if (!Number.isFinite(numericOrder) || numericOrder < 0) {
    throw createHttpError("Display order must be a non-negative number.", 400, {
      order: "Display order must be a non-negative number.",
    });
  }

  return numericOrder;
}

function buildSeoPayload(seoValue) {
  if (!seoValue || typeof seoValue !== "object" || Array.isArray(seoValue)) {
    throw createHttpError("SEO settings must be an object.", 400, {
      seo: "SEO settings must be an object.",
    });
  }

  const seo = {};

  if (hasOwnProperty(seoValue, "title")) {
    seo.title = String(seoValue.title || "").trim();
  }

  if (hasOwnProperty(seoValue, "description")) {
    seo.description = String(seoValue.description || "").trim();
  }

  if (hasOwnProperty(seoValue, "keywords")) {
    seo.keywords = cleanStringArray(seoValue.keywords, "seo.keywords");
  }

  return seo;
}

function buildServicePayload(requestBody = {}) {
  const payload = {};

  editableStringFields.forEach((fieldName) => {
    if (hasOwnProperty(requestBody, fieldName)) {
      payload[fieldName] = String(requestBody[fieldName] || "").trim();
    }
  });

  if (hasOwnProperty(requestBody, "features")) {
    payload.features = cleanStringArray(requestBody.features, "features");
  }

  if (hasOwnProperty(requestBody, "technologies")) {
    payload.technologies = cleanStringArray(
      requestBody.technologies,
      "technologies",
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

  if (hasOwnProperty(requestBody, "seo")) {
    payload.seo = buildSeoPayload(requestBody.seo);
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

function validateServiceId(serviceId) {
  if (!mongoose.isValidObjectId(serviceId)) {
    throw createHttpError("Invalid service ID.", 400);
  }
}

function sendServiceError(error, res, next) {
  if (error?.code === 11000) {
    const duplicateField =
      Object.keys(error.keyPattern || error.keyValue || {})[0] || "slug";

    return res.status(409).json({
      success: false,
      message: "A service with the same unique information already exists.",
      fieldErrors: {
        [duplicateField]: `A service with this ${duplicateField} already exists.`,
      },
    });
  }

  if (error?.name === "ValidationError") {
    const fieldErrors = {};

    Object.entries(error.errors).forEach(([fieldName, fieldError]) => {
      fieldErrors[fieldName] = fieldError.message;
    });

    return res.status(400).json({
      success: false,
      message: "Please correct the service details.",
      fieldErrors,
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

async function getAdminServices(req, res, next) {
  try {
    const filter = {};

    const search = String(req.query.search || "").trim();

    const isVisible = parseBooleanQuery(req.query.isVisible, "isVisible");

    const isFeatured = parseBooleanQuery(req.query.isFeatured, "isFeatured");

    if (search) {
      const safeSearch = escapeRegularExpression(search);

      filter.$or = [
        {
          title: {
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
          shortDescription: {
            $regex: safeSearch,
            $options: "i",
          },
        },
      ];
    }

    if (isVisible !== undefined) {
      filter.isVisible = isVisible;
    }

    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured;
    }

    const services = await Service.find(filter)
      .sort({
        order: 1,
        createdAt: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    return sendServiceError(error, res, next);
  }
}

async function getAdminServiceById(req, res, next) {
  try {
    validateServiceId(req.params.id);

    const service = await Service.findById(req.params.id).lean();

    if (!service) {
      throw createHttpError("Service not found.", 404);
    }

    return res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    return sendServiceError(error, res, next);
  }
}

async function createAdminService(req, res, next) {
  try {
    const serviceData = buildServicePayload(req.body);

    if (!serviceData.slug && serviceData.title) {
      serviceData.slug = createSlug(serviceData.title);
    }

    serviceData.createdBy = req.admin._id;
    serviceData.updatedBy = req.admin._id;

    const service = await Service.create(serviceData);

    return res.status(201).json({
      success: true,
      message: "Service created successfully.",
      data: service,
    });
  } catch (error) {
    return sendServiceError(error, res, next);
  }
}

async function updateAdminService(req, res, next) {
  try {
    validateServiceId(req.params.id);

    const serviceData = buildServicePayload(req.body);

    if (Object.keys(serviceData).length === 0) {
      throw createHttpError(
        "At least one service field is required for updating.",
        400,
      );
    }

    serviceData.updatedBy = req.admin._id;

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      {
        $set: serviceData,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedService) {
      throw createHttpError("Service not found.", 404);
    }

    return res.status(200).json({
      success: true,
      message: "Service updated successfully.",
      data: updatedService,
    });
  } catch (error) {
    return sendServiceError(error, res, next);
  }
}

async function deleteAdminService(req, res, next) {
  try {
    validateServiceId(req.params.id);

    const deletedService = await runServicePackageParentTransaction(
      async (session) => {
        const guardResult = await acquireServicePackageParentGuards(
          [req.params.id],
          session,
        );

        if (!guardResult.ok) {
          throw createHttpError("Service not found.", 404);
        }

        const service = await Service.findById(req.params.id)
          .select("_id title")
          .session(session)
          .lean();

        if (!service) {
          throw createHttpError("Service not found.", 404);
        }

        const referencedPackage = await ServicePackage.exists({
          service: service._id,
        }).session(session);

        if (referencedPackage) {
          throw createHttpError(
            "Service cannot be deleted while Service Packages reference it.",
            409,
            {
              servicePackages:
                "Delete or move the related Service Packages before deleting this Service.",
            },
          );
        }

        const deleteResult = await Service.deleteOne(
          {
            _id: service._id,
          },
          { session },
        );

        if (deleteResult.deletedCount !== 1) {
          throw createHttpError("Service not found.", 404);
        }

        return service;
      },
    );

    return res.status(200).json({
      success: true,
      message: "Service permanently deleted.",
      data: {
        id: deletedService._id,
        title: deletedService.title,
      },
    });
  } catch (error) {
    return sendServiceError(error, res, next);
  }
}

export {
  createAdminService,
  deleteAdminService,
  getAdminServiceById,
  getAdminServices,
  updateAdminService,
};
