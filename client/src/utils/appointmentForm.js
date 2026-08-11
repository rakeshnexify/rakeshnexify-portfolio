const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const PHONE_PATTERN = /^\+?[0-9\s().-]+$/;

const APPOINTMENT_MEETING_TYPES = [
  "video-call",
  "phone-call",
];

const APPOINTMENT_FIELD_ORDER = [
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
];

function padDatePart(value) {
  return String(value).padStart(2, "0");
}

function getLocalToday() {
  const now = new Date();

  return [
    now.getFullYear(),
    padDatePart(now.getMonth() + 1),
    padDatePart(now.getDate()),
  ].join("-");
}

function getBrowserTimezone() {
  try {
    const timezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (
      typeof timezone === "string" &&
      timezone.trim() &&
      isValidTimezone(timezone)
    ) {
      return timezone.trim();
    }
  } catch {
    // Fall through to UTC.
  }

  return "UTC";
}

function createAppointmentInitialValues(
  overrides = {},
) {
  return {
    name: "",
    email: "",
    phone: "",
    companyName: "",
    service: "",
    servicePackage: "",
    preferredDate: "",
    preferredTime: "",
    timezone: getBrowserTimezone(),
    meetingType: "video-call",
    projectSummary: "",
    message: "",
    website: "",
    ...overrides,
  };
}

function normalizeString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeAppointmentValues(values = {}) {
  return {
    name: normalizeString(values.name),
    email: normalizeString(values.email).toLowerCase(),
    phone: normalizeString(values.phone),
    companyName: normalizeString(values.companyName),
    service: normalizeString(values.service),
    servicePackage: normalizeString(
      values.servicePackage,
    ),
    preferredDate: normalizeString(
      values.preferredDate,
    ),
    preferredTime: normalizeString(
      values.preferredTime,
    ),
    timezone: normalizeString(values.timezone),
    meetingType: normalizeString(
      values.meetingType,
    ).toLowerCase(),
    projectSummary: normalizeString(
      values.projectSummary,
    ),
    message: normalizeString(values.message),
    website: normalizeString(values.website),
  };
}

function isRealCalendarDate(value) {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const parsedDate = new Date(
    `${value}T00:00:00.000Z`,
  );

  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) ===
      value
  );
}

function isValidTimezone(value) {
  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone: value,
    });

    return true;
  } catch {
    return false;
  }
}

function isValidPhone(value) {
  if (!value) {
    return true;
  }

  if (!PHONE_PATTERN.test(value)) {
    return false;
  }

  const plusCount = (
    value.match(/\+/g) || []
  ).length;

  if (plusCount > 1) {
    return false;
  }

  if (
    plusCount === 1 &&
    !value.startsWith("+")
  ) {
    return false;
  }

  const digitCount = (
    value.match(/\d/g) || []
  ).length;

  return digitCount >= 7;
}

function getRecordId(record) {
  if (!record || typeof record !== "object") {
    return "";
  }

  return normalizeString(
    record._id || record.id,
  );
}

function getRelationId(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "object") {
    return normalizeString(
      value._id || value.id,
    );
  }

  return "";
}

function validateAppointmentValues(
  rawValues,
  {
    services = [],
    servicePackages = [],
  } = {},
) {
  const values =
    normalizeAppointmentValues(rawValues);

  const fieldErrors = {};

  if (!values.name) {
    fieldErrors.name = "Name is required.";
  } else if (values.name.length < 2) {
    fieldErrors.name =
      "Name must be at least 2 characters.";
  } else if (values.name.length > 100) {
    fieldErrors.name =
      "Name cannot exceed 100 characters.";
  }

  if (!values.email) {
    fieldErrors.email = "Email is required.";
  } else if (values.email.length > 254) {
    fieldErrors.email =
      "Email cannot exceed 254 characters.";
  } else if (!EMAIL_PATTERN.test(values.email)) {
    fieldErrors.email =
      "Please provide a valid email address.";
  }

  if (values.phone) {
    if (
      values.phone.length > 30 ||
      values.phone.length < 7 ||
      !isValidPhone(values.phone)
    ) {
      fieldErrors.phone =
        "Please provide a valid phone number.";
    }
  }

  if (
    values.meetingType === "phone-call" &&
    !values.phone
  ) {
    fieldErrors.phone =
      "Phone number is required for a phone-call consultation.";
  }

  if (values.companyName.length > 160) {
    fieldErrors.companyName =
      "Company name cannot exceed 160 characters.";
  }

  if (
    !APPOINTMENT_MEETING_TYPES.includes(
      values.meetingType,
    )
  ) {
    fieldErrors.meetingType =
      "Please select a valid meeting type.";
  }

  if (!values.preferredDate) {
    fieldErrors.preferredDate =
      "Preferred date is required.";
  } else if (
    !isRealCalendarDate(values.preferredDate)
  ) {
    fieldErrors.preferredDate =
      "Please select a valid preferred date.";
  } else if (
    values.preferredDate < getLocalToday()
  ) {
    fieldErrors.preferredDate =
      "Preferred date cannot be in the past.";
  }

  if (!values.preferredTime) {
    fieldErrors.preferredTime =
      "Preferred time is required.";
  } else if (
    !TIME_PATTERN.test(values.preferredTime)
  ) {
    fieldErrors.preferredTime =
      "Please select a valid preferred time.";
  }

  if (!values.timezone) {
    fieldErrors.timezone =
      "Timezone is required.";
  } else if (values.timezone.length > 100) {
    fieldErrors.timezone =
      "Timezone cannot exceed 100 characters.";
  } else if (!isValidTimezone(values.timezone)) {
    fieldErrors.timezone =
      "Please provide a valid IANA timezone.";
  }

  if (!values.projectSummary) {
    fieldErrors.projectSummary =
      "Project summary is required.";
  } else if (
    values.projectSummary.length < 10
  ) {
    fieldErrors.projectSummary =
      "Project summary must be at least 10 characters.";
  } else if (
    values.projectSummary.length > 5000
  ) {
    fieldErrors.projectSummary =
      "Project summary cannot exceed 5000 characters.";
  }

  if (values.message.length > 2000) {
    fieldErrors.message =
      "Message cannot exceed 2000 characters.";
  }

  if (values.service) {
    const selectedService = services.find(
      (service) =>
        getRecordId(service) === values.service,
    );

    if (!selectedService) {
      fieldErrors.service =
        "Please select an available Service.";
    }
  }

  if (values.servicePackage) {
    if (!values.service) {
      fieldErrors.servicePackage =
        "Please select a Service first.";
    } else {
      const selectedPackage =
        servicePackages.find(
          (servicePackage) =>
            getRecordId(servicePackage) ===
            values.servicePackage,
        );

      if (!selectedPackage) {
        fieldErrors.servicePackage =
          "Please select an available Service Package.";
      } else {
        const packageServiceId =
          getRelationId(
            selectedPackage.service,
          );

        if (
          packageServiceId &&
          packageServiceId !== values.service
        ) {
          fieldErrors.servicePackage =
            "The selected Service Package does not belong to this Service.";
        }
      }
    }
  }

  return {
    values,
    fieldErrors,
    isValid:
      Object.keys(fieldErrors).length === 0,
  };
}

function createAppointmentPayload(rawValues) {
  const values =
    normalizeAppointmentValues(rawValues);

  const payload = {
    name: values.name,
    email: values.email,
    phone: values.phone,
    companyName: values.companyName,
    preferredDate: values.preferredDate,
    preferredTime: values.preferredTime,
    timezone: values.timezone,
    meetingType: values.meetingType,
    projectSummary: values.projectSummary,
    message: values.message,
    website: values.website,
  };

  if (values.service) {
    payload.service = values.service;
  }

  if (values.servicePackage) {
    payload.servicePackage =
      values.servicePackage;
  }

  return payload;
}

function normalizeAppointmentFieldErrors(
  value,
) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  return Object.entries(value).reduce(
    (fieldErrors, [fieldName, message]) => {
      if (
        typeof message === "string" &&
        message.trim()
      ) {
        fieldErrors[fieldName] =
          message.trim();
      }

      return fieldErrors;
    },
    {},
  );
}

function getFirstAppointmentErrorField(
  fieldErrors,
) {
  if (
    !fieldErrors ||
    typeof fieldErrors !== "object"
  ) {
    return "";
  }

  return (
    APPOINTMENT_FIELD_ORDER.find(
      (fieldName) =>
        Boolean(fieldErrors[fieldName]),
    ) || ""
  );
}

export {
  APPOINTMENT_FIELD_ORDER,
  APPOINTMENT_MEETING_TYPES,
  createAppointmentInitialValues,
  createAppointmentPayload,
  getBrowserTimezone,
  getFirstAppointmentErrorField,
  getLocalToday,
  isRealCalendarDate,
  isValidTimezone,
  normalizeAppointmentFieldErrors,
  normalizeAppointmentValues,
  validateAppointmentValues,
};