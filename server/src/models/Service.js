import mongoose from "mongoose";

function isSafeHttpUrl(value) {
  const url = String(value || "").trim();

  if (!url) {
    return true;
  }

  for (let index = 0; index < url.length; index += 1) {
    const characterCode = url.charCodeAt(index);

    if (characterCode <= 31 || characterCode === 127) {
      return false;
    }
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

const seoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      maxlength: 70,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      maxlength: 180,
      default: "",
    },

    keywords: {
      type: [String],
      default: [],
      set(keywords) {
        if (!Array.isArray(keywords)) {
          return [];
        }

        return keywords
          .map((keyword) => String(keyword).trim().toLowerCase())
          .filter(Boolean);
      },
    },
  },
  {
    _id: false,
  },
);

const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Service title is required."],
      trim: true,
      minlength: [2, "Service title must contain at least 2 characters."],
      maxlength: [120, "Service title cannot exceed 120 characters."],
    },

    slug: {
      type: String,
      required: [true, "Service slug is required."],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [2, "Service slug must contain at least 2 characters."],
      maxlength: [150, "Service slug cannot exceed 150 characters."],
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Service slug can contain lowercase letters, numbers and hyphens only.",
      ],
    },

    shortDescription: {
      type: String,
      required: [true, "Short description is required."],
      trim: true,
      minlength: [10, "Short description must contain at least 10 characters."],
      maxlength: [300, "Short description cannot exceed 300 characters."],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [5000, "Full description cannot exceed 5000 characters."],
      default: "",
    },

    icon: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    iconUrl: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    orderUrl: {
      type: String,
      trim: true,
      maxlength: [500, "Service order URL cannot exceed 500 characters."],
      default: "",
      validate: {
        validator: isSafeHttpUrl,
        message:
          "Service order URL must use http:// or https:// without login credentials.",
      },
    },

    features: {
      type: [String],
      default: [],
      set(features) {
        if (!Array.isArray(features)) {
          return [];
        }

        return features
          .map((feature) => String(feature).trim())
          .filter(Boolean);
      },
    },

    technologies: {
      type: [String],
      default: [],
      set(technologies) {
        if (!Array.isArray(technologies)) {
          return [];
        }

        return technologies
          .map((technology) => String(technology).trim())
          .filter(Boolean);
      },
    },

    order: {
      type: Number,
      min: [0, "Display order cannot be negative."],
      default: 0,
      index: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    isVisible: {
      type: Boolean,
      default: true,
      index: true,
    },

    seo: {
      type: seoSchema,
      default: () => ({}),
    },

    servicePackageGuardVersion: {
      type: Number,
      select: false,
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
    collection: "services",
  },
);

serviceSchema.index({
  isVisible: 1,
  order: 1,
  createdAt: -1,
});

const Service = mongoose.model("Service", serviceSchema);

export default Service;
