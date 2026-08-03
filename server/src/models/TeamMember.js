import mongoose from "mongoose";

function cleanStringArray(items, { lowercase = false } = {}) {
  if (!Array.isArray(items)) {
    return [];
  }

  const cleanItems = items
    .map((item) => String(item).trim())
    .filter(Boolean)
    .map((item) => (lowercase ? item.toLowerCase() : item));

  return [...new Set(cleanItems)];
}

const socialLinksSchema = new mongoose.Schema(
  {
    github: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    linkedin: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    facebook: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    instagram: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    youtube: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    x: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  {
    _id: false,
  },
);

const seoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      maxlength: 70,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      maxlength: 180,
      default: "",
    },

    keywords: {
      type: [String],
      default: [],

      set(keywords) {
        return cleanStringArray(keywords, {
          lowercase: true,
        });
      },
    },

    ogImageUrl: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  {
    _id: false,
  },
);

const teamMemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Team member name is required."],
      trim: true,
      minlength: [2, "Team member name must contain at least 2 characters."],
      maxlength: [150, "Team member name cannot exceed 150 characters."],
    },

    slug: {
      type: String,
      required: [true, "Team member slug is required."],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [2, "Team member slug must contain at least 2 characters."],
      maxlength: [180, "Team member slug cannot exceed 180 characters."],
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Team member slug can contain lowercase letters, numbers and hyphens only.",
      ],
    },

    professionalRole: {
      type: String,
      required: [true, "Professional role is required."],
      trim: true,
      minlength: [2, "Professional role must contain at least 2 characters."],
      maxlength: [150, "Professional role cannot exceed 150 characters."],
      index: true,
    },

    teamPosition: {
      type: String,
      trim: true,
      maxlength: [150, "Team position cannot exceed 150 characters."],
      default: "",
    },

    shortIntroduction: {
      type: String,
      required: [true, "Short introduction is required."],
      trim: true,
      minlength: [
        10,
        "Short introduction must contain at least 10 characters.",
      ],
      maxlength: [400, "Short introduction cannot exceed 400 characters."],
    },

    biography: {
      type: String,
      trim: true,
      maxlength: [10000, "Biography cannot exceed 10000 characters."],
      default: "",
    },

    profileImageUrl: {
      type: String,
      trim: true,
      maxlength: [500, "Profile image URL cannot exceed 500 characters."],
      default: "",
    },

    profileImageAlt: {
      type: String,
      trim: true,
      maxlength: [200, "Profile image alt text cannot exceed 200 characters."],
      default: "",
    },

    coverImageUrl: {
      type: String,
      trim: true,
      maxlength: [500, "Cover image URL cannot exceed 500 characters."],
      default: "",
    },

    skills: {
      type: [String],
      default: [],

      set(skills) {
        return cleanStringArray(skills);
      },
    },

    tools: {
      type: [String],
      default: [],

      set(tools) {
        return cleanStringArray(tools);
      },
    },

    status: {
      type: String,
      enum: {
        values: ["active", "inactive", "former", "archived"],
        message: "Invalid team member status.",
      },
      default: "active",
      index: true,
    },

    availabilityStatus: {
      type: String,
      enum: {
        values: ["available", "limited", "unavailable", "on-leave"],
        message: "Invalid availability status.",
      },
      default: "available",
      index: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [254, "Email address cannot exceed 254 characters."],
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      maxlength: [50, "Phone number cannot exceed 50 characters."],
      default: "",
    },

    websiteUrl: {
      type: String,
      trim: true,
      maxlength: [500, "Website URL cannot exceed 500 characters."],
      default: "",
    },

    portfolioUrl: {
      type: String,
      trim: true,
      maxlength: [500, "Portfolio URL cannot exceed 500 characters."],
      default: "",
    },

    socialLinks: {
      type: socialLinksSchema,
      default: () => ({}),
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

    relatedCompanies: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Company",
        },
      ],
      default: [],
    },

    relatedServices: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Service",
        },
      ],
      default: [],
    },

    order: {
      type: Number,
      min: [0, "Team member order cannot be negative."],
      default: 0,
      index: true,
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
    collection: "teamMembers",
  },
);

teamMemberSchema.index({
  isVisible: 1,
  isFeatured: 1,
  order: 1,
  createdAt: -1,
});

teamMemberSchema.index({
  status: 1,
  availabilityStatus: 1,
  order: 1,
});

teamMemberSchema.index({
  name: "text",
  professionalRole: "text",
  teamPosition: "text",
  shortIntroduction: "text",
  biography: "text",
  skills: "text",
  tools: "text",
});

const TeamMember = mongoose.model("TeamMember", teamMemberSchema);

export default TeamMember;
