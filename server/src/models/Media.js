import mongoose from "mongoose";

const MEDIA_TYPES = Object.freeze([
  "image",
  "svg",
  "document",
  "audio",
  "video",
]);

const MEDIA_PROVIDERS = Object.freeze([
  "cloudinary",
]);

const CLOUDINARY_RESOURCE_TYPES = Object.freeze([
  "image",
  "video",
  "raw",
]);

const MEDIA_RESOURCE_TYPE_MAP = Object.freeze({
  image: "image",
  svg: "image",
  document: "raw",
  audio: "video",
  video: "video",
});

const MAX_MEDIA_TAGS = 20;

function isValidSecureUrl(value) {
  const url = String(value ?? "").trim();

  if (!url) {
    return false;
  }

  try {
    const parsedUrl = new URL(url);

    return (
      parsedUrl.protocol === "https:" &&
      Boolean(parsedUrl.hostname) &&
      !parsedUrl.username &&
      !parsedUrl.password
    );
  } catch {
    return false;
  }
}

function isValidMediaFolder(value) {
  const folder = String(value ?? "").trim();

  if (!folder) {
    return true;
  }

  if (
    folder.startsWith("/") ||
    folder.endsWith("/") ||
    folder.includes("\\") ||
    folder.includes("..") ||
    folder.includes("//")
  ) {
    return false;
  }

  return /^[a-zA-Z0-9][a-zA-Z0-9/_-]*$/.test(folder);
}

function hasUniqueMediaTags(tags) {
  if (!Array.isArray(tags)) {
    return false;
  }

  const normalizedTags = tags.map((tag) =>
    String(tag ?? "").trim().toLowerCase(),
  );

  return (
    normalizedTags.length <= MAX_MEDIA_TAGS &&
    new Set(normalizedTags).size === normalizedTags.length
  );
}

function isPositiveIntegerOrNull(value) {
  return (
    value === null ||
    (Number.isInteger(value) && value > 0)
  );
}

function isPositiveNumberOrNull(value) {
  return (
    value === null ||
    (Number.isFinite(value) && value > 0)
  );
}

const mediaSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Media title is required."],
      trim: true,
      minlength: [
        1,
        "Media title must contain at least 1 character.",
      ],
      maxlength: [
        180,
        "Media title cannot exceed 180 characters.",
      ],
    },

    originalName: {
      type: String,
      required: [
        true,
        "Original Media filename is required.",
      ],
      trim: true,
      minlength: [
        1,
        "Original Media filename cannot be empty.",
      ],
      maxlength: [
        255,
        "Original Media filename cannot exceed 255 characters.",
      ],
      immutable: true,
    },

    fileName: {
      type: String,
      required: [
        true,
        "Stored Media filename is required.",
      ],
      trim: true,
      minlength: [
        1,
        "Stored Media filename cannot be empty.",
      ],
      maxlength: [
        255,
        "Stored Media filename cannot exceed 255 characters.",
      ],
      immutable: true,
    },

    url: {
      type: String,
      required: [
        true,
        "Media delivery URL is required.",
      ],
      trim: true,
      maxlength: [
        1000,
        "Media delivery URL cannot exceed 1000 characters.",
      ],
      immutable: true,
      validate: {
        validator: isValidSecureUrl,
        message:
          "Media delivery URL must be a complete credential-free HTTPS URL.",
      },
    },

    provider: {
      type: String,
      required: [
        true,
        "Media storage provider is required.",
      ],
      enum: {
        values: MEDIA_PROVIDERS,
        message:
          "Media storage provider is not supported.",
      },
      default: "cloudinary",
      immutable: true,
    },

    providerPublicId: {
      type: String,
      required: [
        true,
        "Media provider public ID is required.",
      ],
      trim: true,
      minlength: [
        1,
        "Media provider public ID cannot be empty.",
      ],
      maxlength: [
        500,
        "Media provider public ID cannot exceed 500 characters.",
      ],
      immutable: true,
    },

    providerResourceType: {
      type: String,
      required: [
        true,
        "Media provider resource type is required.",
      ],
      enum: {
        values: CLOUDINARY_RESOURCE_TYPES,
        message:
          "Media provider resource type is not supported.",
      },
      immutable: true,
    },

    mediaType: {
      type: String,
      required: [
        true,
        "Media type is required.",
      ],
      enum: {
        values: MEDIA_TYPES,
        message:
          "Media type must be image, svg, document, audio or video.",
      },
      immutable: true,
    },

    mimeType: {
      type: String,
      required: [
        true,
        "Media MIME type is required.",
      ],
      trim: true,
      lowercase: true,
      minlength: [
        3,
        "Media MIME type is invalid.",
      ],
      maxlength: [
        150,
        "Media MIME type cannot exceed 150 characters.",
      ],
      immutable: true,
    },

    extension: {
      type: String,
      required: [
        true,
        "Media file extension is required.",
      ],
      trim: true,
      lowercase: true,
      maxlength: [
        12,
        "Media file extension cannot exceed 12 characters.",
      ],
      immutable: true,
      match: [
        /^[a-z0-9]+$/,
        "Media file extension can contain lowercase letters and numbers only.",
      ],
    },

    size: {
      type: Number,
      required: [
        true,
        "Media file size is required.",
      ],
      min: [
        1,
        "Media file size must be greater than zero.",
      ],
      immutable: true,
      validate: {
        validator: Number.isInteger,
        message:
          "Media file size must be stored as whole bytes.",
      },
    },

    width: {
      type: Number,
      default: null,
      immutable: true,
      validate: {
        validator: isPositiveIntegerOrNull,
        message:
          "Media width must be a positive whole number when provided.",
      },
    },

    height: {
      type: Number,
      default: null,
      immutable: true,
      validate: {
        validator: isPositiveIntegerOrNull,
        message:
          "Media height must be a positive whole number when provided.",
      },
    },

    duration: {
      type: Number,
      default: null,
      immutable: true,
      validate: {
        validator: isPositiveNumberOrNull,
        message:
          "Media duration must be greater than zero when provided.",
      },
    },

    altText: {
      type: String,
      trim: true,
      maxlength: [
        300,
        "Media alternative text cannot exceed 300 characters.",
      ],
      default: "",
    },

    isDecorative: {
      type: Boolean,
      default: false,
    },

    caption: {
      type: String,
      trim: true,
      maxlength: [
        500,
        "Media caption cannot exceed 500 characters.",
      ],
      default: "",
    },

    description: {
      type: String,
      trim: true,
      maxlength: [
        3000,
        "Media description cannot exceed 3000 characters.",
      ],
      default: "",
    },

    folder: {
      type: String,
      trim: true,
      maxlength: [
        200,
        "Media folder cannot exceed 200 characters.",
      ],
      default: "",
      validate: {
        validator: isValidMediaFolder,
        message:
          "Media folder must be a safe relative folder path.",
      },
    },

    tags: {
      type: [
        {
          type: String,
          trim: true,
          lowercase: true,
          maxlength: [
            60,
            "Each Media tag cannot exceed 60 characters.",
          ],
        },
      ],
      default: [],
      validate: {
        validator: hasUniqueMediaTags,
        message:
          `Media can contain at most ${MAX_MEDIA_TAGS} unique tags.`,
      },
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      required: [
        true,
        "Media uploader is required.",
      ],
      immutable: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      required: [
        true,
        "Media updater is required.",
      ],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "media",
  },
);

mediaSchema.pre("validate", function normalizeMediaBeforeValidation() {
  if (this.mediaType) {
    const expectedResourceType =
      MEDIA_RESOURCE_TYPE_MAP[this.mediaType];

    if (
      expectedResourceType &&
      this.providerResourceType !== expectedResourceType
    ) {
      this.invalidate(
        "providerResourceType",
        `${this.mediaType} Media must use Cloudinary resource type ${expectedResourceType}.`,
      );
    }
  }

  if (this.isDecorative) {
    this.altText = "";
  }

  if (
    !["image", "svg"].includes(this.mediaType)
  ) {
    this.isDecorative = false;
    this.altText = "";
  }

  if (
    !["image", "svg", "video"].includes(
      this.mediaType,
    )
  ) {
    this.width = null;
    this.height = null;
  }

  if (
    !["audio", "video"].includes(
      this.mediaType,
    )
  ) {
    this.duration = null;
  }
});

mediaSchema.index(
  {
    provider: 1,
    providerPublicId: 1,
  },
  {
    name: "media_provider_asset_unique",
    unique: true,
  },
);

mediaSchema.index(
  {
    mediaType: 1,
    createdAt: -1,
    _id: -1,
  },
  {
    name: "media_type_listing",
  },
);

mediaSchema.index(
  {
    folder: 1,
    createdAt: -1,
    _id: -1,
  },
  {
    name: "media_folder_listing",
  },
);

mediaSchema.index(
  {
    uploadedBy: 1,
    createdAt: -1,
    _id: -1,
  },
  {
    name: "media_uploader_listing",
  },
);

mediaSchema.index(
  {
    title: "text",
    originalName: "text",
    caption: "text",
    description: "text",
    tags: "text",
  },
  {
    name: "media_text_search",
    weights: {
      title: 10,
      originalName: 8,
      tags: 6,
      caption: 4,
      description: 2,
    },
  },
);

const Media = mongoose.model(
  "Media",
  mediaSchema,
);

export {
  CLOUDINARY_RESOURCE_TYPES,
  MAX_MEDIA_TAGS,
  MEDIA_PROVIDERS,
  MEDIA_RESOURCE_TYPE_MAP,
  MEDIA_TYPES,
  isValidMediaFolder,
  isValidSecureUrl,
};

export default Media;