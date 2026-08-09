import mongoose from "mongoose";

const CERTIFICATION_ACHIEVEMENT_TYPES = [
  "certification",
  "license",
  "award",
  "achievement",
];

const MAX_CERTIFICATION_ACHIEVEMENT_ORDER = 1_000_000;

function normalizeIdentityPart(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function createCertificationAchievementIdentityKey({
  type,
  title,
  issuerName,
  issueDate,
}) {
  const normalizedIssueDate = issueDate ? new Date(issueDate) : null;

  const issueDateKey =
    normalizedIssueDate && !Number.isNaN(normalizedIssueDate.getTime())
      ? normalizedIssueDate.toISOString().slice(0, 10)
      : "";

  return [
    normalizeIdentityPart(type),
    normalizeIdentityPart(title),
    normalizeIdentityPart(issuerName),
    issueDateKey,
  ].join("|");
}

function isValidCredentialFreeHttpUrl(value) {
  const cleanValue = String(value ?? "").trim();

  if (!cleanValue) {
    return true;
  }

  try {
    const parsedUrl = new URL(cleanValue);

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

function removePrivateFields(_document, returnedObject) {
  delete returnedObject.identityKey;

  return returnedObject;
}

const certificationAchievementSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, "Certification/Achievement type is required."],
      trim: true,
      lowercase: true,
      enum: {
        values: CERTIFICATION_ACHIEVEMENT_TYPES,
        message: "Please select a supported Certification/Achievement type.",
      },
    },

    title: {
      type: String,
      required: [true, "Title is required."],
      trim: true,
      minlength: [2, "Title must contain at least 2 characters."],
      maxlength: [180, "Title cannot exceed 180 characters."],
    },

    identityKey: {
      type: String,
      required: true,
      select: false,
    },

    slug: {
      type: String,
      required: [true, "Slug is required."],
      trim: true,
      lowercase: true,
      minlength: [2, "Slug must contain at least 2 characters."],
      maxlength: [220, "Slug cannot exceed 220 characters."],
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug can contain lowercase letters, numbers and hyphens only.",
      ],
    },

    issuerName: {
      type: String,
      trim: true,
      maxlength: [180, "Issuer name cannot exceed 180 characters."],
      default: "",
      validate: {
        validator(value) {
          const cleanValue = String(value ?? "").trim();

          if (this.type === "achievement") {
            return !cleanValue || cleanValue.length >= 2;
          }

          return cleanValue.length >= 2;
        },
        message(props) {
          return props.value
            ? "Issuer name must contain at least 2 characters."
            : "Issuer name is required for certifications, licenses and awards.";
        },
      },
    },

    shortDescription: {
      type: String,
      required: [true, "Short description is required."],
      trim: true,
      minlength: [
        10,
        "Short description must contain at least 10 characters.",
      ],
      maxlength: [600, "Short description cannot exceed 600 characters."],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [5000, "Description cannot exceed 5000 characters."],
      default: "",
    },

    issueDate: {
      type: Date,
      required: [true, "Issue date is required."],
    },

    doesNotExpire: {
      type: Boolean,
      default: false,
    },

    expirationDate: {
      type: Date,
      default: null,
      validate: {
        validator(value) {
          if (!value || this.doesNotExpire || !this.issueDate) {
            return true;
          }

          return value >= this.issueDate;
        },
        message: "Expiration date cannot be earlier than the issue date.",
      },
    },

    credentialId: {
      type: String,
      trim: true,
      maxlength: [250, "Credential ID cannot exceed 250 characters."],
      default: "",
    },

    verificationUrl: {
      type: String,
      trim: true,
      maxlength: [500, "Verification URL cannot exceed 500 characters."],
      default: "",
      validate: {
        validator: isValidCredentialFreeHttpUrl,
        message:
          "Verification URL must be a complete http:// or https:// URL without login credentials.",
      },
    },

    mediaUrl: {
      type: String,
      trim: true,
      maxlength: [500, "Media URL cannot exceed 500 characters."],
      default: "",
      validate: {
        validator: isValidCredentialFreeHttpUrl,
        message:
          "Media URL must be a complete http:// or https:// URL without login credentials.",
      },
    },

    mediaAlt: {
      type: String,
      trim: true,
      maxlength: [250, "Media alt text cannot exceed 250 characters."],
      default: "",
    },

    relatedEducation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Education",
      default: null,
    },

    relatedExperience: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Experience",
      default: null,
    },

    order: {
      type: Number,
      min: [0, "Display order cannot be negative."],
      max: [
        MAX_CERTIFICATION_ACHIEVEMENT_ORDER,
        `Display order cannot exceed ${MAX_CERTIFICATION_ACHIEVEMENT_ORDER}.`,
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
    collection: "certification_achievements",

    toJSON: {
      transform: removePrivateFields,
    },

    toObject: {
      transform: removePrivateFields,
    },
  },
);

certificationAchievementSchema.pre(
  "validate",
  function prepareCertificationAchievementForValidation() {
    if (this.doesNotExpire) {
      this.expirationDate = null;
    }

    this.identityKey = createCertificationAchievementIdentityKey({
      type: this.type,
      title: this.title,
      issuerName: this.issuerName,
      issueDate: this.issueDate,
    });
  },
);

certificationAchievementSchema.index(
  {
    slug: 1,
  },
  {
    unique: true,
    name: "certification_achievement_unique_slug",
  },
);

certificationAchievementSchema.index(
  {
    identityKey: 1,
  },
  {
    unique: true,
    name: "certification_achievement_unique_identity",
  },
);

certificationAchievementSchema.index(
  {
    isVisible: 1,
    isFeatured: -1,
    order: 1,
    issueDate: -1,
    _id: 1,
  },
  {
    name: "certification_achievement_public_listing",
  },
);

certificationAchievementSchema.index(
  {
    type: 1,
    isVisible: 1,
    isFeatured: 1,
    expirationDate: 1,
    order: 1,
    issueDate: -1,
    _id: 1,
  },
  {
    name: "certification_achievement_admin_filters",
  },
);

const CertificationAchievement = mongoose.model(
  "CertificationAchievement",
  certificationAchievementSchema,
);

export {
  CERTIFICATION_ACHIEVEMENT_TYPES,
  MAX_CERTIFICATION_ACHIEVEMENT_ORDER,
  createCertificationAchievementIdentityKey,
  isValidCredentialFreeHttpUrl,
};

export default CertificationAchievement;
