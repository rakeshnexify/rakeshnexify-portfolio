import mongoose from "mongoose";

import ContactMessage, {
  contactMessageStatuses,
} from "../models/ContactMessage.js";
import Lead from "../models/Lead.js";
import { createAuditLog } from "../services/auditLog.service.js";

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
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validateMessageId(messageId) {
  if (!mongoose.isValidObjectId(messageId)) {
    throw createHttpError("Invalid contact message ID.", 400);
  }
}

function cleanStatus(value) {
  const status = String(value || "")
    .trim()
    .toLowerCase();

  if (!contactMessageStatuses.includes(status)) {
    throw createHttpError("Invalid contact message status.", 400, {
      status: "Please select a valid message status.",
    });
  }

  return status;
}

function cleanAdminNote(value) {
  const adminNote = String(value || "").trim();

  if (adminNote.length > 3000) {
    throw createHttpError("Admin note cannot exceed 3000 characters.", 400, {
      adminNote: "Admin note cannot exceed 3000 characters.",
    });
  }

  return adminNote;
}

function cleanPageNumber(value, fallback = 1) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const page = Number(value);

  if (!Number.isInteger(page) || page < 1) {
    throw createHttpError("Page must be a positive integer.", 400);
  }

  return page;
}

function cleanLimit(value) {
  if (value === undefined || value === null || value === "") {
    return 20;
  }

  const limit = Number(value);

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw createHttpError("Limit must be between 1 and 100.", 400);
  }

  return limit;
}

function buildListFilter(query = {}) {
  const filter = {};

  const search = String(query.search || "").trim();

  const status = String(query.status || "")
    .trim()
    .toLowerCase();

  const service = String(query.service || "").trim();

  const source = String(query.source || "").trim();

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
        subject: {
          $regex: safeSearch,
          $options: "i",
        },
      },
      {
        message: {
          $regex: safeSearch,
          $options: "i",
        },
      },
      {
        service: {
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

  if (service) {
    const safeService = escapeRegularExpression(service);

    filter.$and = [
      ...(filter.$and || []),

      {
        $or: [
          {
            service: {
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
      },
    ];
  }

  if (source) {
    filter.source = {
      $regex: `^${escapeRegularExpression(source)}$`,

      $options: "i",
    };
  }

  return filter;
}

function createEmptyStatusCounts() {
  return contactMessageStatuses.reduce(
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
    if (contactMessageStatuses.includes(result._id)) {
      counts[result._id] = result.count;
    }
  });

  return counts;
}

function applyStatusMetadata(message, nextStatus, adminId) {
  if (message.status === nextStatus) {
    return;
  }

  const now = new Date();

  message.status = nextStatus;
  message.statusUpdatedAt = now;
  message.statusUpdatedBy = adminId;

  if (nextStatus === "new") {
    message.readAt = null;
    message.repliedAt = null;
    message.archivedAt = null;

    return;
  }

  if (nextStatus === "read") {
    message.readAt = message.readAt || now;

    message.archivedAt = null;

    return;
  }

  if (nextStatus === "replied") {
    message.readAt = message.readAt || now;

    message.repliedAt = now;
    message.archivedAt = null;

    return;
  }

  if (nextStatus === "archived") {
    message.archivedAt = now;
  }
}

function sendContactMessageError(error, res, next) {
  if (error?.name === "ValidationError") {
    const fieldErrors = {};

    Object.entries(error.errors).forEach(([fieldName, fieldError]) => {
      fieldErrors[fieldName] = fieldError.message;
    });

    return res.status(400).json({
      success: false,

      message: "Please correct the contact message details.",

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

async function getAdminContactMessages(req, res, next) {
  try {
    const filter = buildListFilter(req.query);

    const page = cleanPageNumber(req.query.page);

    const limit = cleanLimit(req.query.limit);

    const sortDirection = req.query.sort === "oldest" ? 1 : -1;

    const skip = (page - 1) * limit;

    const [messages, total, statusResults] = await Promise.all([
      ContactMessage.find(filter)
        .sort({
          createdAt: sortDirection,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      ContactMessage.countDocuments(filter),

      ContactMessage.aggregate([
        {
          $group: {
            _id: "$status",

            count: {
              $sum: 1,
            },
          },
        },
      ]),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return res.status(200).json({
      success: true,

      count: messages.length,

      total,

      page,

      limit,

      totalPages,

      statusCounts: buildStatusCounts(statusResults),

      data: messages,
    });
  } catch (error) {
    return sendContactMessageError(error, res, next);
  }
}

async function getAdminContactMessageById(req, res, next) {
  try {
    validateMessageId(req.params.id);

    const message = await ContactMessage.findById(req.params.id).lean();

    if (!message) {
      throw createHttpError("Contact message not found.", 404);
    }

    return res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    return sendContactMessageError(error, res, next);
  }
}

async function updateAdminContactMessage(req, res, next) {
  try {
    validateMessageId(req.params.id);

    const requestBody =
      req.body && typeof req.body === "object" && !Array.isArray(req.body)
        ? req.body
        : {};

    const hasStatus = hasOwnProperty(requestBody, "status");
    const hasAdminNote = hasOwnProperty(requestBody, "adminNote");

    if (!hasStatus && !hasAdminNote) {
      throw createHttpError(
        "Status or admin note is required for updating.",
        400,
      );
    }

    const session = await mongoose.startSession();

    try {
      let updatedMessage = null;

      await session.withTransaction(async () => {
        const message = await ContactMessage.findById(req.params.id)
          .session(session);

        if (!message) {
          throw createHttpError("Contact message not found.", 404);
        }

        const previousStatus = message.status;

        if (hasStatus) {
          const nextStatus = cleanStatus(requestBody.status);
          applyStatusMetadata(message, nextStatus, req.admin._id);
        }

        if (hasAdminNote) {
          message.adminNote = cleanAdminNote(requestBody.adminNote);
        }

        await message.save({
          session,
        });

        const statusChanged = previousStatus !== message.status;

        await createAuditLog({
          actor: req.admin,
          category: "workflow",
          action: statusChanged ? "status-change" : "update",
          outcome: "success",
          resource: {
            type: "contact-message",
            id: message._id,
            label: "Contact message",
          },
          changedFields: statusChanged ? ["status"] : [],
          changes: statusChanged
            ? {
                status: {
                  from: previousStatus,
                  to: message.status,
                },
              }
            : {},
          request: req,
          session,
        });

        updatedMessage = message.toObject();
      });

      return res.status(200).json({
        success: true,
        message: "Contact message updated successfully.",
        data: updatedMessage,
      });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    return sendContactMessageError(error, res, next);
  }
}

async function deleteAdminContactMessage(req, res, next) {
  try {
    validateMessageId(req.params.id);

    const session = await mongoose.startSession();

    try {
      let deletedMessageSnapshot = null;

      await session.withTransaction(async () => {
        const message = await ContactMessage.findById(req.params.id)
          .select("_id name email subject")
          .session(session)
          .lean();

        if (!message) {
          throw createHttpError("Contact message not found.", 404);
        }

        const linkedLead = await Lead.findOne({
          sourceContactMessage: message._id,
        })
          .select("_id")
          .session(session)
          .lean();

        if (linkedLead) {
          throw createHttpError(
            "This contact message cannot be deleted because it has already been converted to a Lead.",
            409,
            {
              contactMessage:
                "Remove or resolve the linked Lead before deleting this contact message.",
            },
          );
        }

        const deleteResult = await ContactMessage.deleteOne({
          _id: message._id,
        }).session(session);

        if (deleteResult.deletedCount !== 1) {
          throw createHttpError("Contact message not found.", 404);
        }

        await createAuditLog({
          actor: req.admin,
          category: "workflow",
          action: "delete",
          outcome: "success",
          resource: {
            type: "contact-message",
            id: message._id,
            label: "Contact message",
          },
          request: req,
          session,
        });

        deletedMessageSnapshot = message;
      });

      return res.status(200).json({
        success: true,
        message: "Contact message permanently deleted.",
        data: {
          id: deletedMessageSnapshot._id,
          name: deletedMessageSnapshot.name,
          email: deletedMessageSnapshot.email,
          subject: deletedMessageSnapshot.subject,
        },
      });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    return sendContactMessageError(error, res, next);
  }
}

export {
  deleteAdminContactMessage,
  getAdminContactMessageById,
  getAdminContactMessages,
  updateAdminContactMessage,
};
