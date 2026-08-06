import mongoose from "mongoose";

const EMPLOYMENT_TYPES = [
  "full-time",
  "part-time",
  "freelance",
  "contract",
  "internship",
  "self-employed",
  "founder",
  "volunteer",
  "other",
];

const LOCATION_TYPES = ["onsite", "remote", "hybrid"];

const EXPERIENCE_ARRAY_LIMITS = {
  responsibilities: {
    maxItems: 30,
    maxLength: 300,
  },
  achievements: {
    maxItems: 30,
    maxLength: 300,
  },
  skills: {
    maxItems: 50,
    maxLength: 100,
  },
  tools: {
    maxItems: 50,
    maxLength: 100,
  },
};

function cleanIdentityPart(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function createExperienceIdentityKey({
  organizationName,
  jobTitle,
  employmentType,
  startDate,
}) {
  const normalizedStartDate = startDate ? new Date(startDate) : null;

  const startDateKey =
    normalizedStartDate && !Number.isNaN(normalizedStartDate.getTime())
      ? normalizedStartDate.toISOString().slice(0, 10)
      : "";

  return [
    cleanIdentityPart(organizationName),
    cleanIdentityPart(jobTitle),
    cleanIdentityPart(employmentType),
    startDateKey,
  ].join("|");
}

function normalizeExperienceStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const uniqueValues = new Map();

  value.forEach((item) => {
    const cleanValue = String(item ?? "")
      .trim()
      .replace(/\s+/g, " ");

    if (!cleanValue) {
      return;
    }

    const normalizedKey = cleanValue.toLowerCase();

    if (!uniqueValues.has(normalizedKey)) {
      uniqueValues.set(normalizedKey, cleanValue);
    }
  });

  return [...uniqueValues.values()];
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

function createStringArrayField(fieldName, itemLabel) {
  const limits = EXPERIENCE_ARRAY_LIMITS[fieldName];

  return {
    type: [
      {
        type: String,
        trim: true,
        maxlength: [
          limits.maxLength,
          `${itemLabel} cannot exceed ${limits.maxLength} characters.`,
        ],
      },
    ],
    default: [],
    validate: {
      validator(value) {
        return Array.isArray(value) && value.length <= limits.maxItems;
      },
      message: `${fieldName} cannot contain more than ${limits.maxItems} items.`,
    },
  };
}

const experienceSchema = new mongoose.Schema(
  {
    organizationName: {
      type: String,
      required: [true, "Organization name is required."],
      trim: true,
      minlength: [2, "Organization name must contain at least 2 characters."],
      maxlength: [180, "Organization name cannot exceed 180 characters."],
    },

    identityKey: {
      type: String,
      required: true,
      select: false,
    },

    slug: {
      type: String,
      required: [true, "Experience slug is required."],
      trim: true,
      lowercase: true,
      minlength: [2, "Experience slug must contain at least 2 characters."],
      maxlength: [220, "Experience slug cannot exceed 220 characters."],
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Experience slug can contain lowercase letters, numbers and hyphens only.",
      ],
    },

    jobTitle: {
      type: String,
      required: [true, "Job title or professional role is required."],
      trim: true,
      minlength: [
        2,
        "Job title or professional role must contain at least 2 characters.",
      ],
      maxlength: [
        180,
        "Job title or professional role cannot exceed 180 characters.",
      ],
    },

    employmentType: {
      type: String,
      required: [true, "Employment type is required."],
      trim: true,
      lowercase: true,
      enum: {
        values: EMPLOYMENT_TYPES,
        message: "Please select a supported employment type.",
      },
    },

    startDate: {
      type: Date,
      required: [true, "Experience start date is required."],
    },

    endDate: {
      type: Date,
      default: null,
      required: [
        function isExperienceEndDateRequired() {
          return !this.isCurrent;
        },
        "Experience end date is required when the position is not current.",
      ],
      validate: {
        validator(value) {
          if (!value || !this.startDate) {
            return true;
          }

          return value >= this.startDate;
        },
        message: "Experience end date cannot be earlier than the start date.",
      },
    },

    isCurrent: {
      type: Boolean,
      default: false,
    },

    location: {
      type: String,
      trim: true,
      maxlength: [180, "Experience location cannot exceed 180 characters."],
      default: "",
    },

    locationType: {
      type: String,
      trim: true,
      lowercase: true,
      enum: {
        values: ["", ...LOCATION_TYPES],
        message: "Please select a supported location type.",
      },
      default: "",
    },

    shortDescription: {
      type: String,
      required: [true, "Short Experience description is required."],
      trim: true,
      minlength: [
        10,
        "Short Experience description must contain at least 10 characters.",
      ],
      maxlength: [
        600,
        "Short Experience description cannot exceed 600 characters.",
      ],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [
        5000,
        "Experience description cannot exceed 5000 characters.",
      ],
      default: "",
    },

    responsibilities: createStringArrayField(
      "responsibilities",
      "Each responsibility",
    ),

    achievements: createStringArrayField(
      "achievements",
      "Each achievement",
    ),

    skills: createStringArrayField("skills", "Each Skill"),

    tools: createStringArrayField("tools", "Each tool"),

    organizationLogoUrl: {
      type: String,
      trim: true,
      maxlength: [
        500,
        "Organization logo URL cannot exceed 500 characters.",
      ],
      default: "",
      validate: {
        validator: isValidHttpUrl,
        message:
          "Organization logo URL must be a complete http:// or https:// URL without login credentials.",
      },
    },

    organizationWebsiteUrl: {
      type: String,
      trim: true,
      maxlength: [
        500,
        "Organization website URL cannot exceed 500 characters.",
      ],
      default: "",
      validate: {
        validator: isValidHttpUrl,
        message:
          "Organization website URL must be a complete http:// or https:// URL without login credentials.",
      },
    },

    order: {
      type: Number,
      min: [0, "Experience display order cannot be negative."],
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
      required: [true, "Experience creator is required."],
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      required: [true, "Experience updater is required."],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "experiences",

    toJSON: {
      transform: removePrivateFields,
    },

    toObject: {
      transform: removePrivateFields,
    },
  },
);

experienceSchema.pre("validate", function prepareExperienceForValidation() {
  if (this.isCurrent) {
    this.endDate = null;
  }

  ["responsibilities", "achievements", "skills", "tools"].forEach(
    (fieldName) => {
      this[fieldName] = normalizeExperienceStringArray(this[fieldName]);
    },
  );

  if (
    this.isNew ||
    this.isModified("organizationName") ||
    this.isModified("jobTitle") ||
    this.isModified("employmentType") ||
    this.isModified("startDate")
  ) {
    this.identityKey = createExperienceIdentityKey({
      organizationName: this.organizationName,
      jobTitle: this.jobTitle,
      employmentType: this.employmentType,
      startDate: this.startDate,
    });
  }
});

experienceSchema.index(
  {
    slug: 1,
  },
  {
    unique: true,
    name: "experience_unique_slug",
  },
);

experienceSchema.index(
  {
    identityKey: 1,
  },
  {
    unique: true,
    name: "experience_unique_identity",
  },
);

experienceSchema.index(
  {
    isVisible: 1,
    isFeatured: -1,
    order: 1,
    startDate: -1,
    _id: 1,
  },
  {
    name: "experience_public_listing",
  },
);

experienceSchema.index(
  {
    employmentType: 1,
    isCurrent: 1,
    isVisible: 1,
    isFeatured: 1,
    order: 1,
    startDate: -1,
    _id: 1,
  },
  {
    name: "experience_admin_filters",
  },
);

const Experience = mongoose.model("Experience", experienceSchema);

export {
  EMPLOYMENT_TYPES,
  EXPERIENCE_ARRAY_LIMITS,
  LOCATION_TYPES,
  createExperienceIdentityKey,
  isValidHttpUrl,
  normalizeExperienceStringArray,
};

export default Experience;
