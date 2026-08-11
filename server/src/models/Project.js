import mongoose from "mongoose";

const projectLinkSchema = new mongoose.Schema(
  {
    liveUrl: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    sourceCodeUrl: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    caseStudyUrl: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    videoUrl: {
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

const projectImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, "Project image URL is required."],
      trim: true,
      maxlength: 500,
    },

    alt: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    caption: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },

    order: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    _id: true,
  },
);

const projectResultSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, "Result label is required."],
      trim: true,
      maxlength: 100,
    },

    value: {
      type: String,
      required: [true, "Result value is required."],
      trim: true,
      maxlength: 100,
    },
  },
  {
    _id: true,
  },
);


const projectCaseStudySchema = new mongoose.Schema(
  {
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    order: {
      type: Number,
      min: [0, "Case study order cannot be negative."],
      default: 0,
      index: true,
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
        if (!Array.isArray(keywords)) {
          return [];
        }

        return keywords
          .map((keyword) => String(keyword).trim().toLowerCase())
          .filter(Boolean);
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

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Project title is required."],
      trim: true,
      minlength: [2, "Project title must contain at least 2 characters."],
      maxlength: [150, "Project title cannot exceed 150 characters."],
    },

    slug: {
      type: String,
      required: [true, "Project slug is required."],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [2, "Project slug must contain at least 2 characters."],
      maxlength: [180, "Project slug cannot exceed 180 characters."],
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Project slug can contain lowercase letters, numbers and hyphens only.",
      ],
    },

    shortDescription: {
      type: String,
      required: [true, "Project short description is required."],
      trim: true,
      minlength: [
        10,
        "Project short description must contain at least 10 characters.",
      ],
      maxlength: [
        350,
        "Project short description cannot exceed 350 characters.",
      ],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [10000, "Project description cannot exceed 10000 characters."],
      default: "",
    },

    category: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
      index: true,
    },

    projectType: {
      type: String,
      enum: {
        values: ["personal", "client", "company", "open-source", "practice"],
        message: "Invalid project type.",
      },
      default: "personal",
      index: true,
    },

    clientName: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },

    role: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    status: {
      type: String,
      enum: {
        values: [
          "planning",
          "in-progress",
          "completed",
          "maintained",
          "archived",
        ],
        message: "Invalid project status.",
      },
      default: "completed",
      index: true,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    coverImageUrl: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    images: {
      type: [projectImageSchema],
      default: [],
    },

    technologies: {
      type: [String],
      default: [],
      set(technologies) {
        if (!Array.isArray(technologies)) {
          return [];
        }

        return technologies
          .map((technology) => String(technology).trim())
          .filter(Boolean);
      },
    },

    features: {
      type: [String],
      default: [],
      set(features) {
        if (!Array.isArray(features)) {
          return [];
        }

        return features
          .map((feature) => String(feature).trim())
          .filter(Boolean);
      },
    },

    challenges: {
      type: [String],
      default: [],
      set(challenges) {
        if (!Array.isArray(challenges)) {
          return [];
        }

        return challenges
          .map((challenge) => String(challenge).trim())
          .filter(Boolean);
      },
    },

    solutions: {
      type: [String],
      default: [],
      set(solutions) {
        if (!Array.isArray(solutions)) {
          return [];
        }

        return solutions
          .map((solution) => String(solution).trim())
          .filter(Boolean);
      },
    },

    results: {
      type: [projectResultSchema],
      default: [],
    },

    links: {
      type: projectLinkSchema,
      default: () => ({}),
    },

    caseStudy: {
      type: projectCaseStudySchema,
      default: () => ({}),
    },

    order: {
      type: Number,
      min: [0, "Project order cannot be negative."],
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
    collection: "projects",
  },
);

projectSchema.index({
  isVisible: 1,
  isFeatured: 1,
  order: 1,
  createdAt: -1,
});

projectSchema.index({
  isVisible: 1,
  "caseStudy.isPublished": 1,
  "caseStudy.isFeatured": -1,
  "caseStudy.order": 1,
  order: 1,
  createdAt: 1,
});

projectSchema.index({
  title: "text",
  shortDescription: "text",
  description: "text",
  category: "text",
  technologies: "text",
});

const Project = mongoose.model("Project", projectSchema);

export default Project;
