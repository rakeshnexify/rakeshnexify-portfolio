import mongoose from "mongoose";

const POST_TYPES = ["blog", "news"];

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

function normalizeStringArray(values = [], { lowercase = false } = {}) {
  if (!Array.isArray(values)) {
    return [];
  }

  const normalizedValues = values
    .filter((value) => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => (lowercase ? value.toLowerCase() : value));

  return [...new Set(normalizedValues)];
}

const seoSchema = new mongoose.Schema(
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
      set(keywords) {
        return normalizeStringArray(keywords, {
          lowercase: true,
        });
      },
    },

    ogImageUrl: {
      type: String,
      trim: true,
      maxlength: [500, "SEO Open Graph image URL cannot exceed 500 characters."],
      default: "",
      validate: {
        validator: isValidHttpUrl,
        message:
          "SEO Open Graph image URL must be a complete http:// or https:// URL without login credentials.",
      },
    },
  },
  {
    _id: false,
  },
);

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Post title is required."],
      trim: true,
      minlength: [2, "Post title must contain at least 2 characters."],
      maxlength: [180, "Post title cannot exceed 180 characters."],
    },

    slug: {
      type: String,
      required: [true, "Post slug is required."],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [2, "Post slug must contain at least 2 characters."],
      maxlength: [200, "Post slug cannot exceed 200 characters."],
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Post slug can contain lowercase letters, numbers and hyphens only.",
      ],
    },

    type: {
      type: String,
      enum: {
        values: POST_TYPES,
        message: "Post type must be blog or news.",
      },
      required: [true, "Post type is required."],
      index: true,
    },

    excerpt: {
      type: String,
      required: [true, "Post excerpt is required."],
      trim: true,
      minlength: [10, "Post excerpt must contain at least 10 characters."],
      maxlength: [500, "Post excerpt cannot exceed 500 characters."],
    },

    content: {
      type: String,
      required: [true, "Post content is required."],
      trim: true,
      minlength: [20, "Post content must contain at least 20 characters."],
      maxlength: [50000, "Post content cannot exceed 50000 characters."],
    },

    featuredImageUrl: {
      type: String,
      trim: true,
      maxlength: [500, "Featured image URL cannot exceed 500 characters."],
      default: "",
      validate: {
        validator: isValidHttpUrl,
        message:
          "Featured image URL must be a complete http:// or https:// URL without login credentials.",
      },
    },

    featuredImageAlt: {
      type: String,
      trim: true,
      maxlength: [
        220,
        "Featured image alternative text cannot exceed 220 characters.",
      ],
      default: "",
    },

    category: {
      type: String,
      trim: true,
      maxlength: [120, "Post category cannot exceed 120 characters."],
      default: "",
      index: true,
    },

    tags: {
      type: [String],
      default: [],
      set(tags) {
        return normalizeStringArray(tags, {
          lowercase: true,
        });
      },
    },

    authorName: {
      type: String,
      required: [true, "Post author name is required."],
      trim: true,
      minlength: [2, "Post author name must contain at least 2 characters."],
      maxlength: [150, "Post author name cannot exceed 150 characters."],
    },

    publishedAt: {
      type: Date,
      default: null,
      index: true,
    },

    readingTime: {
      type: Number,
      min: [1, "Reading time must be at least 1 minute."],
      validate: {
        validator(value) {
          return value === undefined || value === null || Number.isInteger(value);
        },
        message: "Reading time must be a whole number of minutes.",
      },
      default: 1,
    },

    relatedProjects: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Project",
        },
      ],
      default: [],
    },

    order: {
      type: Number,
      min: [0, "Post display order cannot be negative."],
      default: 0,
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
      required: [true, "Post creator is required."],
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      required: [true, "Post updater is required."],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "posts",
  },
);

postSchema.index(
  {
    isVisible: 1,
    isFeatured: -1,
    order: 1,
    publishedAt: -1,
    createdAt: -1,
    _id: 1,
  },
  {
    name: "post_public_listing",
  },
);

postSchema.index(
  {
    type: 1,
    category: 1,
    isVisible: 1,
    isFeatured: 1,
    order: 1,
    publishedAt: -1,
    createdAt: -1,
    _id: 1,
  },
  {
    name: "post_admin_filters",
  },
);

postSchema.index(
  {
    title: "text",
    slug: "text",
    excerpt: "text",
    content: "text",
    category: "text",
    tags: "text",
    authorName: "text",
  },
  {
    name: "post_text_search",
  },
);

const Post = mongoose.model("Post", postSchema);

export { POST_TYPES, isValidHttpUrl, normalizeStringArray };

export default Post;
