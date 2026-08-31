import mongoose from "mongoose";

import Appointment, {
  APPOINTMENT_MEETING_TYPES,
} from "../models/Appointment.js";
import Service from "../models/Service.js";
import ServicePackage from "../models/ServicePackage.js";
import { createEventNotificationSafely } from "../services/notification.service.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const PHONE_PATTERN = /^\+?[0-9\s().-]+$/;

const allowedCreateFields = new Set([
  "name",
  "email",
  "phone",
  "companyName",
  "service",
  "servicePackage",
  "preferredDate",
  "preferredTime",
  "timezone",
  "meetingType",
  "projectSummary",
  "message",
  "website",
]);

function isPlainBody(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value),
  );
}

function addFieldError(fieldErrors, fieldName, message) {
  if (!fieldErrors[fieldName]) {
    fieldErrors[fieldName] = message;
  }
}

function hasFieldErrors(fieldErrors) {
  return Object.keys(fieldErrors).length > 0;
}

function getRequiredString(
  body,
  fieldName,
  fieldErrors,
  {
    label,
    minLength = 1,
    maxLength,
    lowercase = false,
  },
) {
  const value = body[fieldName];

  if (typeof value !== "string") {
    addFieldError(
      fieldErrors,
      fieldName,
      `${label} must be a string.`,
    );

    return "";
  }

  let cleanedValue = value.trim();

  if (lowercase) {
    cleanedValue = cleanedValue.toLowerCase();
  }

  if (!cleanedValue) {
    addFieldError(
      fieldErrors,
      fieldName,
      `${label} is required.`,
    );

    return "";
  }

  if (cleanedValue.length < minLength) {
    addFieldError(
      fieldErrors,
      fieldName,
      `${label} must be at least ${minLength} characters.`,
    );
  }

  if (maxLength && cleanedValue.length > maxLength) {
    addFieldError(
      fieldErrors,
      fieldName,
      `${label} cannot exceed ${maxLength} characters.`,
    );
  }

  return cleanedValue;
}

function getOptionalString(
  body,
  fieldName,
  fieldErrors,
  {
    label,
    maxLength,
    lowercase = false,
  },
) {
  const value = body[fieldName];

  if (value === undefined) {
    return "";
  }

  if (typeof value !== "string") {
    addFieldError(
      fieldErrors,
      fieldName,
      `${label} must be a string.`,
    );

    return "";
  }

  let cleanedValue = value.trim();

  if (lowercase) {
    cleanedValue = cleanedValue.toLowerCase();
  }

  if (maxLength && cleanedValue.length > maxLength) {
    addFieldError(
      fieldErrors,
      fieldName,
      `${label} cannot exceed ${maxLength} characters.`,
    );
  }

  return cleanedValue;
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

function isValidTimeZone(value) {
  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone: value,
    });

    return true;
  } catch {
    return false;
  }
}

function getTodayInTimeZone(timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = {};

  parts.forEach((part) => {
    if (
      part.type === "year" ||
      part.type === "month" ||
      part.type === "day"
    ) {
      values[part.type] = part.value;
    }
  });

  return `${values.year}-${values.month}-${values.day}`;
}

function isValidPhone(value) {
  if (!value) {
    return true;
  }

  if (!PHONE_PATTERN.test(value)) {
    return false;
  }

  const plusCount = (value.match(/\+/g) || []).length;

  if (plusCount > 1) {
    return false;
  }

  if (plusCount === 1 && !value.startsWith("+")) {
    return false;
  }

  const digitCount = (value.match(/\d/g) || []).length;

  return digitCount >= 7;
}

function buildMongooseFieldErrors(error) {
  const fieldErrors = {};

  if (error?.name !== "ValidationError") {
    return fieldErrors;
  }

  Object.entries(error.errors || {}).forEach(
    ([fieldName, fieldError]) => {
      fieldErrors[fieldName] =
        fieldError?.message || "This value is invalid.";
    },
  );

  return fieldErrors;
}

async function createAppointment(req, res, next) {
  try {
    if (!isPlainBody(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Consultation request data must be a valid object.",
        fieldErrors: {
          body: "Consultation request data must be a valid object.",
        },
      });
    }

    const fieldErrors = {};

    Object.keys(req.body).forEach((fieldName) => {
      if (!allowedCreateFields.has(fieldName)) {
        addFieldError(
          fieldErrors,
          fieldName,
          "This field is not allowed.",
        );
      }
    });

    const website = getOptionalString(
      req.body,
      "website",
      fieldErrors,
      {
        label: "Website",
        maxLength: 500,
      },
    );

    if (hasFieldErrors(fieldErrors)) {
      return res.status(400).json({
        success: false,
        message: "Please correct the highlighted fields.",
        fieldErrors,
      });
    }

    if (website) {
      return res.status(201).json({
        success: true,
        message:
          "Your consultation request has been submitted successfully.",
        data: {
          status: "requested",
        },
      });
    }

    const name = getRequiredString(
      req.body,
      "name",
      fieldErrors,
      {
        label: "Name",
        minLength: 2,
        maxLength: 100,
      },
    );

    const email = getRequiredString(
      req.body,
      "email",
      fieldErrors,
      {
        label: "Email",
        maxLength: 254,
        lowercase: true,
      },
    );

    const phone = getOptionalString(
      req.body,
      "phone",
      fieldErrors,
      {
        label: "Phone",
        maxLength: 30,
      },
    );

    const companyName = getOptionalString(
      req.body,
      "companyName",
      fieldErrors,
      {
        label: "Company name",
        maxLength: 160,
      },
    );

    const preferredDate = getRequiredString(
      req.body,
      "preferredDate",
      fieldErrors,
      {
        label: "Preferred date",
        maxLength: 10,
      },
    );

    const preferredTime = getRequiredString(
      req.body,
      "preferredTime",
      fieldErrors,
      {
        label: "Preferred time",
        maxLength: 5,
      },
    );

    const timezone = getRequiredString(
      req.body,
      "timezone",
      fieldErrors,
      {
        label: "Timezone",
        maxLength: 100,
      },
    );

    const meetingType = getRequiredString(
      req.body,
      "meetingType",
      fieldErrors,
      {
        label: "Meeting type",
        maxLength: 30,
        lowercase: true,
      },
    );

    const projectSummary = getRequiredString(
      req.body,
      "projectSummary",
      fieldErrors,
      {
        label: "Project summary",
        minLength: 10,
        maxLength: 5000,
      },
    );

    const message = getOptionalString(
      req.body,
      "message",
      fieldErrors,
      {
        label: "Message",
        maxLength: 2000,
      },
    );

    if (email && !EMAIL_PATTERN.test(email)) {
      addFieldError(
        fieldErrors,
        "email",
        "Please provide a valid email address.",
      );
    }

    if (
      phone &&
      (phone.length < 7 || !isValidPhone(phone))
    ) {
      addFieldError(
        fieldErrors,
        "phone",
        "Please provide a valid phone number.",
      );
    }

    if (
      meetingType &&
      !APPOINTMENT_MEETING_TYPES.includes(meetingType)
    ) {
      addFieldError(
        fieldErrors,
        "meetingType",
        "Meeting type must be video-call or phone-call.",
      );
    }

    if (meetingType === "phone-call" && !phone) {
      addFieldError(
        fieldErrors,
        "phone",
        "Phone number is required for a phone-call consultation.",
      );
    }

    if (
      preferredDate &&
      !isRealCalendarDate(preferredDate)
    ) {
      addFieldError(
        fieldErrors,
        "preferredDate",
        "Preferred date must be a valid date in YYYY-MM-DD format.",
      );
    }

    if (
      preferredTime &&
      !TIME_PATTERN.test(preferredTime)
    ) {
      addFieldError(
        fieldErrors,
        "preferredTime",
        "Preferred time must use 24-hour HH:mm format.",
      );
    }

    const timezoneIsValid =
      Boolean(timezone) && isValidTimeZone(timezone);

    if (timezone && !timezoneIsValid) {
      addFieldError(
        fieldErrors,
        "timezone",
        "Please provide a valid IANA timezone.",
      );
    }

    if (
      preferredDate &&
      isRealCalendarDate(preferredDate) &&
      timezoneIsValid
    ) {
      const todayInSubmittedTimezone =
        getTodayInTimeZone(timezone);

      if (preferredDate < todayInSubmittedTimezone) {
        addFieldError(
          fieldErrors,
          "preferredDate",
          "Preferred date cannot be in the past.",
        );
      }
    }

    let serviceId = "";

    if (req.body.service !== undefined) {
      if (typeof req.body.service !== "string") {
        addFieldError(
          fieldErrors,
          "service",
          "Service must be a valid ID string.",
        );
      } else {
        serviceId = req.body.service.trim();

        if (
          serviceId &&
          !mongoose.isValidObjectId(serviceId)
        ) {
          addFieldError(
            fieldErrors,
            "service",
            "Please select a valid Service.",
          );
        }
      }
    }

    let servicePackageId = "";

    if (req.body.servicePackage !== undefined) {
      if (typeof req.body.servicePackage !== "string") {
        addFieldError(
          fieldErrors,
          "servicePackage",
          "Service package must be a valid ID string.",
        );
      } else {
        servicePackageId =
          req.body.servicePackage.trim();

        if (
          servicePackageId &&
          !mongoose.isValidObjectId(servicePackageId)
        ) {
          addFieldError(
            fieldErrors,
            "servicePackage",
            "Please select a valid Service Package.",
          );
        }
      }
    }

    if (servicePackageId && !serviceId) {
      addFieldError(
        fieldErrors,
        "servicePackage",
        "Please select the related Service before selecting a Service Package.",
      );
    }

    if (hasFieldErrors(fieldErrors)) {
      return res.status(400).json({
        success: false,
        message: "Please correct the highlighted fields.",
        fieldErrors,
      });
    }

    let selectedService = null;

    if (serviceId) {
      selectedService = await Service.findOne({
        _id: serviceId,
        isVisible: true,
      })
        .select("_id title slug isVisible")
        .lean();

      if (!selectedService) {
        return res.status(404).json({
          success: false,
          message:
            "The selected Service is not available.",
          fieldErrors: {
            service:
              "The selected Service is not available.",
          },
        });
      }
    }

    let selectedServicePackage = null;

    if (servicePackageId) {
      selectedServicePackage =
        await ServicePackage.findOne({
          _id: servicePackageId,
          service: selectedService._id,
          isVisible: true,
        })
          .select(
            "_id service name slug group isVisible",
          )
          .populate({
            path: "service",
            select: "_id title slug isVisible",
          })
          .lean();

      const packageParentService =
        selectedServicePackage?.service;

      if (
        !selectedServicePackage ||
        !packageParentService ||
        packageParentService.isVisible !== true ||
        String(packageParentService._id) !==
          String(selectedService._id)
      ) {
        return res.status(404).json({
          success: false,
          message:
            "The selected Service Package is not available for this Service.",
          fieldErrors: {
            servicePackage:
              "The selected Service Package is not available for this Service.",
          },
        });
      }
    }

    const appointment = await Appointment.create({
      name,
      email,
      phone,
      companyName,

      service: selectedService?._id || null,
      servicePackage:
        selectedServicePackage?._id || null,

      serviceTitle: selectedService?.title || "",
      serviceSlug: selectedService?.slug || "",

      servicePackageName:
        selectedServicePackage?.name || "",
      servicePackageSlug:
        selectedServicePackage?.slug || "",

      preferredDate,
      preferredTime,
      timezone,
      meetingType,
      projectSummary,
      message,

      status: "requested",
    });

    await createEventNotificationSafely({
      type: "appointment",
      resource: appointment,
    });

    return res.status(201).json({
      success: true,
      message:
        "Your consultation request has been submitted successfully.",
      data: {
        id: appointment._id,
        status: appointment.status,
        preferredDate: appointment.preferredDate,
        preferredTime: appointment.preferredTime,
        timezone: appointment.timezone,
        meetingType: appointment.meetingType,
        service: appointment.service,
        servicePackage: appointment.servicePackage,
        serviceTitle: appointment.serviceTitle,
        servicePackageName:
          appointment.servicePackageName,
        createdAt: appointment.createdAt,
      },
    });
  } catch (error) {
    const fieldErrors =
      buildMongooseFieldErrors(error);

    if (hasFieldErrors(fieldErrors)) {
      return res.status(400).json({
        success: false,
        message: "Please correct the highlighted fields.",
        fieldErrors,
      });
    }

    return next(error);
  }
}

export { createAppointment };