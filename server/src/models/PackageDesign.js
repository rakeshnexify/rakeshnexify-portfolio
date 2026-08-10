import mongoose from "mongoose";

const PACKAGE_DESIGN_DEVICES = ["desktop", "tablet", "mobile"];

const MAX_PACKAGE_DESIGN_ORDER = 1_000_000;
const MAX_PACKAGE_DESIGN_SCREENSHOTS = 24;

function normalizeIdentityPart(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function createPackageDesignIdentityKey({
  servicePackage,
  name,
}) {
  return [
    normalizeIdentityPart(servicePackage),
    normalizeIdentityPart(name),
  ].join("|");
}

function isHttpUrl(value) {
  const cleanValue = String(value ?? "").trim();

  if (!cleanValue) {
    return true;
  }

  try {
    const parsedUrl = new URL(cleanValue);

    return ["http:", "https:"].includes(
      parsedUrl.protocol,
    );
  } catch {
    return false;
  }
}

function removePrivateFields(
  _document,
  returnedObject,
) {
  delete returnedObject.identityKey;

  return returnedObject;
}

const packageDesignScreenshotSchema =
  new mongoose.Schema(
    {
      url: {
        type: String,
        required: [
          true,
          "Screenshot URL is required.",
        ],
        trim: true,
        maxlength: [
          2000,
          "Screenshot URL cannot exceed 2000 characters.",
        ],
        validate: {
          validator: isHttpUrl,
          message:
            "Screenshot URL must use http or https.",
        },
      },

      alt: {
        type: String,
        trim: true,
        maxlength: [
          220,
          "Screenshot alt text cannot exceed 220 characters.",
        ],
        default: "",
      },

      device: {
        type: String,
        trim: true,
        lowercase: true,
        enum: {
          values: PACKAGE_DESIGN_DEVICES,
          message:
            "Please select a supported screenshot device.",
        },
        default: "desktop",
      },

      order: {
        type: Number,
        min: [
          0,
          "Screenshot order cannot be negative.",
        ],
        max: [
          MAX_PACKAGE_DESIGN_ORDER,
          `Screenshot order cannot exceed ${MAX_PACKAGE_DESIGN_ORDER}.`,
        ],
        default: 0,
        validate: {
          validator: Number.isSafeInteger,
          message:
            "Screenshot order must be a safe whole number.",
        },
      },
    },
    {
      _id: false,
    },
  );

const packageDesignSchema = new mongoose.Schema(
  {
    servicePackage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServicePackage",
      required: [
        true,
        "Related Service Package is required.",
      ],
      index: true,
    },

    name: {
      type: String,
      required: [
        true,
        "Design name is required.",
      ],
      trim: true,
      minlength: [
        2,
        "Design name must contain at least 2 characters.",
      ],
      maxlength: [
        140,
        "Design name cannot exceed 140 characters.",
      ],
    },

    identityKey: {
      type: String,
      required: true,
      select: false,
    },

    slug: {
      type: String,
      required: [
        true,
        "Design slug is required.",
      ],
      trim: true,
      lowercase: true,
      minlength: [
        2,
        "Design slug must contain at least 2 characters.",
      ],
      maxlength: [
        160,
        "Design slug cannot exceed 160 characters.",
      ],
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Design slug can contain lowercase letters, numbers and hyphens only.",
      ],
    },

    shortDescription: {
      type: String,
      required: [
        true,
        "Short description is required.",
      ],
      trim: true,
      minlength: [
        10,
        "Short description must contain at least 10 characters.",
      ],
      maxlength: [
        500,
        "Short description cannot exceed 500 characters.",
      ],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [
        5000,
        "Description cannot exceed 5000 characters.",
      ],
      default: "",
    },

    thumbnailUrl: {
      type: String,
      trim: true,
      maxlength: [
        2000,
        "Thumbnail URL cannot exceed 2000 characters.",
      ],
      default: "",
      validate: {
        validator: isHttpUrl,
        message:
          "Thumbnail URL must use http or https.",
      },
    },

    thumbnailAlt: {
      type: String,
      trim: true,
      maxlength: [
        220,
        "Thumbnail alt text cannot exceed 220 characters.",
      ],
      default: "",
    },

    screenshots: {
      type: [packageDesignScreenshotSchema],
      default: [],
      validate: {
        validator(value) {
          return (
            Array.isArray(value) &&
            value.length <=
              MAX_PACKAGE_DESIGN_SCREENSHOTS
          );
        },
        message:
          `A design can contain at most ${MAX_PACKAGE_DESIGN_SCREENSHOTS} screenshots.`,
      },
    },

    liveDemoUrl: {
      type: String,
      trim: true,
      maxlength: [
        2000,
        "Live demo URL cannot exceed 2000 characters.",
      ],
      default: "",
      validate: {
        validator: isHttpUrl,
        message:
          "Live demo URL must use http or https.",
      },
    },

    liveDemoLabel: {
      type: String,
      trim: true,
      maxlength: [
        80,
        "Live demo label cannot exceed 80 characters.",
      ],
      default: "Live Demo",
    },

    order: {
      type: Number,
      min: [
        0,
        "Display order cannot be negative.",
      ],
      max: [
        MAX_PACKAGE_DESIGN_ORDER,
        `Display order cannot exceed ${MAX_PACKAGE_DESIGN_ORDER}.`,
      ],
      default: 0,
      validate: {
        validator: Number.isSafeInteger,
        message:
          "Display order must be a safe whole number.",
      },
    },

    isDefault: {
      type: Boolean,
      default: false,
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
      required: [
        true,
        "Creator is required.",
      ],
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      required: [
        true,
        "Updater is required.",
      ],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "package_designs",

    toJSON: {
      transform: removePrivateFields,
    },

    toObject: {
      transform: removePrivateFields,
    },
  },
);

packageDesignSchema.pre(
  "validate",
  function preparePackageDesign() {
    this.identityKey =
      createPackageDesignIdentityKey({
        servicePackage:
          this.servicePackage,
        name: this.name,
      });

    const screenshotUrls = new Set();

    this.screenshots.forEach(
      (screenshot) => {
        const normalizedUrl = String(
          screenshot.url ?? "",
        )
          .trim()
          .toLowerCase();

        if (!normalizedUrl) {
          return;
        }

        if (
          screenshotUrls.has(
            normalizedUrl,
          )
        ) {
          this.invalidate(
            "screenshots",
            `Screenshot URL "${screenshot.url}" must be unique within this design.`,
          );

          return;
        }

        screenshotUrls.add(
          normalizedUrl,
        );
      },
    );
  },
);

packageDesignSchema.index(
  {
    servicePackage: 1,
    slug: 1,
  },
  {
    unique: true,
    name:
      "package_design_unique_package_slug",
  },
);

packageDesignSchema.index(
  {
    identityKey: 1,
  },
  {
    unique: true,
    name:
      "package_design_unique_identity",
  },
);

packageDesignSchema.index(
  {
    servicePackage: 1,
    isDefault: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      isDefault: true,
    },
    name:
      "package_design_unique_default_per_package",
  },
);

packageDesignSchema.index(
  {
    servicePackage: 1,
    isVisible: 1,
    isDefault: -1,
    isFeatured: -1,
    order: 1,
    _id: 1,
  },
  {
    name:
      "package_design_public_listing",
  },
);

packageDesignSchema.index(
  {
    servicePackage: 1,
    isVisible: 1,
    isDefault: 1,
    isFeatured: 1,
  },
  {
    name:
      "package_design_admin_filters",
  },
);

const PackageDesign = mongoose.model(
  "PackageDesign",
  packageDesignSchema,
);

export {
  MAX_PACKAGE_DESIGN_ORDER,
  MAX_PACKAGE_DESIGN_SCREENSHOTS,
  PACKAGE_DESIGN_DEVICES,
  createPackageDesignIdentityKey,
};

export default PackageDesign;
