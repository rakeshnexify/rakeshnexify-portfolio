import mongoose from "mongoose";

const APPOINTMENT_STATUSES = [
  "requested",
  "confirmed",
  "completed",
  "cancelled",
  "declined",
  "no-show",
];

const APPOINTMENT_MEETING_TYPES = ["video-call", "phone-call"];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PHONE_PATTERN = /^\+?[0-9\s().-]+$/;

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

function isValidPhone(value) {
  if (!value) {
    return true;
  }

  if (!PHONE_PATTERN.test(value)) {
    return false;
  }

  if (value.includes("+") && !value.startsWith("+")) {
    return false;
  }

  if ((value.match(/\+/g) || []).length > 1) {
    return false;
  }

  const digitCount = (value.match(/\d/g) || []).length;

  return digitCount >= 7;
}

const appointmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: EMAIL_PATTERN,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
      maxlength: 30,
      required() {
        return this.meetingType === "phone-call";
      },
      validate: {
        validator(value) {
          if (!value) {
            return this.meetingType !== "phone-call";
          }

          return value.length >= 7 && isValidPhone(value);
        },
        message: "Please provide a valid phone number.",
      },
    },

    companyName: {
      type: String,
      trim: true,
      default: "",
      maxlength: 160,
    },

    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      default: null,
    },

    servicePackage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServicePackage",
      default: null,
    },

    serviceTitle: {
      type: String,
      trim: true,
      default: "",
      maxlength: 150,
    },

    serviceSlug: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      maxlength: 160,
      validate: {
        validator(value) {
          return !value || SLUG_PATTERN.test(value);
        },
        message: "Service slug is invalid.",
      },
    },

    servicePackageName: {
      type: String,
      trim: true,
      default: "",
      maxlength: 180,
    },

    servicePackageSlug: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      maxlength: 180,
      validate: {
        validator(value) {
          return !value || SLUG_PATTERN.test(value);
        },
        message: "Service package slug is invalid.",
      },
    },

    preferredDate: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isRealCalendarDate,
        message: "Preferred date must be a valid date in YYYY-MM-DD format.",
      },
    },

    preferredTime: {
      type: String,
      required: true,
      trim: true,
      match: TIME_PATTERN,
    },

    timezone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      validate: {
        validator: isValidTimeZone,
        message: "Please provide a valid timezone.",
      },
    },

    meetingType: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      enum: APPOINTMENT_MEETING_TYPES,
    },

    projectSummary: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 5000,
    },

    message: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },

    status: {
      type: String,
      required: true,
      enum: APPOINTMENT_STATUSES,
      default: "requested",
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      default: null,
    },

    scheduledAt: {
      type: Date,
      default: null,
    },

    adminNote: {
      type: String,
      trim: true,
      default: "",
      maxlength: 5000,
    },

    cancellationReason: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },

    statusUpdatedAt: {
      type: Date,
      default: null,
    },

    statusUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "appointments",
  },
);

appointmentSchema.index({
  status: 1,
  createdAt: -1,
  _id: -1,
});

appointmentSchema.index({
  assignedTo: 1,
  status: 1,
  scheduledAt: 1,
});

appointmentSchema.index({
  service: 1,
  createdAt: -1,
});

appointmentSchema.index({
  preferredDate: 1,
  createdAt: -1,
});

appointmentSchema.index({
  createdAt: -1,
});

const Appointment = mongoose.model("Appointment", appointmentSchema);

export {
  APPOINTMENT_MEETING_TYPES,
  APPOINTMENT_STATUSES,
};

export default Appointment;