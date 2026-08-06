import mongoose from "mongoose";

const EDUCATION_TYPES = [
  "school",
  "college",
  "university",
  "course",
  "training",
  "certification",
  "other",
];

function cleanIdentityPart(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function createEducationIdentityKey({
  institutionName,
  degree,
  fieldOfStudy,
  educationType,
  startDate,
}) {
  const normalizedStartDate = startDate ? new Date(startDate) : null;

  const startDateKey =
    normalizedStartDate && !Number.isNaN(normalizedStartDate.getTime())
      ? normalizedStartDate.toISOString().slice(0, 10)
      : "";

  return [
    cleanIdentityPart(institutionName),
    cleanIdentityPart(degree),
    cleanIdentityPart(fieldOfStudy),
    cleanIdentityPart(educationType),
    startDateKey,
  ].join("|");
}

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

function removePrivateFields(_document, returnedObject) {
  delete returnedObject.identityKey;

  return returnedObject;
}

const educationSchema = new mongoose.Schema(
  {
    institutionName: {
      type: String,
      required: [true, "Institution name is required."],
      trim: true,
      minlength: [2, "Institution name must contain at least 2 characters."],
      maxlength: [180, "Institution name cannot exceed 180 characters."],
    },

    identityKey: {
      type: String,
      required: true,
      select: false,
    },

    slug: {
      type: String,
      required: [true, "Education slug is required."],
      trim: true,
      lowercase: true,
      minlength: [2, "Education slug must contain at least 2 characters."],
      maxlength: [220, "Education slug cannot exceed 220 characters."],
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Education slug can contain lowercase letters, numbers and hyphens only.",
      ],
    },

    degree: {
      type: String,
      required: [true, "Degree or qualification is required."],
      trim: true,
      minlength: [
        2,
        "Degree or qualification must contain at least 2 characters.",
      ],
      maxlength: [180, "Degree or qualification cannot exceed 180 characters."],
    },

    fieldOfStudy: {
      type: String,
      required: [true, "Field of study is required."],
      trim: true,
      minlength: [2, "Field of study must contain at least 2 characters."],
      maxlength: [180, "Field of study cannot exceed 180 characters."],
    },

    educationType: {
      type: String,
      required: [true, "Education type is required."],
      trim: true,
      lowercase: true,
      enum: {
        values: EDUCATION_TYPES,
        message: "Please select a supported education type.",
      },
    },

    startDate: {
      type: Date,
      required: [true, "Education start date is required."],
    },

    endDate: {
      type: Date,
      default: null,
      validate: {
        validator(value) {
          if (!value || !this.startDate) {
            return true;
          }

          return value >= this.startDate;
        },
        message: "Education end date cannot be earlier than the start date.",
      },
    },

    isCurrentlyStudying: {
      type: Boolean,
      default: false,
    },

    grade: {
      type: String,
      trim: true,
      maxlength: [100, "Grade cannot exceed 100 characters."],
      default: "",
    },

    location: {
      type: String,
      trim: true,
      maxlength: [180, "Location cannot exceed 180 characters."],
      default: "",
    },

    shortDescription: {
      type: String,
      required: [true, "Short education description is required."],
      trim: true,
      minlength: [
        10,
        "Short education description must contain at least 10 characters.",
      ],
      maxlength: [
        600,
        "Short education description cannot exceed 600 characters.",
      ],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [5000, "Education description cannot exceed 5000 characters."],
      default: "",
    },

    institutionUrl: {
      type: String,
      trim: true,
      maxlength: [500, "Institution URL cannot exceed 500 characters."],
      default: "",
      validate: {
        validator: isValidHttpUrl,
        message:
          "Institution URL must be a complete http:// or https:// URL without login credentials.",
      },
    },

    certificateUrl: {
      type: String,
      trim: true,
      maxlength: [500, "Certificate URL cannot exceed 500 characters."],
      default: "",
      validate: {
        validator: isValidHttpUrl,
        message:
          "Certificate URL must be a complete http:// or https:// URL without login credentials.",
      },
    },

    logoUrl: {
      type: String,
      trim: true,
      maxlength: [500, "Logo URL cannot exceed 500 characters."],
      default: "",
      validate: {
        validator: isValidHttpUrl,
        message:
          "Logo URL must be a complete http:// or https:// URL without login credentials.",
      },
    },

    order: {
      type: Number,
      min: [0, "Education display order cannot be negative."],
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
      required: [true, "Education creator is required."],
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      required: [true, "Education updater is required."],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "education",

    toJSON: {
      transform: removePrivateFields,
    },

    toObject: {
      transform: removePrivateFields,
    },
  },
);

educationSchema.pre("validate", function prepareEducationForValidation() {
  if (this.isCurrentlyStudying) {
    this.endDate = null;
  }

  if (
    this.isNew ||
    this.isModified("institutionName") ||
    this.isModified("degree") ||
    this.isModified("fieldOfStudy") ||
    this.isModified("educationType") ||
    this.isModified("startDate")
  ) {
    this.identityKey = createEducationIdentityKey({
      institutionName: this.institutionName,
      degree: this.degree,
      fieldOfStudy: this.fieldOfStudy,
      educationType: this.educationType,
      startDate: this.startDate,
    });
  }
});

educationSchema.index(
  {
    slug: 1,
  },
  {
    unique: true,
    name: "education_unique_slug",
  },
);

educationSchema.index(
  {
    identityKey: 1,
  },
  {
    unique: true,
    name: "education_unique_identity",
  },
);

educationSchema.index(
  {
    isVisible: 1,
    isFeatured: -1,
    order: 1,
    startDate: -1,
    _id: 1,
  },
  {
    name: "education_public_listing",
  },
);

educationSchema.index(
  {
    educationType: 1,
    isVisible: 1,
    isFeatured: 1,
    order: 1,
    startDate: -1,
    _id: 1,
  },
  {
    name: "education_admin_filters",
  },
);

const Education = mongoose.model("Education", educationSchema);

export { EDUCATION_TYPES, createEducationIdentityKey, isValidHttpUrl };

export default Education;
