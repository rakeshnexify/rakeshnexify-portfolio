import mongoose from "mongoose";

const SUBSCRIBER_STATUSES = [
  "active",
  "unsubscribed",
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: EMAIL_PATTERN,
    },

    status: {
      type: String,
      required: true,
      enum: SUBSCRIBER_STATUSES,
      default: "active",
    },

    consentAccepted: {
      type: Boolean,
      required: true,
      validate: {
        validator(value) {
          return value === true;
        },
        message: "Newsletter consent must be explicitly accepted.",
      },
    },

    consentedAt: {
      type: Date,
      required: true,
    },

    subscribedAt: {
      type: Date,
      required: true,
    },

    unsubscribedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "subscribers",
  },
);

subscriberSchema.index(
  {
    email: 1,
  },
  {
    unique: true,
    name: "subscriber_email_unique",
  },
);

subscriberSchema.index({
  status: 1,
  subscribedAt: -1,
  _id: -1,
});

subscriberSchema.index({
  subscribedAt: -1,
});

const Subscriber = mongoose.model(
  "Subscriber",
  subscriberSchema,
);

export { SUBSCRIBER_STATUSES };

export default Subscriber;
