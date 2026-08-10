import mongoose from "mongoose";

const FAQ_QUESTION_MIN_LENGTH = 5;
const FAQ_QUESTION_MAX_LENGTH = 300;
const FAQ_ANSWER_MIN_LENGTH = 10;
const FAQ_ANSWER_MAX_LENGTH = 5000;
const FAQ_CATEGORY_MIN_LENGTH = 2;
const FAQ_CATEGORY_MAX_LENGTH = 80;
const FAQ_ORDER_MAX = 1000000;

function normalizeSingleLineText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeFaqIdentity(value) {
  return normalizeSingleLineText(value).toLocaleLowerCase("en-US");
}

function removePrivateFaqFields(_document, returnedObject) {
  delete returnedObject.questionKey;
  delete returnedObject.categoryKey;

  return returnedObject;
}

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, "FAQ question is required."],
      trim: true,
      minlength: [
        FAQ_QUESTION_MIN_LENGTH,
        `FAQ question must contain at least ${FAQ_QUESTION_MIN_LENGTH} characters.`,
      ],
      maxlength: [
        FAQ_QUESTION_MAX_LENGTH,
        `FAQ question cannot exceed ${FAQ_QUESTION_MAX_LENGTH} characters.`,
      ],
    },

    questionKey: {
      type: String,
      required: true,
      select: false,
    },

    answer: {
      type: String,
      required: [true, "FAQ answer is required."],
      trim: true,
      minlength: [
        FAQ_ANSWER_MIN_LENGTH,
        `FAQ answer must contain at least ${FAQ_ANSWER_MIN_LENGTH} characters.`,
      ],
      maxlength: [
        FAQ_ANSWER_MAX_LENGTH,
        `FAQ answer cannot exceed ${FAQ_ANSWER_MAX_LENGTH} characters.`,
      ],
    },

    category: {
      type: String,
      required: [true, "FAQ category is required."],
      trim: true,
      minlength: [
        FAQ_CATEGORY_MIN_LENGTH,
        `FAQ category must contain at least ${FAQ_CATEGORY_MIN_LENGTH} characters.`,
      ],
      maxlength: [
        FAQ_CATEGORY_MAX_LENGTH,
        `FAQ category cannot exceed ${FAQ_CATEGORY_MAX_LENGTH} characters.`,
      ],
    },

    categoryKey: {
      type: String,
      required: true,
      select: false,
    },

    order: {
      type: Number,
      min: [0, "FAQ display order cannot be negative."],
      max: [
        FAQ_ORDER_MAX,
        `FAQ display order cannot exceed ${FAQ_ORDER_MAX}.`,
      ],
      default: 0,
      validate: {
        validator: Number.isSafeInteger,
        message: "FAQ display order must be a whole number.",
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
      required: [true, "FAQ creator is required."],
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      required: [true, "FAQ updater is required."],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "faqs",
    toJSON: {
      transform: removePrivateFaqFields,
    },
    toObject: {
      transform: removePrivateFaqFields,
    },
  },
);

faqSchema.pre("validate", function prepareFaqIdentityFields() {
  if (this.isModified("question")) {
    this.question = normalizeSingleLineText(this.question);
    this.questionKey = normalizeFaqIdentity(this.question);
  }

  if (this.isModified("category")) {
    this.category = normalizeSingleLineText(this.category);
    this.categoryKey = normalizeFaqIdentity(this.category);
  }
});

faqSchema.index(
  {
    questionKey: 1,
  },
  {
    unique: true,
    name: "faq_question_identity_unique",
  },
);

faqSchema.index(
  {
    isVisible: 1,
    isFeatured: -1,
    order: 1,
    categoryKey: 1,
    question: 1,
    _id: 1,
  },
  {
    name: "faq_public_listing",
  },
);

faqSchema.index(
  {
    categoryKey: 1,
    isVisible: 1,
    isFeatured: 1,
    order: 1,
    question: 1,
    _id: 1,
  },
  {
    name: "faq_admin_filters",
  },
);

const Faq = mongoose.model("Faq", faqSchema);

export {
  FAQ_ANSWER_MAX_LENGTH,
  FAQ_ANSWER_MIN_LENGTH,
  FAQ_CATEGORY_MAX_LENGTH,
  FAQ_CATEGORY_MIN_LENGTH,
  FAQ_ORDER_MAX,
  FAQ_QUESTION_MAX_LENGTH,
  FAQ_QUESTION_MIN_LENGTH,
  normalizeFaqIdentity,
  normalizeSingleLineText,
};

export default Faq;
