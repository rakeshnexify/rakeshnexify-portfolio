import mongoose from "mongoose";

const contactMessageStatuses = ["new", "read", "replied", "archived"];

const contactMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Full name is required."],
      trim: true,
      minlength: [2, "Full name must contain at least 2 characters."],
      maxlength: [80, "Full name cannot exceed 80 characters."],
    },

    email: {
      type: String,
      required: [true, "Email address is required."],
      trim: true,
      lowercase: true,
      maxlength: [120, "Email address cannot exceed 120 characters."],
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address.",
      ],
    },

    phone: {
      type: String,
      trim: true,
      maxlength: [30, "Phone number cannot exceed 30 characters."],
      default: "",
    },

    service: {
      type: String,
      required: [true, "Please select a service."],
      trim: true,
      lowercase: true,
      minlength: [2, "Service slug must contain at least 2 characters."],
      maxlength: [160, "Service slug cannot exceed 160 characters."],
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Service slug must contain lowercase letters, numbers and hyphens only.",
      ],
    },

    serviceTitle: {
      type: String,
      trim: true,
      maxlength: [150, "Service title cannot exceed 150 characters."],
      default: "",
    },

    subject: {
      type: String,
      required: [true, "Project subject is required."],
      trim: true,
      minlength: [3, "Project subject must contain at least 3 characters."],
      maxlength: [150, "Project subject cannot exceed 150 characters."],
    },

    message: {
      type: String,
      required: [true, "Project details are required."],
      trim: true,
      minlength: [20, "Project details must contain at least 20 characters."],
      maxlength: [5000, "Project details cannot exceed 5000 characters."],
    },

    status: {
      type: String,

      enum: {
        values: contactMessageStatuses,

        message: "Contact message status is not valid.",
      },

      default: "new",
    },

    source: {
      type: String,
      trim: true,
      maxlength: [100, "Message source cannot exceed 100 characters."],
      default: "portfolio-website",
    },

    adminNote: {
      type: String,
      trim: true,
      maxlength: [3000, "Admin note cannot exceed 3000 characters."],
      default: "",
    },

    readAt: {
      type: Date,
      default: null,
    },

    repliedAt: {
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
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "contact_messages",
  },
);

contactMessageSchema.index({
  status: 1,
  createdAt: -1,
});

contactMessageSchema.index({
  service: 1,
  createdAt: -1,
});

contactMessageSchema.index({
  email: 1,
  createdAt: -1,
});

contactMessageSchema.index({
  name: "text",
  email: "text",
  phone: "text",
  subject: "text",
  message: "text",
  serviceTitle: "text",
});

contactMessageSchema.index({
  createdAt: -1,
});

const ContactMessage =
  mongoose.models.ContactMessage ||
  mongoose.model("ContactMessage", contactMessageSchema);

export { contactMessageStatuses };

export default ContactMessage;
