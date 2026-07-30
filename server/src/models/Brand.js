import mongoose from "mongoose";

const brandStatisticSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, "Statistic label is required."],
      trim: true,
      maxlength: [100, "Statistic label cannot exceed 100 characters."],
    },

    value: {
      type: String,
      required: [true, "Statistic value is required."],
      trim: true,
      maxlength: [100, "Statistic value cannot exceed 100 characters."],
    },
  },
  {
    _id: true,
  },
);

const brandSocialLinksSchema = new mongoose.Schema(
  {
    facebook: {
      type: String,
      trim: true,
      default: "",
    },

    instagram: {
      type: String,
      trim: true,
      default: "",
    },

    linkedin: {
      type: String,
      trim: true,
      default: "",
    },

    youtube: {
      type: String,
      trim: true,
      default: "",
    },

    tiktok: {
      type: String,
      trim: true,
      default: "",
    },

    threads: {
      type: String,
      trim: true,
      default: "",
    },

    x: {
      type: String,
      trim: true,
      default: "",
    },

    github: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: false,
  },
);

const brandSeoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      maxlength: [70, "SEO title cannot exceed 70 characters."],
      default: "",
    },

    description: {
      type: String,
      trim: true,
      maxlength: [180, "SEO description cannot exceed 180 characters."],
      default: "",
    },

    keywords: {
      type: [String],
      default: [],

      set(value) {
        if (!Array.isArray(value)) {
          return [];
        }

        return value.map((keyword) => String(keyword).trim()).filter(Boolean);
      },
    },

    ogImageUrl: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: false,
  },
);

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Brand name is required."],
      trim: true,
      minlength: [2, "Brand name must contain at least 2 characters."],
      maxlength: [150, "Brand name cannot exceed 150 characters."],
    },

    slug: {
      type: String,
      required: [true, "Brand slug is required."],
      trim: true,
      lowercase: true,
      unique: true,
      minlength: [2, "Brand slug must contain at least 2 characters."],
      maxlength: [160, "Brand slug cannot exceed 160 characters."],
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Brand slug must use lowercase letters, numbers and hyphens only.",
      ],
    },

    tagline: {
      type: String,
      trim: true,
      maxlength: [250, "Brand tagline cannot exceed 250 characters."],
      default: "",
    },

    shortDescription: {
      type: String,
      required: [true, "Short description is required."],
      trim: true,
      minlength: [10, "Short description must contain at least 10 characters."],
      maxlength: [350, "Short description cannot exceed 350 characters."],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [10000, "Brand description cannot exceed 10000 characters."],
      default: "",
    },

    category: {
      type: String,
      trim: true,
      maxlength: [150, "Brand category cannot exceed 150 characters."],
      default: "",
    },

    brandType: {
      type: String,

      enum: {
        values: [
          "personal",
          "creator",
          "business",
          "product",
          "media",
          "education",
          "community",
          "other",
        ],

        message: "Please select a valid brand type.",
      },

      default: "creator",
    },

    status: {
      type: String,

      enum: {
        values: ["planned", "active", "inactive", "archived"],

        message: "Please select a valid brand status.",
      },

      default: "active",
    },

    launchedYear: {
      type: Number,
      min: [1800, "Launch year cannot be before 1800."],
      max: [2200, "Launch year cannot be after 2200."],
      default: null,
    },

    role: {
      type: String,
      trim: true,
      maxlength: [200, "Brand role cannot exceed 200 characters."],
      default: "",
    },

    websiteUrl: {
      type: String,
      trim: true,
      default: "",
    },

    logoUrl: {
      type: String,
      trim: true,
      default: "",
    },

    coverImageUrl: {
      type: String,
      trim: true,
      default: "",
    },

    focusAreas: {
      type: [String],
      default: [],
    },

    platforms: {
      type: [String],
      default: [],
    },

    highlights: {
      type: [String],
      default: [],
    },

    statistics: {
      type: [brandStatisticSchema],
      default: [],
    },

    socialLinks: {
      type: brandSocialLinksSchema,
      default: () => ({}),
    },

    order: {
      type: Number,
      min: [0, "Brand order cannot be negative."],
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

    seo: {
      type: brandSeoSchema,
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
    collection: "brands",
    timestamps: true,
    versionKey: false,
  },
);

brandSchema.index({
  isVisible: 1,
  isFeatured: -1,
  order: 1,
});

brandSchema.index({
  status: 1,
  brandType: 1,
});

brandSchema.index({
  name: "text",
  tagline: "text",
  shortDescription: "text",
  description: "text",
  category: "text",
  focusAreas: "text",
  platforms: "text",
  highlights: "text",
});

const Brand = mongoose.models.Brand || mongoose.model("Brand", brandSchema);

export default Brand;
