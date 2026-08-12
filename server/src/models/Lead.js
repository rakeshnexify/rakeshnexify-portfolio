import mongoose from "mongoose";

const leadStatuses = [
  "new",
  "qualified",
  "contacted",
  "proposal",
  "negotiation",
  "won",
  "lost",
  "archived",
];

const leadPriorities = ["low", "medium", "high", "urgent"];

const leadNoteSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, "Lead note text is required."],
      trim: true,
      minlength: [1, "Lead note text is required."],
      maxlength: [3000, "Lead note cannot exceed 3000 characters."],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      default: null,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
    versionKey: false,
  },
);

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Lead name is required."],
      trim: true,
      minlength: [2, "Lead name must contain at least 2 characters."],
      maxlength: [100, "Lead name cannot exceed 100 characters."],
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [150, "Lead email cannot exceed 150 characters."],
      default: "",
      validate: {
        validator(value) {
          return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: "Please provide a valid lead email address.",
      },
    },

    phone: {
      type: String,
      trim: true,
      maxlength: [30, "Lead phone cannot exceed 30 characters."],
      default: "",
    },

    company: {
      type: String,
      trim: true,
      maxlength: [160, "Company name cannot exceed 160 characters."],
      default: "",
    },

    source: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [100, "Lead source cannot exceed 100 characters."],
      default: "manual",
    },

    sourceContactMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ContactMessage",
      default: null,
    },

    sourceAppointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },

    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      default: null,
    },

    serviceSlug: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [160, "Service slug cannot exceed 160 characters."],
      default: "",
      validate: {
        validator(value) {
          return !value || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
        },
        message:
          "Service slug can contain lowercase letters, numbers and hyphens only.",
      },
    },

    serviceTitle: {
      type: String,
      trim: true,
      maxlength: [150, "Service title cannot exceed 150 characters."],
      default: "",
    },

    subject: {
      type: String,
      required: [true, "Lead subject is required."],
      trim: true,
      minlength: [3, "Lead subject must contain at least 3 characters."],
      maxlength: [150, "Lead subject cannot exceed 150 characters."],
    },

    requirementSummary: {
      type: String,
      trim: true,
      maxlength: [5000, "Requirement summary cannot exceed 5000 characters."],
      default: "",
    },

    status: {
      type: String,
      enum: {
        values: leadStatuses,
        message: "Lead status is not valid.",
      },
      default: "new",
      index: true,
    },

    priority: {
      type: String,
      enum: {
        values: leadPriorities,
        message: "Lead priority is not valid.",
      },
      default: "medium",
      index: true,
    },

    estimatedValue: {
      type: Number,
      min: [0, "Estimated value cannot be negative."],
      default: null,
    },

    currency: {
      type: String,
      trim: true,
      uppercase: true,
      minlength: [3, "Currency must contain exactly 3 letters."],
      maxlength: [3, "Currency must contain exactly 3 letters."],
      match: [/^[A-Z]{3}$/, "Currency must use a 3-letter code."],
      default: "USD",
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      default: null,
    },

    nextFollowUpAt: {
      type: Date,
      default: null,
    },

    lastContactedAt: {
      type: Date,
      default: null,
    },

    lostReason: {
      type: String,
      trim: true,
      maxlength: [1000, "Lost reason cannot exceed 1000 characters."],
      default: "",
    },

    wonAt: {
      type: Date,
      default: null,
    },

    lostAt: {
      type: Date,
      default: null,
    },

    archivedAt: {
      type: Date,
      default: null,
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

    notes: {
      type: [leadNoteSchema],
      default: [],
    },

    order: {
      type: Number,
      min: [0, "Lead order cannot be negative."],
      default: 0,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "leads",
  },
);

leadSchema.index(
  {
    sourceContactMessage: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      sourceContactMessage: {
        $type: "objectId",
      },
    },
  },
);

leadSchema.index(
  {
    sourceAppointment: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      sourceAppointment: {
        $type: "objectId",
      },
    },
  },
);

leadSchema.index({
  status: 1,
  priority: 1,
  createdAt: -1,
});

leadSchema.index({
  assignedTo: 1,
  nextFollowUpAt: 1,
});

leadSchema.index({
  nextFollowUpAt: 1,
  status: 1,
});

leadSchema.index({
  service: 1,
  status: 1,
  createdAt: -1,
});

leadSchema.index({
  email: 1,
  createdAt: -1,
});

leadSchema.index({
  source: 1,
  createdAt: -1,
});

leadSchema.index({
  name: "text",
  email: "text",
  phone: "text",
  company: "text",
  subject: "text",
  requirementSummary: "text",
  serviceTitle: "text",
});

leadSchema.index({
  createdAt: -1,
});

const Lead = mongoose.models.Lead || mongoose.model("Lead", leadSchema);

export { leadPriorities, leadStatuses };

export default Lead;
