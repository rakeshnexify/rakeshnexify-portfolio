import mongoose from "mongoose";

const companyContactSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 200,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "",
    },

    address: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },

    city: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    country: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
  },
  {
    _id: false,
  },
);

const companySocialLinksSchema = new mongoose.Schema(
  {
    facebook: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    instagram: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    linkedin: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    youtube: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    x: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  {
    _id: false,
  },
);

const companyStatisticSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, "Company statistic label is required."],
      trim: true,
      maxlength: 100,
    },

    value: {
      type: String,
      required: [true, "Company statistic value is required."],
      trim: true,
      maxlength: 100,
    },
  },
  {
    _id: true,
  },
);

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

    ogImageUrl: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  {
    _id: false,
  },
);

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Company name is required."],
      trim: true,
      minlength: [2, "Company name must contain at least 2 characters."],
      maxlength: [150, "Company name cannot exceed 150 characters."],
    },

    slug: {
      type: String,
      required: [true, "Company slug is required."],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [2, "Company slug must contain at least 2 characters."],
      maxlength: [180, "Company slug cannot exceed 180 characters."],
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Company slug can contain lowercase letters, numbers and hyphens only.",
      ],
    },

    legalName: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    tagline: {
      type: String,
      trim: true,
      maxlength: 250,
      default: "",
    },

    shortDescription: {
      type: String,
      required: [true, "Company short description is required."],
      trim: true,
      minlength: [
        10,
        "Company short description must contain at least 10 characters.",
      ],
      maxlength: [
        400,
        "Company short description cannot exceed 400 characters.",
      ],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [10000, "Company description cannot exceed 10000 characters."],
      default: "",
    },

    industry: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
      index: true,
    },

    relationship: {
      type: String,
      enum: {
        values: ["owned", "managed", "partner", "client", "other"],
        message: "Invalid company relationship.",
      },
      default: "owned",
      index: true,
    },

    status: {
      type: String,
      enum: {
        values: ["planned", "active", "inactive", "archived"],
        message: "Invalid company status.",
      },
      default: "active",
      index: true,
    },

    foundedYear: {
      type: Number,
      min: [1800, "Founded year is invalid."],
      max: [2200, "Founded year is invalid."],
      default: null,
    },

    role: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    websiteUrl: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    logoUrl: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    coverImageUrl: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    businessAreas: {
      type: [String],
      default: [],

      set(items) {
        if (!Array.isArray(items)) {
          return [];
        }

        return items.map((item) => String(item).trim()).filter(Boolean);
      },
    },

    services: {
      type: [String],
      default: [],

      set(items) {
        if (!Array.isArray(items)) {
          return [];
        }

        return items.map((item) => String(item).trim()).filter(Boolean);
      },
    },

    highlights: {
      type: [String],
      default: [],

      set(items) {
        if (!Array.isArray(items)) {
          return [];
        }

        return items.map((item) => String(item).trim()).filter(Boolean);
      },
    },

    statistics: {
      type: [companyStatisticSchema],
      default: [],
    },

    contact: {
      type: companyContactSchema,
      default: () => ({}),
    },

    socialLinks: {
      type: companySocialLinksSchema,
      default: () => ({}),
    },

    order: {
      type: Number,
      min: [0, "Company order cannot be negative."],
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
    collection: "companies",
  },
);

companySchema.index({
  isVisible: 1,
  isFeatured: 1,
  order: 1,
  createdAt: -1,
});

companySchema.index({
  name: "text",
  legalName: "text",
  tagline: "text",
  shortDescription: "text",
  description: "text",
  industry: "text",
  businessAreas: "text",
  services: "text",
});

const Company = mongoose.model("Company", companySchema);

export default Company;
