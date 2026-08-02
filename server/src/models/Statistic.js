import mongoose from "mongoose";

const statisticSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, "Statistic key is required."],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [2, "Statistic key must contain at least 2 characters."],
      maxlength: [100, "Statistic key cannot exceed 100 characters."],
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Statistic key can contain lowercase letters, numbers and hyphens only.",
      ],
    },

    label: {
      type: String,
      required: [true, "Statistic label is required."],
      trim: true,
      minlength: [2, "Statistic label must contain at least 2 characters."],
      maxlength: [120, "Statistic label cannot exceed 120 characters."],
    },

    value: {
      type: String,
      required: [true, "Statistic value is required."],
      trim: true,
      maxlength: [50, "Statistic value cannot exceed 50 characters."],
    },

    prefix: {
      type: String,
      trim: true,
      maxlength: [20, "Statistic prefix cannot exceed 20 characters."],
      default: "",
    },

    suffix: {
      type: String,
      trim: true,
      maxlength: [20, "Statistic suffix cannot exceed 20 characters."],
      default: "",
    },

    description: {
      type: String,
      trim: true,
      maxlength: [300, "Statistic description cannot exceed 300 characters."],
      default: "",
    },

    icon: {
      type: String,
      trim: true,
      maxlength: [100, "Statistic icon cannot exceed 100 characters."],
      default: "",
    },

    iconUrl: {
      type: String,
      trim: true,
      maxlength: [500, "Statistic icon URL cannot exceed 500 characters."],
      default: "",
    },

    order: {
      type: Number,
      min: [0, "Statistic display order cannot be negative."],
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
    collection: "statistics",
  },
);

statisticSchema.index({
  isVisible: 1,
  isFeatured: 1,
  order: 1,
  createdAt: -1,
});

statisticSchema.index({
  label: "text",
  description: "text",
});

const Statistic = mongoose.model("Statistic", statisticSchema);

export default Statistic;
