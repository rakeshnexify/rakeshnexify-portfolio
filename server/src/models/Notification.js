import mongoose from "mongoose";

const NOTIFICATION_TYPES = [
  "contact-message",
  "lead",
  "service-order",
  "appointment",
];

const notificationSchema = new mongoose.Schema(
  {
    eventKey: {
      type: String,
      required: [true, "Notification event key is required."],
      trim: true,
      maxlength: [180, "Notification event key cannot exceed 180 characters."],
      unique: true,
      immutable: true,
      index: true,
    },

    type: {
      type: String,
      required: [true, "Notification type is required."],
      enum: {
        values: NOTIFICATION_TYPES,
        message: "Notification type is not supported.",
      },
      immutable: true,
      index: true,
    },

    title: {
      type: String,
      required: [true, "Notification title is required."],
      trim: true,
      maxlength: [120, "Notification title cannot exceed 120 characters."],
      immutable: true,
    },

    message: {
      type: String,
      required: [true, "Notification message is required."],
      trim: true,
      maxlength: [500, "Notification message cannot exceed 500 characters."],
      immutable: true,
    },

    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Notification resource ID is required."],
      immutable: true,
      index: true,
    },

    targetPath: {
      type: String,
      required: [true, "Notification target path is required."],
      trim: true,
      maxlength: [500, "Notification target path cannot exceed 500 characters."],
      immutable: true,
    },

    readBy: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "AdminUser",
        },
      ],
      default: [],
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
    versionKey: false,
    collection: "adminNotifications",
  },
);

notificationSchema.index({
  createdAt: -1,
  _id: -1,
});

notificationSchema.index({
  type: 1,
  createdAt: -1,
});

notificationSchema.index({
  readBy: 1,
  createdAt: -1,
});

const Notification = mongoose.model(
  "Notification",
  notificationSchema,
);

export { NOTIFICATION_TYPES };

export default Notification;
