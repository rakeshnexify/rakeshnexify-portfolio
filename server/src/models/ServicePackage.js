import mongoose from "mongoose";

const SERVICE_PACKAGE_GROUPS = ["development", "management"];
const SERVICE_PACKAGE_PRICING_MODES = ["fixed", "starting-from", "custom"];
const SERVICE_PACKAGE_BILLING_CYCLES = [
  "one-time",
  "monthly",
  "yearly",
  "custom",
];

const MAX_SERVICE_PACKAGE_ORDER = 1_000_000;
const MAX_SERVICE_PACKAGE_PRICE = 1_000_000_000_000;

function normalizeIdentityPart(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function createServicePackageIdentityKey({ service, group, name }) {
  return [
    normalizeIdentityPart(service),
    normalizeIdentityPart(group),
    normalizeIdentityPart(name),
  ].join("|");
}

function removePrivateFields(_document, returnedObject) {
  delete returnedObject.identityKey;
  delete returnedObject.packageDesignGuardVersion;

  return returnedObject;
}

const packageFeatureSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, "Feature key is required."],
      trim: true,
      lowercase: true,
      minlength: [1, "Feature key cannot be empty."],
      maxlength: [120, "Feature key cannot exceed 120 characters."],
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Feature key can contain lowercase letters, numbers and hyphens only.",
      ],
    },

    label: {
      type: String,
      required: [true, "Feature label is required."],
      trim: true,
      minlength: [2, "Feature label must contain at least 2 characters."],
      maxlength: [160, "Feature label cannot exceed 160 characters."],
    },

    value: {
      type: String,
      trim: true,
      maxlength: [220, "Feature value cannot exceed 220 characters."],
      default: "",
    },

    included: {
      type: Boolean,
      default: true,
    },

    order: {
      type: Number,
      min: [0, "Feature order cannot be negative."],
      max: [
        MAX_SERVICE_PACKAGE_ORDER,
        `Feature order cannot exceed ${MAX_SERVICE_PACKAGE_ORDER}.`,
      ],
      default: 0,
      validate: {
        validator: Number.isSafeInteger,
        message: "Feature order must be a safe whole number.",
      },
    },
  },
  {
    _id: false,
  },
);

const servicePackageSchema = new mongoose.Schema(
  {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: [true, "Related Service is required."],
      index: true,
    },

    group: {
      type: String,
      required: [true, "Package group is required."],
      trim: true,
      lowercase: true,
      enum: {
        values: SERVICE_PACKAGE_GROUPS,
        message: "Please select a supported package group.",
      },
    },

    name: {
      type: String,
      required: [true, "Package name is required."],
      trim: true,
      minlength: [2, "Package name must contain at least 2 characters."],
      maxlength: [140, "Package name cannot exceed 140 characters."],
    },

    identityKey: {
      type: String,
      required: true,
      select: false,
    },

    slug: {
      type: String,
      required: [true, "Package slug is required."],
      trim: true,
      lowercase: true,
      minlength: [2, "Package slug must contain at least 2 characters."],
      maxlength: [160, "Package slug cannot exceed 160 characters."],
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Package slug can contain lowercase letters, numbers and hyphens only.",
      ],
    },

    shortDescription: {
      type: String,
      required: [true, "Short description is required."],
      trim: true,
      minlength: [10, "Short description must contain at least 10 characters."],
      maxlength: [500, "Short description cannot exceed 500 characters."],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [5000, "Description cannot exceed 5000 characters."],
      default: "",
    },

    pricingMode: {
      type: String,
      trim: true,
      lowercase: true,
      enum: {
        values: SERVICE_PACKAGE_PRICING_MODES,
        message: "Please select a supported pricing mode.",
      },
      default: "fixed",
    },

    price: {
      type: Number,
      default: null,
      required: [
        function requirePackagePrice() {
          return this.pricingMode !== "custom";
        },
        "Package price is required unless pricing mode is custom.",
      ],
      min: [0, "Package price cannot be negative."],
      max: [
        MAX_SERVICE_PACKAGE_PRICE,
        `Package price cannot exceed ${MAX_SERVICE_PACKAGE_PRICE}.`,
      ],
      validate: {
        validator(value) {
          if (value === null) {
            return this.pricingMode === "custom";
          }

          return (
            typeof value === "number" &&
            Number.isFinite(value) &&
            /^\d+(?:\.\d{1,2})?$/.test(String(value))
          );
        },
        message:
          "Package price must be a valid non-negative amount with at most 2 decimal places.",
      },
    },

    currency: {
      type: String,
      trim: true,
      uppercase: true,
      minlength: [3, "Currency must use a 3-letter code."],
      maxlength: [3, "Currency must use a 3-letter code."],
      match: [/^[A-Z]{3}$/, "Currency must use a 3-letter code."],
      default: "NPR",
    },

    priceLabel: {
      type: String,
      trim: true,
      maxlength: [120, "Price label cannot exceed 120 characters."],
      default: "",
    },

    billingCycle: {
      type: String,
      trim: true,
      lowercase: true,
      enum: {
        values: SERVICE_PACKAGE_BILLING_CYCLES,
        message: "Please select a supported billing cycle.",
      },
      default: "one-time",
    },

    billingLabel: {
      type: String,
      trim: true,
      maxlength: [120, "Billing label cannot exceed 120 characters."],
      default: "",
    },

    bestFor: {
      type: String,
      trim: true,
      maxlength: [250, "Best-for text cannot exceed 250 characters."],
      default: "",
    },

    deliveryLabel: {
      type: String,
      trim: true,
      maxlength: [120, "Delivery label cannot exceed 120 characters."],
      default: "",
    },

    supportLabel: {
      type: String,
      trim: true,
      maxlength: [120, "Support label cannot exceed 120 characters."],
      default: "",
    },

    revisionsLabel: {
      type: String,
      trim: true,
      maxlength: [120, "Revisions label cannot exceed 120 characters."],
      default: "",
    },

    features: {
      type: [packageFeatureSchema],
      default: [],
    },

    badge: {
      type: String,
      trim: true,
      maxlength: [80, "Package badge cannot exceed 80 characters."],
      default: "",
    },

    ctaLabel: {
      type: String,
      trim: true,
      maxlength: [80, "CTA label cannot exceed 80 characters."],
      default: "Choose Package",
    },

    whatsappEnabled: {
      type: Boolean,
      default: true,
    },

    order: {
      type: Number,
      min: [0, "Display order cannot be negative."],
      max: [
        MAX_SERVICE_PACKAGE_ORDER,
        `Display order cannot exceed ${MAX_SERVICE_PACKAGE_ORDER}.`,
      ],
      default: 0,
      validate: {
        validator: Number.isSafeInteger,
        message: "Display order must be a safe whole number.",
      },
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isVisible: {
      type: Boolean,
      default: true,
    },

    packageDesignGuardVersion: {
      type: Number,
      select: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      required: [true, "Creator is required."],
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      required: [true, "Updater is required."],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "service_packages",

    toJSON: {
      transform: removePrivateFields,
    },

    toObject: {
      transform: removePrivateFields,
    },
  },
);

servicePackageSchema.pre("validate", function prepareServicePackage() {
  if (this.pricingMode === "custom") {
    this.price = null;
  }

  this.identityKey = createServicePackageIdentityKey({
    service: this.service,
    group: this.group,
    name: this.name,
  });

  const featureKeys = new Set();

  this.features.forEach((feature) => {
    const key = normalizeIdentityPart(feature.key);

    if (!key) {
      return;
    }

    if (featureKeys.has(key)) {
      this.invalidate(
        "features",
        `Feature key "${feature.key}" must be unique within this package.`,
      );
      return;
    }

    featureKeys.add(key);
  });
});

servicePackageSchema.index(
  {
    service: 1,
    group: 1,
    slug: 1,
  },
  {
    unique: true,
    name: "service_package_unique_service_group_slug",
  },
);

servicePackageSchema.index(
  {
    identityKey: 1,
  },
  {
    unique: true,
    name: "service_package_unique_identity",
  },
);

servicePackageSchema.index(
  {
    service: 1,
    group: 1,
    isVisible: 1,
    isFeatured: -1,
    order: 1,
    _id: 1,
  },
  {
    name: "service_package_public_listing_v2",
  },
);

servicePackageSchema.index(
  {
    service: 1,
    group: 1,
    billingCycle: 1,
    pricingMode: 1,
    isVisible: 1,
    isFeatured: 1,
    order: 1,
    _id: 1,
  },
  {
    name: "service_package_admin_filters",
  },
);

const ServicePackage = mongoose.model("ServicePackage", servicePackageSchema);

export {
  MAX_SERVICE_PACKAGE_ORDER,
  MAX_SERVICE_PACKAGE_PRICE,
  SERVICE_PACKAGE_BILLING_CYCLES,
  SERVICE_PACKAGE_GROUPS,
  SERVICE_PACKAGE_PRICING_MODES,
  createServicePackageIdentityKey,
};

export default ServicePackage;
