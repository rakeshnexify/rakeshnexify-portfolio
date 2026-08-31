import mongoose from "mongoose";

const adminPushSubscriptionSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      required: [true, "Admin is required."],
      index: true,
    },
    endpointHash: {
      type: String,
      required: [true, "Push endpoint hash is required."],
      trim: true,
      minlength: 64,
      maxlength: 64,
      unique: true,
      immutable: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: [true, "Push endpoint is required."],
      trim: true,
      maxlength: [2048, "Push endpoint cannot exceed 2048 characters."],
    },
    keys: {
      p256dh: {
        type: String,
        required: [true, "Push p256dh key is required."],
        trim: true,
        maxlength: [512, "Push p256dh key is invalid."],
      },
      auth: {
        type: String,
        required: [true, "Push auth key is required."],
        trim: true,
        maxlength: [256, "Push auth key is invalid."],
      },
    },
    expirationTime: {
      type: Date,
      default: null,
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: [500, "Push device description is too long."],
      default: "",
    },
    lastSuccessAt: {
      type: Date,
      default: null,
    },
    failureCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    disabledAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "adminPushSubscriptions",
  },
);

adminPushSubscriptionSchema.index({
  admin: 1,
  disabledAt: 1,
  updatedAt: -1,
});

const AdminPushSubscription = mongoose.model(
  "AdminPushSubscription",
  adminPushSubscriptionSchema,
);

export default AdminPushSubscription;
