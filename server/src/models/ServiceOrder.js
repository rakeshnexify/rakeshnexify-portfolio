import mongoose from "mongoose";

const SERVICE_ORDER_STATUSES = [
  "new",
  "reviewing",
  "confirmed",
  "in-progress",
  "completed",
  "cancelled",
  "rejected",
];

const SERVICE_ORDER_GROUPS = ["development", "management"];
const SERVICE_ORDER_PRICING_MODES = ["fixed", "starting-from", "custom"];
const SERVICE_ORDER_BILLING_CYCLES = [
  "one-time",
  "monthly",
  "yearly",
  "custom",
];

const serviceSnapshotSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Service title snapshot is required."],
      trim: true,
      maxlength: [180, "Service title snapshot cannot exceed 180 characters."],
    },

    slug: {
      type: String,
      required: [true, "Service slug snapshot is required."],
      trim: true,
      lowercase: true,
      maxlength: [180, "Service slug snapshot cannot exceed 180 characters."],
    },
  },
  {
    _id: false,
  },
);

const packageSnapshotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Package name snapshot is required."],
      trim: true,
      maxlength: [180, "Package name snapshot cannot exceed 180 characters."],
    },

    slug: {
      type: String,
      required: [true, "Package slug snapshot is required."],
      trim: true,
      lowercase: true,
      maxlength: [180, "Package slug snapshot cannot exceed 180 characters."],
    },

    group: {
      type: String,
      required: [true, "Package group snapshot is required."],
      enum: {
        values: SERVICE_ORDER_GROUPS,
        message: "Package group snapshot is not supported.",
      },
    },

    pricingMode: {
      type: String,
      required: [true, "Package pricing mode snapshot is required."],
      enum: {
        values: SERVICE_ORDER_PRICING_MODES,
        message: "Package pricing mode snapshot is not supported.",
      },
    },

    price: {
      type: Number,
      default: null,
      min: [0, "Package price snapshot cannot be negative."],
    },

    currency: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [3, "Currency snapshot cannot exceed 3 characters."],
      default: "NPR",
    },

    priceLabel: {
      type: String,
      trim: true,
      maxlength: [120, "Price label snapshot cannot exceed 120 characters."],
      default: "",
    },

    billingCycle: {
      type: String,
      required: [true, "Billing cycle snapshot is required."],
      enum: {
        values: SERVICE_ORDER_BILLING_CYCLES,
        message: "Billing cycle snapshot is not supported.",
      },
    },

    billingLabel: {
      type: String,
      trim: true,
      maxlength: [120, "Billing label snapshot cannot exceed 120 characters."],
      default: "",
    },
  },
  {
    _id: false,
  },
);

const designSnapshotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: [180, "Design name snapshot cannot exceed 180 characters."],
      default: "",
    },

    slug: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [180, "Design slug snapshot cannot exceed 180 characters."],
      default: "",
    },

    thumbnailUrl: {
      type: String,
      trim: true,
      maxlength: [2000, "Design thumbnail snapshot cannot exceed 2000 characters."],
      default: "",
    },
  },
  {
    _id: false,
  },
);

const serviceOrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: [true, "Order number is required."],
      trim: true,
      uppercase: true,
      unique: true,
      immutable: true,
      maxlength: [40, "Order number cannot exceed 40 characters."],
      index: true,
    },

    customerName: {
      type: String,
      required: [true, "Customer name is required."],
      trim: true,
      minlength: [2, "Customer name must contain at least 2 characters."],
      maxlength: [100, "Customer name cannot exceed 100 characters."],
    },

    customerEmail: {
      type: String,
      required: [true, "Customer email is required."],
      trim: true,
      lowercase: true,
      maxlength: [254, "Customer email cannot exceed 254 characters."],
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid customer email address.",
      ],
      index: true,
    },

    customerPhone: {
      type: String,
      required: [true, "Customer phone is required."],
      trim: true,
      minlength: [7, "Customer phone must contain at least 7 characters."],
      maxlength: [30, "Customer phone cannot exceed 30 characters."],
    },

    company: {
      type: String,
      trim: true,
      maxlength: [160, "Company name cannot exceed 160 characters."],
      default: "",
    },

    requirements: {
      type: String,
      required: [true, "Project requirements are required."],
      trim: true,
      minlength: [10, "Project requirements must contain at least 10 characters."],
      maxlength: [5000, "Project requirements cannot exceed 5000 characters."],
    },

    preferredStartDate: {
      type: String,
      trim: true,
      match: [
        /^\d{4}-\d{2}-\d{2}$/,
        "Preferred start date must use YYYY-MM-DD format.",
      ],
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [2000, "Customer notes cannot exceed 2000 characters."],
      default: "",
    },

    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: [true, "Related Service is required."],
      immutable: true,
      index: true,
    },

    serviceSnapshot: {
      type: serviceSnapshotSchema,
      required: [true, "Service snapshot is required."],
      immutable: true,
    },

    servicePackage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServicePackage",
      required: [true, "Related Service Package is required."],
      immutable: true,
      index: true,
    },

    packageSnapshot: {
      type: packageSnapshotSchema,
      required: [true, "Package snapshot is required."],
      immutable: true,
    },

    packageDesign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PackageDesign",
      default: null,
      immutable: true,
      index: true,
    },

    designSnapshot: {
      type: designSnapshotSchema,
      default: () => ({}),
      immutable: true,
    },

    selectionPath: {
      type: String,
      required: [true, "Selection path is required."],
      trim: true,
      maxlength: [2000, "Selection path cannot exceed 2000 characters."],
      immutable: true,
    },

    source: {
      type: String,
      enum: {
        values: ["website"],
        message: "Service Order source is not supported.",
      },
      default: "website",
      immutable: true,
    },

    status: {
      type: String,
      enum: {
        values: SERVICE_ORDER_STATUSES,
        message: "Please select a supported Service Order status.",
      },
      default: "new",
      index: true,
    },

    adminNotes: {
      type: String,
      trim: true,
      maxlength: [5000, "Admin notes cannot exceed 5000 characters."],
      default: "",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "service_orders",
  },
);

serviceOrderSchema.index({
  status: 1,
  createdAt: -1,
});

serviceOrderSchema.index({
  "packageSnapshot.group": 1,
  createdAt: -1,
});

serviceOrderSchema.index({
  service: 1,
  createdAt: -1,
});

serviceOrderSchema.index({
  customerEmail: 1,
  createdAt: -1,
});

const ServiceOrder =
  mongoose.models.ServiceOrder ||
  mongoose.model("ServiceOrder", serviceOrderSchema);

export { SERVICE_ORDER_STATUSES as serviceOrderStatuses };
export default ServiceOrder;
