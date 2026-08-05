import mongoose from "mongoose";

const proficiencyLevels = ["familiar", "proficient", "advanced", "expert"];

function normalizeSkillNameKey(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function removePrivateSkillFields(_document, returnedObject) {
  delete returnedObject.nameKey;

  return returnedObject;
}

function normalizeCategory(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function isValidHttpUrl(value) {
  const cleanValue = String(value || "").trim();

  if (!cleanValue) {
    return true;
  }

  try {
    const parsedUrl = new URL(cleanValue);

    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Skill name is required."],
      trim: true,
      minlength: [2, "Skill name must contain at least 2 characters."],
      maxlength: [120, "Skill name cannot exceed 120 characters."],
    },

    nameKey: {
      type: String,
      required: [true, "Skill name key is required."],
      unique: true,
      trim: true,
      lowercase: true,
      select: false,
    },

    slug: {
      type: String,
      required: [true, "Skill slug is required."],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [2, "Skill slug must contain at least 2 characters."],
      maxlength: [150, "Skill slug cannot exceed 150 characters."],
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Skill slug can contain lowercase letters, numbers and hyphens only.",
      ],
    },

    shortName: {
      type: String,
      trim: true,
      maxlength: [50, "Skill short name cannot exceed 50 characters."],
      default: "",
    },

    description: {
      type: String,
      required: [true, "Skill description is required."],
      trim: true,
      minlength: [10, "Skill description must contain at least 10 characters."],
      maxlength: [500, "Skill description cannot exceed 500 characters."],
    },

    category: {
      type: String,
      required: [true, "Skill category is required."],
      minlength: [2, "Skill category must contain at least 2 characters."],
      maxlength: [100, "Skill category cannot exceed 100 characters."],

      set(value) {
        return normalizeCategory(value);
      },
    },

    proficiencyLevel: {
      type: String,
      required: [true, "Skill proficiency level is required."],
      enum: {
        values: proficiencyLevels,
        message: "Invalid Skill proficiency level.",
      },
    },

    yearsOfExperience: {
      type: Number,
      min: [0, "Years of experience cannot be negative."],
      max: [60, "Years of experience cannot exceed 60 years."],
      default: null,
    },

    icon: {
      type: String,
      trim: true,
      maxlength: [100, "Skill icon cannot exceed 100 characters."],
      default: "",
    },

    iconUrl: {
      type: String,
      trim: true,
      maxlength: [500, "Skill icon URL cannot exceed 500 characters."],
      default: "",
      validate: {
        validator: isValidHttpUrl,
        message: "Skill icon URL must be a valid HTTP or HTTPS URL.",
      },
    },

    order: {
      type: Number,
      min: [0, "Skill display order cannot be negative."],
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
    collection: "skills",

    toJSON: {
      transform: removePrivateSkillFields,
    },

    toObject: {
      transform: removePrivateSkillFields,
    },
  },
);

skillSchema.pre("validate", function setSkillNameKey() {
  this.nameKey = normalizeSkillNameKey(this.name);
});

skillSchema.pre("findOneAndUpdate", function setUpdatedSkillNameKey() {
  const update = this.getUpdate() || {};

  const updatedName =
    update.$set && Object.prototype.hasOwnProperty.call(update.$set, "name")
      ? update.$set.name
      : update.name;

  if (updatedName === undefined) {
    return;
  }

  if (update.$set) {
    update.$set.nameKey = normalizeSkillNameKey(updatedName);
  } else {
    update.nameKey = normalizeSkillNameKey(updatedName);
  }

  this.setUpdate(update);
});

skillSchema.index({
  isVisible: 1,
  isFeatured: 1,
  order: 1,
  createdAt: 1,
});

skillSchema.index({
  category: 1,
  proficiencyLevel: 1,
  order: 1,
});

skillSchema.index({
  name: "text",
  shortName: "text",
  description: "text",
  category: "text",
});

const Skill = mongoose.model("Skill", skillSchema);

export { normalizeSkillNameKey, proficiencyLevels };

export default Skill;
