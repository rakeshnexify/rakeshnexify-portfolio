import mongoose from "mongoose";

import ServiceOrder, {
  serviceOrderStatuses,
} from "../models/ServiceOrder.js";
import { createAuditLog } from "../services/auditLog.service.js";

const ALLOWED_LIST_QUERY_FIELDS = new Set([
  "search",
  "status",
  "group",
  "service",
  "page",
  "limit",
]);

const ALLOWED_UPDATE_FIELDS = new Set([
  "status",
  "adminNotes",
]);

function createHttpError(message, statusCode = 400, fieldErrors = {}) {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.fieldErrors = fieldErrors;

  return error;
}

function requireObjectBody(req) {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    throw createHttpError("A valid JSON object is required.", 400);
  }

  return req.body;
}

function escapeRegularExpression(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validateOrderId(value) {
  if (!mongoose.isValidObjectId(String(value || "").trim())) {
    throw createHttpError("Invalid Service Order ID.", 400, {
      id: "Please provide a valid Service Order ID.",
    });
  }
}

function assertAllowedFields(requestBody, allowedFields) {
  const unsupportedFields = Object.keys(requestBody).filter(
    (fieldName) => !allowedFields.has(fieldName),
  );

  if (unsupportedFields.length > 0) {
    throw createHttpError(
      `Unsupported Service Order field${unsupportedFields.length === 1 ? "" : "s"}: ${unsupportedFields.join(", ")}.`,
      400,
      Object.fromEntries(
        unsupportedFields.map((fieldName) => [
          fieldName,
          "This Service Order field cannot be updated here.",
        ]),
      ),
    );
  }
}

function assertValidListQuery(query) {
  const unsupportedFields = Object.keys(query || {}).filter(
    (fieldName) => !ALLOWED_LIST_QUERY_FIELDS.has(fieldName),
  );

  if (unsupportedFields.length > 0) {
    throw createHttpError(
      `Unsupported Service Order query parameter${unsupportedFields.length === 1 ? "" : "s"}: ${unsupportedFields.join(", ")}.`,
      400,
      Object.fromEntries(
        unsupportedFields.map((fieldName) => [
          fieldName,
          "This Service Order query parameter is not supported.",
        ]),
      ),
    );
  }

  Object.entries(query || {}).forEach(([fieldName, value]) => {
    if (typeof value !== "string") {
      throw createHttpError(
        `Service Order query parameter "${fieldName}" must contain one text value.`,
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
    maxLength = null,
  },
) {
  if (value === undefined || value === null) {
    if (required) {
      throw createHttpError(`${fieldLabel} is required.`, 400, {
        [fieldName]: `${fieldLabel} is required.`,
      });
    }

    return "";
  }

  if (typeof value !== "string") {
    throw createHttpError(`${fieldLabel} must be text.`, 400, {
      [fieldName]: `${fieldLabel} must be text.`,
    });
  }

  const cleanedValue = value.trim();

  if (required && !cleanedValue) {
    throw createHttpError(`${fieldLabel} is required.`, 400, {
      [fieldName]: `${fieldLabel} is required.`,
    });
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

function cleanPositiveInteger(value, fieldName, fallback, maximum) {
  if (value === undefined || value === "") {
    return fallback;
  }

  if (!/^\d+$/.test(String(value))) {
    throw createHttpError(
      `${fieldName} must be a positive whole number.`,
      400,
      {
        [fieldName]: `${fieldName} must be a positive whole number.`,
      },
    );
  }

  const numberValue = Number(value);

  if (!Number.isSafeInteger(numberValue) || numberValue < 1) {
    throw createHttpError(
      `${fieldName} must be a positive whole number.`,
      400,
      {
        [fieldName]: `${fieldName} must be a positive whole number.`,
      },
    );
  }

  return Math.min(numberValue, maximum);
}

function cleanStatus(value, { required = false } = {}) {
  const status = cleanString(value, {
    fieldName: "status",
    fieldLabel: "Status",
    required,
    maxLength: 40,
  }).toLowerCase();

  if (status && !serviceOrderStatuses.includes(status)) {
    throw createHttpError("Unsupported Service Order status.", 400, {
      status: "Please choose a supported Service Order status.",
    });
  }

  return status;
}

function createMongooseFieldErrors(error) {
  if (error?.name !== "ValidationError") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(error.errors || {}).map(([fieldName, fieldError]) => [
      fieldName,
      fieldError.message,
    ]),
  );
}

function sendServiceOrderError(error, res, next) {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      fieldErrors: error.fieldErrors || {},
    });
  }

  if (error?.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Please correct the Service Order fields and try again.",
      fieldErrors: createMongooseFieldErrors(error),
    });
  }

  return next(error);
}

async function getAdminServiceOrders(req, res, next) {
  try {
    assertValidListQuery(req.query);

    const page = cleanPositiveInteger(req.query.page, "page", 1, 100000);
    const limit = cleanPositiveInteger(req.query.limit, "limit", 20, 100);

    const filter = {};

    const search = cleanString(req.query.search, {
      fieldName: "search",
      fieldLabel: "Search",
      maxLength: 200,
    });

    const status = cleanStatus(req.query.status);

    const group = cleanString(req.query.group, {
      fieldName: "group",
      fieldLabel: "Package group",
      maxLength: 40,
    }).toLowerCase();

    if (group && !["development", "management"].includes(group)) {
      throw createHttpError("Unsupported package group.", 400, {
        group: "Choose development or management.",
      });
    }

    if (status) {
      filter.status = status;
    }

    if (group) {
      filter["packageSnapshot.group"] = group;
    }

    if (req.query.service) {
      if (!mongoose.isValidObjectId(req.query.service)) {
        throw createHttpError("Invalid Service filter.", 400, {
          service: "Please choose a valid Service.",
        });
      }

      filter.service = req.query.service;
    }

    if (search) {
      const expression = new RegExp(
        escapeRegularExpression(search),
        "i",
      );

      filter.$or = [
        {
          orderNumber: expression,
        },
        {
          customerName: expression,
        },
        {
          customerEmail: expression,
        },
        {
          customerPhone: expression,
        },
        {
          company: expression,
        },
        {
          "serviceSnapshot.title": expression,
        },
        {
          "packageSnapshot.name": expression,
        },
        {
          "designSnapshot.name": expression,
        },
      ];
    }

    const [orders, total] = await Promise.all([
      ServiceOrder.find(filter)
        .sort({
          createdAt: -1,
          _id: -1,
        })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ServiceOrder.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
      data: orders,
    });
  } catch (error) {
    return sendServiceOrderError(error, res, next);
  }
}

async function getAdminServiceOrderById(req, res, next) {
  try {
    validateOrderId(req.params.id);

    const order = await ServiceOrder.findById(req.params.id)
      .populate({
        path: "updatedBy",
        select: "_id name email role",
      })
      .lean();

    if (!order) {
      throw createHttpError("Service Order not found.", 404);
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    return sendServiceOrderError(error, res, next);
  }
}

async function updateAdminServiceOrder(req, res, next) {
  try {
    validateOrderId(req.params.id);

    const requestBody = requireObjectBody(req);

    assertAllowedFields(requestBody, ALLOWED_UPDATE_FIELDS);

    if (Object.keys(requestBody).length === 0) {
      throw createHttpError(
        "At least one Service Order field is required for update.",
        400,
      );
    }

    const session = await mongoose.startSession();

    try {
      let updatedOrderId = null;

      await session.withTransaction(async () => {
        const order = await ServiceOrder.findById(req.params.id)
          .session(session);

        if (!order) {
          throw createHttpError("Service Order not found.", 404);
        }

        const previousStatus = order.status;

        if (Object.prototype.hasOwnProperty.call(requestBody, "status")) {
          order.status = cleanStatus(requestBody.status, {
            required: true,
          });
        }

        if (Object.prototype.hasOwnProperty.call(requestBody, "adminNotes")) {
          order.adminNotes = cleanString(requestBody.adminNotes, {
            fieldName: "adminNotes",
            fieldLabel: "Admin notes",
            maxLength: 5000,
          });
        }

        order.updatedBy = req.admin._id;

        await order.save({
          session,
        });

        const statusChanged = previousStatus !== order.status;

        await createAuditLog({
          actor: req.admin,
          category: "workflow",
          action: statusChanged ? "status-change" : "update",
          outcome: "success",
          resource: {
            type: "service-order",
            id: order._id,
            label: `Service order ${order.orderNumber}`,
          },
          changedFields: statusChanged ? ["status"] : [],
          changes: statusChanged
            ? {
                status: {
                  from: previousStatus,
                  to: order.status,
                },
              }
            : {},
          request: req,
          session,
        });

        updatedOrderId = order._id;
      });

      const updatedOrder = await ServiceOrder.findById(updatedOrderId)
        .populate({
          path: "updatedBy",
          select: "_id name email role",
        })
        .lean();

      return res.status(200).json({
        success: true,
        message: "Service Order updated successfully.",
        data: updatedOrder,
      });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    return sendServiceOrderError(error, res, next);
  }
}

async function deleteAdminServiceOrder(req, res, next) {
  try {
    validateOrderId(req.params.id);

    const session = await mongoose.startSession();

    try {
      let deletedOrderSnapshot = null;

      await session.withTransaction(async () => {
        const order = await ServiceOrder.findById(req.params.id)
          .select("_id orderNumber customerName")
          .session(session)
          .lean();

        if (!order) {
          throw createHttpError("Service Order not found.", 404);
        }

        const deleteResult = await ServiceOrder.deleteOne({
          _id: order._id,
        }).session(session);

        if (deleteResult.deletedCount !== 1) {
          throw createHttpError("Service Order not found.", 404);
        }

        await createAuditLog({
          actor: req.admin,
          category: "workflow",
          action: "delete",
          outcome: "success",
          resource: {
            type: "service-order",
            id: order._id,
            label: `Service order ${order.orderNumber}`,
          },
          request: req,
          session,
        });

        deletedOrderSnapshot = order;
      });

      return res.status(200).json({
        success: true,
        message: "Service Order permanently deleted.",
        data: {
          id: deletedOrderSnapshot._id,
          orderNumber: deletedOrderSnapshot.orderNumber,
          customerName: deletedOrderSnapshot.customerName,
        },
      });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    return sendServiceOrderError(error, res, next);
  }
}

export {
  deleteAdminServiceOrder,
  getAdminServiceOrderById,
  getAdminServiceOrders,
  updateAdminServiceOrder,
};
