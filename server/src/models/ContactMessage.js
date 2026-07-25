import mongoose from "mongoose";

const serviceValues = [
  "mern-development",
  "wordpress-development",
  "ecommerce-development",
  "frontend-development",
  "backend-development",
  "website-maintenance",
];

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
      enum: {
        values: serviceValues,
        message: "Selected service is not valid.",
      },
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
      enum: ["new", "read", "replied", "archived"],
      default: "new",
      index: true,
    },

    source: {
      type: String,
      default: "portfolio-website",
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "contact_messages",
  },
);

const ContactMessage = mongoose.model(
  "ContactMessage",
  contactMessageSchema,
);

export default ContactMessage;