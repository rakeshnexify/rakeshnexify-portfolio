import mongoose from "mongoose";

const TESTIMONIAL_RATING_MIN = 1;
const TESTIMONIAL_RATING_MAX = 5;

function isValidHttpUrl(value) {
  const url = String(value ?? "").trim();

  if (!url) {
    return true;
  }

  try {
    const parsedUrl = new URL(url);

    return (
      ["http:", "https:"].includes(parsedUrl.protocol) &&
      Boolean(parsedUrl.hostname) &&
      !parsedUrl.username &&
      !parsedUrl.password
    );
  } catch {
    return false;
  }
}

const testimonialSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      required: [true, "Client name is required."],
      trim: true,
      minlength: [2, "Client name must contain at least 2 characters."],
      maxlength: [150, "Client name cannot exceed 150 characters."],
    },

    clientRole: {
      type: String,
      trim: true,
      maxlength: [150, "Client role cannot exceed 150 characters."],
      default: "",
    },

    companyName: {
      type: String,
      trim: true,
      maxlength: [180, "Company name cannot exceed 180 characters."],
      default: "",
    },

    reviewText: {
      type: String,
      required: [true, "Testimonial review is required."],
      trim: true,
      minlength: [
        10,
        "Testimonial review must contain at least 10 characters.",
      ],
      maxlength: [3000, "Testimonial review cannot exceed 3000 characters."],
    },

    rating: {
      type: Number,
      required: [true, "Testimonial rating is required."],
      min: [
        TESTIMONIAL_RATING_MIN,
        `Testimonial rating cannot be lower than ${TESTIMONIAL_RATING_MIN}.`,
      ],
      max: [
        TESTIMONIAL_RATING_MAX,
        `Testimonial rating cannot be higher than ${TESTIMONIAL_RATING_MAX}.`,
      ],
      validate: {
        validator: Number.isInteger,
        message: "Testimonial rating must be a whole number.",
      },
    },

    profileImageUrl: {
      type: String,
      trim: true,
      maxlength: [500, "Profile image URL cannot exceed 500 characters."],
      default: "",
      validate: {
        validator: isValidHttpUrl,
        message:
          "Profile image URL must be a complete http:// or https:// URL without login credentials.",
      },
    },

    profileImageAlt: {
      type: String,
      trim: true,
      maxlength: [
        200,
        "Profile image alternative text cannot exceed 200 characters.",
      ],
      default: "",
    },

    companyWebsiteUrl: {
      type: String,
      trim: true,
      maxlength: [500, "Company website URL cannot exceed 500 characters."],
      default: "",
      validate: {
        validator: isValidHttpUrl,
        message:
          "Company website URL must be a complete http:// or https:// URL without login credentials.",
      },
    },

    relatedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },

    order: {
      type: Number,
      min: [0, "Testimonial display order cannot be negative."],
      default: 0,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isVisible: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      required: [true, "Testimonial creator is required."],
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      required: [true, "Testimonial updater is required."],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "testimonials",
  },
);

testimonialSchema.index(
  {
    isVisible: 1,
    isFeatured: -1,
    order: 1,
    createdAt: 1,
    _id: 1,
  },
  {
    name: "testimonial_public_listing",
  },
);

testimonialSchema.index(
  {
    rating: 1,
    isVisible: 1,
    isFeatured: 1,
    order: 1,
    createdAt: 1,
    _id: 1,
  },
  {
    name: "testimonial_admin_filters",
  },
);

testimonialSchema.index(
  {
    clientName: "text",
    clientRole: "text",
    companyName: "text",
    reviewText: "text",
  },
  {
    name: "testimonial_text_search",
  },
);

const Testimonial = mongoose.model("Testimonial", testimonialSchema);

export {
  TESTIMONIAL_RATING_MAX,
  TESTIMONIAL_RATING_MIN,
  isValidHttpUrl,
};

export default Testimonial;
