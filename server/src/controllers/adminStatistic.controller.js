import mongoose from "mongoose";

import Statistic from "../models/Statistic.js";

const editableStringFields = [
  "key",
  "label",
  "value",
  "prefix",
  "suffix",
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

function createStatisticKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
    throw createHttpError(
      "Statistic display order must be a non-negative number.",
      400,
      {
        order: "Statistic display order must be a non-negative number.",
      },
    );
  }

  return numericOrder;
}

function buildStatisticPayload(requestBody = {}) {
  const payload = {};

  editableStringFields.forEach((fieldName) => {
    if (hasOwnProperty(requestBody, fieldName)) {
      payload[fieldName] = String(requestBody[fieldName] ?? "").trim();
    }
  });

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

function validateStatisticId(statisticId) {
  if (!mongoose.isValidObjectId(statisticId)) {
    throw createHttpError("Invalid statistic ID.", 400);
  }
}

function sendStatisticError(error, res, next) {
  if (error?.code === 11000) {
    const duplicateField =
      Object.keys(error.keyPattern || error.keyValue || {})[0] || "key";

    return res.status(409).json({
      success: false,

      message: "A statistic with the same unique information already exists.",

      fieldErrors: {
        [duplicateField]: `A statistic with this ${duplicateField} already exists.`,
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

      message: "Please correct the statistic details.",

      fieldErrors,
    });
  }

  if (error?.name === "CastError") {
    return res.status(400).json({
      success: false,

      message: "A statistic value has an invalid format.",

      fieldErrors: {
        [error.path || "statistic"]: "This value has an invalid format.",
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

async function getAdminStatistics(req, res, next) {
  try {
    const filter = {};

    const search = String(req.query.search || "").trim();

    const isVisible = parseBooleanQuery(req.query.isVisible, "isVisible");

    const isFeatured = parseBooleanQuery(req.query.isFeatured, "isFeatured");

    if (search) {
      const safeSearch = escapeRegularExpression(search);

      filter.$or = [
        {
          label: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          key: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          value: {
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

    if (isVisible !== undefined) {
      filter.isVisible = isVisible;
    }

    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured;
    }

    const statistics = await Statistic.find(filter)
      .sort({
        order: 1,
        createdAt: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,

      count: statistics.length,

      data: statistics,
    });
  } catch (error) {
    return sendStatisticError(error, res, next);
  }
}

async function getAdminStatisticById(req, res, next) {
  try {
    validateStatisticId(req.params.id);

    const statistic = await Statistic.findById(req.params.id).lean();

    if (!statistic) {
      throw createHttpError("Statistic not found.", 404);
    }

    return res.status(200).json({
      success: true,

      data: statistic,
    });
  } catch (error) {
    return sendStatisticError(error, res, next);
  }
}

async function createAdminStatistic(req, res, next) {
  try {
    const statisticData = buildStatisticPayload(req.body);

    if (!statisticData.key && statisticData.label) {
      statisticData.key = createStatisticKey(statisticData.label);
    }

    statisticData.createdBy = req.admin._id;
    statisticData.updatedBy = req.admin._id;

    const statistic = await Statistic.create(statisticData);

    return res.status(201).json({
      success: true,

      message: "Statistic created successfully.",

      data: statistic,
    });
  } catch (error) {
    return sendStatisticError(error, res, next);
  }
}

async function updateAdminStatistic(req, res, next) {
  try {
    validateStatisticId(req.params.id);

    const statisticData = buildStatisticPayload(req.body);

    if (Object.keys(statisticData).length === 0) {
      throw createHttpError(
        "At least one statistic field is required for updating.",
        400,
      );
    }

    statisticData.updatedBy = req.admin._id;

    const updatedStatistic = await Statistic.findByIdAndUpdate(
      req.params.id,
      {
        $set: statisticData,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedStatistic) {
      throw createHttpError("Statistic not found.", 404);
    }

    return res.status(200).json({
      success: true,

      message: "Statistic updated successfully.",

      data: updatedStatistic,
    });
  } catch (error) {
    return sendStatisticError(error, res, next);
  }
}

async function deleteAdminStatistic(req, res, next) {
  try {
    validateStatisticId(req.params.id);

    const deletedStatistic = await Statistic.findByIdAndDelete(req.params.id);

    if (!deletedStatistic) {
      throw createHttpError("Statistic not found.", 404);
    }

    return res.status(200).json({
      success: true,

      message: "Statistic permanently deleted.",

      data: {
        id: deletedStatistic._id,

        label: deletedStatistic.label,
      },
    });
  } catch (error) {
    return sendStatisticError(error, res, next);
  }
}

export {
  createAdminStatistic,
  deleteAdminStatistic,
  getAdminStatisticById,
  getAdminStatistics,
  updateAdminStatistic,
};
