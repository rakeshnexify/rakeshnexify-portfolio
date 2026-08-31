import mongoose from "mongoose";

import Appointment, { APPOINTMENT_STATUSES } from "../models/Appointment.js";
import AdminUser from "../models/AdminUser.js";
import Lead from "../models/Lead.js";
import { createAuditLog } from "../services/auditLog.service.js";
import { createEventNotification } from "../services/notification.service.js";

const allowedListQueryFields = new Set([
  "page",
  "limit",
  "search",
  "status",
  "service",
  "assignedTo",
  "preferredDateFrom",
  "preferredDateTo",
  "scheduledFrom",
  "scheduledTo",
]);

const allowedUpdateFields = new Set([
  "status",
  "assignedTo",
  "scheduledAt",
  "adminNote",
  "cancellationReason",
]);

const allowedConversionFields = new Set([
  "priority",
  "estimatedValue",
  "currency",
  "assignedTo",
  "nextFollowUpAt",
]);

const LEAD_PRIORITIES = ["low", "medium", "high", "urgent"];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const ISO_WITH_TIMEZONE_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|([+-])(\d{2}):(\d{2}))$/;

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function addFieldError(fieldErrors, fieldName, message) {
  if (!fieldErrors[fieldName]) {
    fieldErrors[fieldName] = message;
  }
}

function hasFieldErrors(fieldErrors) {
  return Object.keys(fieldErrors).length > 0;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isRealCalendarDate(value) {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const parsedDate = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === value
  );
}

function parseStrictIsoTimestamp(value) {
  if (typeof value !== "string") {
    return null;
  }

  const cleanedValue = value.trim();
  const match = cleanedValue.match(ISO_WITH_TIMEZONE_PATTERN);

  if (!match) {
    return null;
  }

  const [
    ,
    yearText,
    monthText,
    dayText,
    hourText,
    minuteText,
    secondText = "0",
    millisecondText = "0",
    zoneText,
    ,
    offsetHourText,
    offsetMinuteText,
  ] = match;

  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);

  const millisecond = Number(millisecondText.padEnd(3, "0"));

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59 ||
    second < 0 ||
    second > 59 ||
    millisecond < 0 ||
    millisecond > 999
  ) {
    return null;
  }

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  if (day > daysInMonth) {
    return null;
  }

  if (zoneText !== "Z") {
    const offsetHour = Number(offsetHourText);
    const offsetMinute = Number(offsetMinuteText);

    if (
      offsetHour < 0 ||
      offsetHour > 23 ||
      offsetMinute < 0 ||
      offsetMinute > 59
    ) {
      return null;
    }
  }

  const parsedDate = new Date(cleanedValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

function parseDateOrStrictIsoTimestamp(value) {
  if (typeof value !== "string") {
    return null;
  }

  const cleanedValue = value.trim();

  if (DATE_PATTERN.test(cleanedValue)) {
    if (!isRealCalendarDate(cleanedValue)) {
      return null;
    }

    return new Date(`${cleanedValue}T00:00:00.000Z`);
  }

  return parseStrictIsoTimestamp(cleanedValue);
}

function parsePositiveInteger(
  value,
  fieldName,
  fieldErrors,
  { defaultValue, maxValue },
) {
  if (value === undefined || value === "") {
    return defaultValue;
  }

  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    addFieldError(
      fieldErrors,
      fieldName,
      `${fieldName} must be a positive integer.`,
    );

    return defaultValue;
  }

  const parsedValue = Number(value);

  if (!Number.isSafeInteger(parsedValue) || parsedValue < 1) {
    addFieldError(
      fieldErrors,
      fieldName,
      `${fieldName} must be a positive integer.`,
    );

    return defaultValue;
  }

  if (maxValue && parsedValue > maxValue) {
    addFieldError(
      fieldErrors,
      fieldName,
      `${fieldName} cannot exceed ${maxValue}.`,
    );

    return defaultValue;
  }

  return parsedValue;
}

function parseNullableMoney(value, fieldName, fieldErrors) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  let parsedValue = value;

  if (typeof value === "string") {
    const cleanedValue = value.trim();

    if (!cleanedValue) {
      return null;
    }

    if (!/^\d+(?:\.\d+)?$/.test(cleanedValue)) {
      addFieldError(
        fieldErrors,
        fieldName,
        "Estimated value must be a non-negative decimal number.",
      );

      return null;
    }

    parsedValue = Number(cleanedValue);
  }

  if (
    typeof parsedValue !== "number" ||
    !Number.isFinite(parsedValue) ||
    parsedValue < 0
  ) {
    addFieldError(
      fieldErrors,
      fieldName,
      "Estimated value must be a non-negative number.",
    );

    return null;
  }

  return parsedValue;
}

function buildLeadRequirementSummary(appointment) {
  const projectSummary = String(appointment.projectSummary || "").trim();

  const message = String(appointment.message || "").trim();

  if (!message) {
    return projectSummary.slice(0, 5000);
  }

  const separator = "\n\nAdditional message:\n";

  const summary = projectSummary.slice(0, 5000);
  const remainingLength = 5000 - summary.length - separator.length;

  if (remainingLength <= 0) {
    return summary;
  }

  return `${summary}${separator}${message.slice(0, remainingLength)}`;
}

function buildMongooseFieldErrors(error) {
  const fieldErrors = {};

  if (error?.name !== "ValidationError") {
    return fieldErrors;
  }

  Object.entries(error.errors || {}).forEach(([fieldName, fieldError]) => {
    fieldErrors[fieldName] = fieldError?.message || "This value is invalid.";
  });

  return fieldErrors;
}

async function resolveActiveAdmin(
  value,
  fieldName,
  fieldErrors,
  session = null,
) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string" || !mongoose.isValidObjectId(value.trim())) {
    addFieldError(
      fieldErrors,
      fieldName,
      "Please select a valid active Admin.",
    );

    return null;
  }

  let query = AdminUser.findOne({
    _id: value.trim(),
    isActive: true,
  })
    .select("_id name email role isActive")
    .lean();

  if (session) {
    query = query.session(session);
  }

  const admin = await query;

  if (!admin) {
    addFieldError(
      fieldErrors,
      fieldName,
      "Please select a valid active Admin.",
    );

    return null;
  }

  return admin;
}

function objectIdValuesMatch(
  first,
  second,
) {
  const firstValue =
    first
      ? String(first)
      : "";

  const secondValue =
    second
      ? String(second)
      : "";

  return firstValue === secondValue;
}

function dateValuesMatch(
  first,
  second,
) {
  const firstValue =
    first
      ? new Date(first).getTime()
      : null;

  const secondValue =
    second
      ? new Date(second).getTime()
      : null;

  return firstValue === secondValue;
}

function buildAppointmentAuditChangeSet({
  previousStatus,
  nextStatus,
  previousAssignedTo,
  nextAssignedTo,
  previousScheduledAt,
  nextScheduledAt,
}) {
  const changedFields = [];
  const changes = {};

  if (previousStatus !== nextStatus) {
    changedFields.push("status");
    changes.status = {
      from: previousStatus,
      to: nextStatus,
    };
  }

  if (
    !objectIdValuesMatch(
      previousAssignedTo,
      nextAssignedTo,
    )
  ) {
    changedFields.push("assignedTo");
    changes.assignedTo = {
      from:
        previousAssignedTo || null,
      to:
        nextAssignedTo || null,
    };
  }

  if (
    !dateValuesMatch(
      previousScheduledAt,
      nextScheduledAt,
    )
  ) {
    changedFields.push("scheduledAt");
    changes.scheduledAt = {
      from:
        previousScheduledAt || null,
      to:
        nextScheduledAt || null,
    };
  }

  let action = "update";

  if (
    changedFields.includes(
      "status",
    )
  ) {
    action = "status-change";
  } else if (
    changedFields.includes(
      "assignedTo",
    )
  ) {
    action =
      "assignment-change";
  }

  return {
    action,
    changedFields,
    changes,
  };
}

function populateAppointmentDetail(query) {
  return query
    .populate({
      path: "service",
      select: "_id title slug isVisible",
    })
    .populate({
      path: "servicePackage",
      select: "_id name slug group isVisible",
    })
    .populate({
      path: "assignedTo",
      select: "_id name email role isActive",
    })
    .populate({
      path: "statusUpdatedBy",
      select: "_id name email role",
    });
}

async function getAdminAppointments(req, res, next) {
  try {
    const fieldErrors = {};

    Object.entries(req.query).forEach(([fieldName, fieldValue]) => {
      if (!allowedListQueryFields.has(fieldName)) {
        addFieldError(
          fieldErrors,
          fieldName,
          "This query parameter is not allowed.",
        );

        return;
      }

      if (typeof fieldValue !== "string" || Array.isArray(fieldValue)) {
        addFieldError(
          fieldErrors,
          fieldName,
          "This query parameter must occur once.",
        );
      }
    });

    const page = parsePositiveInteger(req.query.page, "page", fieldErrors, {
      defaultValue: 1,
      maxValue: 100000,
    });

    const limit = parsePositiveInteger(req.query.limit, "limit", fieldErrors, {
      defaultValue: 20,
      maxValue: 100,
    });

    let search = "";

    if (req.query.search !== undefined) {
      if (typeof req.query.search !== "string") {
        addFieldError(fieldErrors, "search", "Search must be a string.");
      } else {
        search = req.query.search.trim();

        if (search.length > 200) {
          addFieldError(
            fieldErrors,
            "search",
            "Search cannot exceed 200 characters.",
          );
        }
      }
    }

    let status = "";

    if (req.query.status !== undefined) {
      if (typeof req.query.status !== "string") {
        addFieldError(fieldErrors, "status", "Status must be a string.");
      } else {
        status = req.query.status.trim().toLowerCase();

        if (status && !APPOINTMENT_STATUSES.includes(status)) {
          addFieldError(
            fieldErrors,
            "status",
            "Please select a valid Appointment status.",
          );
        }
      }
    }

    let serviceId = "";

    if (req.query.service !== undefined) {
      if (
        typeof req.query.service !== "string" ||
        !mongoose.isValidObjectId(req.query.service.trim())
      ) {
        addFieldError(
          fieldErrors,
          "service",
          "Please provide a valid Service ID.",
        );
      } else {
        serviceId = req.query.service.trim();
      }
    }

    let assignedToId = "";

    if (req.query.assignedTo !== undefined) {
      if (
        typeof req.query.assignedTo !== "string" ||
        !mongoose.isValidObjectId(req.query.assignedTo.trim())
      ) {
        addFieldError(
          fieldErrors,
          "assignedTo",
          "Please provide a valid Admin ID.",
        );
      } else {
        assignedToId = req.query.assignedTo.trim();
      }
    }

    let preferredDateFrom = "";

    if (req.query.preferredDateFrom !== undefined) {
      if (
        typeof req.query.preferredDateFrom !== "string" ||
        !isRealCalendarDate(req.query.preferredDateFrom.trim())
      ) {
        addFieldError(
          fieldErrors,
          "preferredDateFrom",
          "Preferred date from must be a valid YYYY-MM-DD date.",
        );
      } else {
        preferredDateFrom = req.query.preferredDateFrom.trim();
      }
    }

    let preferredDateTo = "";

    if (req.query.preferredDateTo !== undefined) {
      if (
        typeof req.query.preferredDateTo !== "string" ||
        !isRealCalendarDate(req.query.preferredDateTo.trim())
      ) {
        addFieldError(
          fieldErrors,
          "preferredDateTo",
          "Preferred date to must be a valid YYYY-MM-DD date.",
        );
      } else {
        preferredDateTo = req.query.preferredDateTo.trim();
      }
    }

    if (
      preferredDateFrom &&
      preferredDateTo &&
      preferredDateFrom > preferredDateTo
    ) {
      addFieldError(
        fieldErrors,
        "preferredDateTo",
        "Preferred date to cannot be before preferred date from.",
      );
    }

    let scheduledFrom = null;

    if (req.query.scheduledFrom !== undefined) {
      scheduledFrom = parseStrictIsoTimestamp(req.query.scheduledFrom);

      if (!scheduledFrom) {
        addFieldError(
          fieldErrors,
          "scheduledFrom",
          "Scheduled from must be a valid ISO timestamp with Z or a UTC offset.",
        );
      }
    }

    let scheduledTo = null;

    if (req.query.scheduledTo !== undefined) {
      scheduledTo = parseStrictIsoTimestamp(req.query.scheduledTo);

      if (!scheduledTo) {
        addFieldError(
          fieldErrors,
          "scheduledTo",
          "Scheduled to must be a valid ISO timestamp with Z or a UTC offset.",
        );
      }
    }

    if (scheduledFrom && scheduledTo && scheduledFrom > scheduledTo) {
      addFieldError(
        fieldErrors,
        "scheduledTo",
        "Scheduled to cannot be before scheduled from.",
      );
    }

    if (hasFieldErrors(fieldErrors)) {
      return res.status(400).json({
        success: false,
        message: "Please correct the invalid Appointment filters.",
        fieldErrors,
      });
    }

    const query = {};

    if (status) {
      query.status = status;
    }

    if (serviceId) {
      query.service = serviceId;
    }

    if (assignedToId) {
      query.assignedTo = assignedToId;
    }

    if (preferredDateFrom || preferredDateTo) {
      query.preferredDate = {};

      if (preferredDateFrom) {
        query.preferredDate.$gte = preferredDateFrom;
      }

      if (preferredDateTo) {
        query.preferredDate.$lte = preferredDateTo;
      }
    }

    if (scheduledFrom || scheduledTo) {
      query.scheduledAt = {};

      if (scheduledFrom) {
        query.scheduledAt.$gte = scheduledFrom;
      }

      if (scheduledTo) {
        query.scheduledAt.$lte = scheduledTo;
      }
    }

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");

      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { companyName: searchRegex },
        { projectSummary: searchRegex },
        { serviceTitle: searchRegex },
        { servicePackageName: searchRegex },
      ];
    }

    const skip = (page - 1) * limit;

    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .sort({
          createdAt: -1,
          _id: -1,
        })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "service",
          select: "_id title slug",
        })
        .populate({
          path: "servicePackage",
          select: "_id name slug group",
        })
        .populate({
          path: "assignedTo",
          select: "_id name email role isActive",
        })
        .lean(),

      Appointment.countDocuments(query),
    ]);

    return res.json({
      success: true,
      count: appointments.length,
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
      data: appointments,
    });
  } catch (error) {
    return next(error);
  }
}

async function getAdminAppointmentById(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Appointment ID is invalid.",
        fieldErrors: {
          id: "Appointment ID is invalid.",
        },
      });
    }

    const appointment = await populateAppointmentDetail(
      Appointment.findById(req.params.id),
    ).lean();

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment was not found.",
      });
    }

    const linkedLead = await Lead.findOne({
      sourceAppointment: appointment._id,
    })
      .select("_id name subject status priority assignedTo createdAt")
      .populate({
        path: "assignedTo",
        select: "_id name email role",
      })
      .lean();

    return res.json({
      success: true,
      data: {
        ...appointment,
        linkedLead: linkedLead || null,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function updateAdminAppointment(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Appointment ID is invalid.",
      fieldErrors: {
        id: "Appointment ID is invalid.",
      },
    });
  }

  if (!isPlainObject(req.body)) {
    return res.status(400).json({
      success: false,
      message: "Appointment update data must be a valid object.",
      fieldErrors: {
        body: "Appointment update data must be a valid object.",
      },
    });
  }

  const fieldErrors = {};

  Object.keys(req.body).forEach((fieldName) => {
    if (!allowedUpdateFields.has(fieldName)) {
      addFieldError(fieldErrors, fieldName, "This field cannot be updated.");
    }
  });

  if (Object.keys(req.body).length === 0) {
    addFieldError(
      fieldErrors,
      "body",
      "At least one editable field is required.",
    );
  }

  if (hasFieldErrors(fieldErrors)) {
    return res.status(400).json({
      success: false,
      message: "Please correct the highlighted fields.",
      fieldErrors,
    });
  }

  const session = await mongoose.startSession();

  try {
    let outcome = null;
    let updatedAppointmentId = null;

    await session.withTransaction(async () => {
      const appointment = await Appointment.findById(req.params.id)
        .session(session);

      if (!appointment) {
        outcome = {
          type: "not-found",
        };

        return;
      }

      const previousStatus = appointment.status;
      const previousAssignedTo = appointment.assignedTo;
      const previousScheduledAt = appointment.scheduledAt;

      let nextStatus = appointment.status;
      let nextAssignedTo = appointment.assignedTo;
      let nextScheduledAt = appointment.scheduledAt;
      let nextAdminNote = appointment.adminNote || "";
      let nextCancellationReason = appointment.cancellationReason || "";

      if (hasOwn(req.body, "status")) {
        if (typeof req.body.status !== "string") {
          addFieldError(fieldErrors, "status", "Status must be a string.");
        } else {
          const cleanedStatus = req.body.status.trim().toLowerCase();

          if (!APPOINTMENT_STATUSES.includes(cleanedStatus)) {
            addFieldError(
              fieldErrors,
              "status",
              "Please select a valid Appointment status.",
            );
          } else {
            nextStatus = cleanedStatus;
          }
        }
      }

      if (hasOwn(req.body, "assignedTo")) {
        const assignedAdmin = await resolveActiveAdmin(
          req.body.assignedTo,
          "assignedTo",
          fieldErrors,
          session,
        );

        nextAssignedTo = assignedAdmin?._id || null;
      }

      if (hasOwn(req.body, "scheduledAt")) {
        const value = req.body.scheduledAt;

        if (value === null || value === "") {
          nextScheduledAt = null;
        } else {
          const parsedScheduledAt = parseStrictIsoTimestamp(value);

          if (!parsedScheduledAt) {
            addFieldError(
              fieldErrors,
              "scheduledAt",
              "Scheduled time must be a valid ISO timestamp with Z or a UTC offset.",
            );
          } else {
            nextScheduledAt = parsedScheduledAt;
          }
        }
      }

      if (hasOwn(req.body, "adminNote")) {
        if (typeof req.body.adminNote !== "string") {
          addFieldError(fieldErrors, "adminNote", "Admin note must be a string.");
        } else {
          nextAdminNote = req.body.adminNote.trim();

          if (nextAdminNote.length > 5000) {
            addFieldError(
              fieldErrors,
              "adminNote",
              "Admin note cannot exceed 5000 characters.",
            );
          }
        }
      }

      if (hasOwn(req.body, "cancellationReason")) {
        if (typeof req.body.cancellationReason !== "string") {
          addFieldError(
            fieldErrors,
            "cancellationReason",
            "Cancellation reason must be a string.",
          );
        } else {
          nextCancellationReason = req.body.cancellationReason.trim();

          if (nextCancellationReason.length > 2000) {
            addFieldError(
              fieldErrors,
              "cancellationReason",
              "Cancellation reason cannot exceed 2000 characters.",
            );
          }
        }
      }

      if (nextStatus === "requested" && nextScheduledAt) {
        addFieldError(
          fieldErrors,
          "scheduledAt",
          "A requested Appointment cannot have a confirmed schedule.",
        );
      }

      if (
        ["confirmed", "completed", "no-show"].includes(nextStatus) &&
        !nextScheduledAt
      ) {
        addFieldError(
          fieldErrors,
          "scheduledAt",
          `Scheduled time is required when status is ${nextStatus}.`,
        );
      }

      if (nextStatus === "declined" && nextScheduledAt) {
        addFieldError(
          fieldErrors,
          "scheduledAt",
          "A declined Appointment cannot have a scheduled time.",
        );
      }

      if (["cancelled", "declined"].includes(nextStatus)) {
        if (!nextCancellationReason) {
          addFieldError(
            fieldErrors,
            "cancellationReason",
            `A reason is required when status is ${nextStatus}.`,
          );
        }
      } else {
        nextCancellationReason = "";
      }

      const scheduledAtWasExplicitlyChanged = hasOwn(req.body, "scheduledAt");

      const transitionedToConfirmed =
        hasOwn(req.body, "status") &&
        nextStatus === "confirmed" &&
        appointment.status !== "confirmed";

      if (
        nextStatus === "confirmed" &&
        nextScheduledAt &&
        nextScheduledAt.getTime() < Date.now() &&
        (scheduledAtWasExplicitlyChanged || transitionedToConfirmed)
      ) {
        addFieldError(
          fieldErrors,
          "scheduledAt",
          "A confirmed Appointment cannot be scheduled in the past.",
        );
      }

      if (hasFieldErrors(fieldErrors)) {
        outcome = {
          type: "validation",
        };

        return;
      }

      const statusChanged = nextStatus !== appointment.status;

      appointment.status = nextStatus;
      appointment.assignedTo = nextAssignedTo;
      appointment.scheduledAt = nextScheduledAt;
      appointment.adminNote = nextAdminNote;
      appointment.cancellationReason = nextCancellationReason;

      if (statusChanged) {
        appointment.statusUpdatedAt = new Date();
        appointment.statusUpdatedBy = req.admin._id;
      }

      await appointment.save({
        session,
      });

      const auditChangeSet =
        buildAppointmentAuditChangeSet({
          previousStatus,
          nextStatus,
          previousAssignedTo,
          nextAssignedTo,
          previousScheduledAt,
          nextScheduledAt,
        });

      await createAuditLog({
        actor: req.admin,
        category: "workflow",
        action: auditChangeSet.action,
        outcome: "success",
        resource: {
          type: "appointment",
          id: appointment._id,
          label: "Consultation appointment",
        },
        changedFields:
          auditChangeSet.changedFields,
        changes:
          auditChangeSet.changes,
        request: req,
        session,
      });

      updatedAppointmentId = appointment._id;

      outcome = {
        type: "updated",
      };
    });

    if (outcome?.type === "not-found") {
      return res.status(404).json({
        success: false,
        message: "Appointment was not found.",
      });
    }

    if (outcome?.type === "validation") {
      return res.status(400).json({
        success: false,
        message: "Please correct the highlighted fields.",
        fieldErrors,
      });
    }

    const updatedAppointment = await populateAppointmentDetail(
      Appointment.findById(updatedAppointmentId),
    ).lean();

    return res.json({
      success: true,
      message: "Appointment updated successfully.",
      data: updatedAppointment,
    });
  } catch (error) {
    const mongooseFieldErrors = buildMongooseFieldErrors(error);

    if (hasFieldErrors(mongooseFieldErrors)) {
      return res.status(400).json({
        success: false,
        message: "Please correct the highlighted fields.",
        fieldErrors: mongooseFieldErrors,
      });
    }

    return next(error);
  } finally {
    await session.endSession();
  }
}

async function deleteAdminAppointment(req, res, next) {
  const session = await mongoose.startSession();

  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Appointment ID is invalid.",
        fieldErrors: {
          id: "Appointment ID is invalid.",
        },
      });
    }

    let outcome = null;

    await session.withTransaction(async () => {
      const appointment = await Appointment.findById(req.params.id)
        .select("_id")
        .session(session)
        .lean();

      if (!appointment) {
        outcome = {
          type: "not-found",
        };

        return;
      }

      const linkedLead = await Lead.findOne({
        sourceAppointment: appointment._id,
      })
        .select("_id")
        .session(session)
        .lean();

      if (linkedLead) {
        outcome = {
          type: "linked-lead",
        };

        return;
      }

      const deleteResult =
        await Appointment.deleteOne({
          _id: appointment._id,
        }).session(session);

      if (deleteResult.deletedCount !== 1) {
        outcome = {
          type: "not-found",
        };

        return;
      }

      await createAuditLog({
        actor: req.admin,
        category: "workflow",
        action: "delete",
        outcome: "success",
        resource: {
          type: "appointment",
          id: appointment._id,
          label: "Consultation appointment",
        },
        request: req,
        session,
      });

      outcome = {
        type: "deleted",
      };
    });

    if (outcome?.type === "not-found") {
      return res.status(404).json({
        success: false,
        message: "Appointment was not found.",
      });
    }

    if (outcome?.type === "linked-lead") {
      return res.status(409).json({
        success: false,
        message:
          "This Appointment cannot be deleted because it has already been converted to a Lead.",
        fieldErrors: {
          appointment:
            "Remove or resolve the linked Lead before deleting this Appointment.",
        },
      });
    }

    return res.json({
      success: true,
      message: "Appointment deleted successfully.",
    });
  } catch (error) {
    return next(error);
  } finally {
    await session.endSession();
  }
}

async function convertAppointmentToLead(req, res, next) {
  const session = await mongoose.startSession();

  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Appointment ID is invalid.",
        fieldErrors: {
          id: "Appointment ID is invalid.",
        },
      });
    }

    if (!isPlainObject(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Lead conversion data must be a valid object.",
        fieldErrors: {
          body: "Lead conversion data must be a valid object.",
        },
      });
    }

    const fieldErrors = {};

    Object.keys(req.body).forEach((fieldName) => {
      if (!allowedConversionFields.has(fieldName)) {
        addFieldError(
          fieldErrors,
          fieldName,
          "This field is not allowed during Lead conversion.",
        );
      }
    });

    let resultLead = null;
    let outcome = null;

    await session.withTransaction(async () => {
      const appointment = await Appointment.findById(req.params.id)
        .session(session)
        .lean();

      if (!appointment) {
        outcome = {
          type: "not-found",
        };

        return;
      }

      const existingLead = await Lead.findOne({
        sourceAppointment: appointment._id,
      })
        .select("_id")
        .session(session)
        .lean();

      if (existingLead) {
        outcome = {
          type: "duplicate",
        };

        return;
      }

      let assignedAdmin = null;

      if (hasOwn(req.body, "assignedTo")) {
        assignedAdmin = await resolveActiveAdmin(
          req.body.assignedTo,
          "assignedTo",
          fieldErrors,
          session,
        );
      }

      const leadPayload = {
        name: appointment.name,
        email: appointment.email || "",
        phone: appointment.phone || "",
        company: appointment.companyName || "",

        source: "appointment",
        sourceAppointment: appointment._id,

        service: appointment.service || null,
        serviceSlug: appointment.serviceSlug || "",
        serviceTitle: appointment.serviceTitle || "",

        subject: appointment.serviceTitle
          ? `Consultation request: ${appointment.serviceTitle}`
          : `Consultation request: ${appointment.name}`,

        requirementSummary: buildLeadRequirementSummary(appointment),

        status: "new",

        createdBy: req.admin._id,
        updatedBy: req.admin._id,
      };

      if (assignedAdmin) {
        leadPayload.assignedTo = assignedAdmin._id;
      }

      if (hasOwn(req.body, "priority")) {
        if (typeof req.body.priority !== "string") {
          addFieldError(fieldErrors, "priority", "Priority must be a string.");
        } else {
          const priority = req.body.priority.trim().toLowerCase();

          if (!LEAD_PRIORITIES.includes(priority)) {
            addFieldError(
              fieldErrors,
              "priority",
              "Priority must be low, medium, high, or urgent.",
            );
          } else {
            leadPayload.priority = priority;
          }
        }
      }

      if (hasOwn(req.body, "estimatedValue")) {
        const estimatedValue = parseNullableMoney(
          req.body.estimatedValue,
          "estimatedValue",
          fieldErrors,
        );

        if (!fieldErrors.estimatedValue) {
          leadPayload.estimatedValue = estimatedValue;
        }
      }

      if (hasOwn(req.body, "currency")) {
        if (typeof req.body.currency !== "string") {
          addFieldError(fieldErrors, "currency", "Currency must be a string.");
        } else {
          const currency = req.body.currency.trim().toUpperCase();

          if (!/^[A-Z]{3}$/.test(currency)) {
            addFieldError(
              fieldErrors,
              "currency",
              "Currency must be a three-letter code.",
            );
          } else {
            leadPayload.currency = currency;
          }
        }
      }

      if (hasOwn(req.body, "nextFollowUpAt")) {
        const value = req.body.nextFollowUpAt;

        if (value === null || value === "") {
          leadPayload.nextFollowUpAt = null;
        } else {
          const nextFollowUpAt = parseDateOrStrictIsoTimestamp(value);

          if (!nextFollowUpAt) {
            addFieldError(
              fieldErrors,
              "nextFollowUpAt",
              "Next follow-up must be a valid YYYY-MM-DD date or ISO timestamp with Z or a UTC offset.",
            );
          } else {
            leadPayload.nextFollowUpAt = nextFollowUpAt;
          }
        }
      }

      if (hasFieldErrors(fieldErrors)) {
        outcome = {
          type: "validation",
        };

        return;
      }

      /*
       * Conversion intentionally writes to the Appointment
       * inside the same transaction.
       *
       * This makes conversion and deletion contend on the
       * same Appointment document, preventing a concurrent
       * delete from leaving Lead.sourceAppointment dangling.
       */
      const appointmentTouchResult = await Appointment.updateOne(
        {
          _id: appointment._id,
        },
        {
          $set: {
            updatedAt: new Date(),
          },
        },
        {
          session,
        },
      );

      if (appointmentTouchResult.matchedCount !== 1) {
        outcome = {
          type: "not-found",
        };

        return;
      }

      const lead = new Lead(leadPayload);

      await lead.save({
        session,
      });

      await createEventNotification(
        {
          type: "lead",
          resource: lead,
        },
        {
          session,
        },
      );

      await createAuditLog({
        actor: req.admin,
        category: "workflow",
        action: "convert",
        outcome: "success",
        resource: {
          type: "appointment",
          id: appointment._id,
          label: "Consultation appointment",
        },
        metadata: {
          sourceResourceId:
            appointment._id,
          createdLeadId:
            lead._id,
        },
        request: req,
        session,
      });

      resultLead = lead.toObject();

      outcome = {
        type: "created",
      };
    });

    if (outcome?.type === "not-found") {
      return res.status(404).json({
        success: false,
        message: "Appointment was not found.",
      });
    }

    if (outcome?.type === "duplicate") {
      return res.status(409).json({
        success: false,
        message: "This Appointment has already been converted to a Lead.",
        fieldErrors: {
          sourceAppointment:
            "This Appointment has already been converted to a Lead.",
        },
      });
    }

    if (outcome?.type === "validation") {
      return res.status(400).json({
        success: false,
        message: "Please correct the highlighted fields.",
        fieldErrors,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Appointment converted to Lead successfully.",
      data: resultLead,
    });
  } catch (error) {
    if (
      error?.code === 11000 &&
      (error?.keyPattern?.sourceAppointment ||
        error?.keyValue?.sourceAppointment)
    ) {
      return res.status(409).json({
        success: false,
        message: "This Appointment has already been converted to a Lead.",
        fieldErrors: {
          sourceAppointment:
            "This Appointment has already been converted to a Lead.",
        },
      });
    }

    const fieldErrors = buildMongooseFieldErrors(error);

    if (hasFieldErrors(fieldErrors)) {
      return res.status(400).json({
        success: false,
        message: "Please correct the highlighted fields.",
        fieldErrors,
      });
    }

    return next(error);
  } finally {
    await session.endSession();
  }
}

export {
  convertAppointmentToLead,
  deleteAdminAppointment,
  getAdminAppointmentById,
  getAdminAppointments,
  updateAdminAppointment,
};
