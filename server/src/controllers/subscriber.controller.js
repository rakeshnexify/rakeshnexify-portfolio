import mongoose from "mongoose";

import Subscriber from "../models/Subscriber.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const allowedCreateFields = new Set([
  "email",
  "consentAccepted",
  "website",
]);

const genericSuccessResponse = {
  success: true,
  message:
    "Your newsletter subscription request has been received.",
};

const MAX_TRANSACTION_ATTEMPTS = 3;

function isPlainBody(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value),
  );
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(
    object,
    key,
  );
}

function addFieldError(
  fieldErrors,
  fieldName,
  message,
) {
  if (!fieldErrors[fieldName]) {
    fieldErrors[fieldName] = message;
  }
}

function hasFieldErrors(fieldErrors) {
  return Object.keys(fieldErrors).length > 0;
}

function buildMongooseFieldErrors(error) {
  const fieldErrors = {};

  if (error?.name !== "ValidationError") {
    return fieldErrors;
  }

  Object.entries(error.errors || {}).forEach(
    ([fieldName, fieldError]) => {
      fieldErrors[fieldName] =
        fieldError?.message ||
        "This value is invalid.";
    },
  );

  return fieldErrors;
}

function isSubscriberEmailDuplicate(error) {
  return Boolean(
    error?.code === 11000 &&
      (error?.keyPattern?.email ||
        error?.keyValue?.email),
  );
}

function createSubscriberStateRetryError() {
  const error = new Error(
    "Subscriber state changed during the request.",
  );

  error.code = "SUBSCRIBER_STATE_RETRY";

  return error;
}

function hasMongoErrorLabel(error, label) {
  return Boolean(
    typeof error?.hasErrorLabel === "function" &&
      error.hasErrorLabel(label),
  );
}

function isRetryableSubscriberTransactionError(
  error,
) {
  return Boolean(
    isSubscriberEmailDuplicate(error) ||
      error?.code ===
        "SUBSCRIBER_STATE_RETRY" ||
      error?.code === 112 ||
      hasMongoErrorLabel(
        error,
        "TransientTransactionError",
      ) ||
      hasMongoErrorLabel(
        error,
        "UnknownTransactionCommitResult",
      ),
  );
}

async function abortTransactionSafely(session) {
  if (!session.inTransaction()) {
    return;
  }

  try {
    await session.abortTransaction();
  } catch {
    /*
     * The original transaction error remains authoritative.
     * Abort cleanup failures must not hide it.
     */
  }
}

async function ensureActiveSubscription(email) {
  let lastError = null;

  for (
    let attempt = 1;
    attempt <= MAX_TRANSACTION_ATTEMPTS;
    attempt += 1
  ) {
    const session =
      await mongoose.startSession();

    try {
      session.startTransaction();

      const existingSubscriber =
        await Subscriber.findOne({
          email,
        })
          .select("_id status")
          .session(session)
          .lean();

      const now = new Date();

      if (!existingSubscriber) {
        const subscriber =
          new Subscriber({
            email,
            status: "active",
            consentAccepted: true,
            consentedAt: now,
            subscribedAt: now,
            unsubscribedAt: null,
          });

        await subscriber.save({
          session,
        });
      } else if (
        existingSubscriber.status ===
        "unsubscribed"
      ) {
        const reactivationResult =
          await Subscriber.updateOne(
            {
              _id:
                existingSubscriber._id,
              status: "unsubscribed",
            },
            {
              $set: {
                status: "active",
                consentAccepted: true,
                consentedAt: now,
                subscribedAt: now,
                unsubscribedAt: null,
              },
            },
            {
              session,
              runValidators: true,
            },
          );

        if (
          reactivationResult.matchedCount !== 1
        ) {
          throw createSubscriberStateRetryError();
        }
      } else {
        /*
         * An already-active subscription remains a no-op
         * for consent/subscription history. We only touch
         * updatedAt inside this transaction so the public
         * request contends on the same Subscriber document
         * as a concurrent Admin delete.
         */
        const activeTouchResult =
          await Subscriber.updateOne(
            {
              _id:
                existingSubscriber._id,
              status: "active",
            },
            {
              $set: {
                updatedAt: now,
              },
            },
            {
              session,
              timestamps: false,
            },
          );

        if (
          activeTouchResult.matchedCount !== 1
        ) {
          throw createSubscriberStateRetryError();
        }
      }

      await session.commitTransaction();

      return;
    } catch (error) {
      lastError = error;

      await abortTransactionSafely(
        session,
      );

      if (
        attempt ===
          MAX_TRANSACTION_ATTEMPTS ||
        !isRetryableSubscriberTransactionError(
          error,
        )
      ) {
        throw error;
      }
    } finally {
      await session.endSession();
    }
  }

  throw lastError;
}

async function createSubscriber(
  req,
  res,
  next,
) {
  try {
    if (!isPlainBody(req.body)) {
      return res.status(400).json({
        success: false,
        message:
          "Newsletter subscription data must be a valid object.",
        fieldErrors: {
          body:
            "Newsletter subscription data must be a valid object.",
        },
      });
    }

    const fieldErrors = {};

    Object.keys(req.body).forEach(
      (fieldName) => {
        if (
          !allowedCreateFields.has(
            fieldName,
          )
        ) {
          addFieldError(
            fieldErrors,
            fieldName,
            "This field is not allowed.",
          );
        }
      },
    );

    let website = "";

    if (
      hasOwn(
        req.body,
        "website",
      )
    ) {
      if (
        typeof req.body.website !==
        "string"
      ) {
        addFieldError(
          fieldErrors,
          "website",
          "Website must be a string.",
        );
      } else {
        website =
          req.body.website.trim();

        if (website.length > 500) {
          addFieldError(
            fieldErrors,
            "website",
            "Website cannot exceed 500 characters.",
          );
        }
      }
    }

    if (hasFieldErrors(fieldErrors)) {
      return res.status(400).json({
        success: false,
        message:
          "Please correct the highlighted fields.",
        fieldErrors,
      });
    }

    if (website) {
      return res.status(200).json(
        genericSuccessResponse,
      );
    }

    let email = "";

    if (
      !hasOwn(
        req.body,
        "email",
      )
    ) {
      addFieldError(
        fieldErrors,
        "email",
        "Email is required.",
      );
    } else if (
      typeof req.body.email !==
      "string"
    ) {
      addFieldError(
        fieldErrors,
        "email",
        "Email must be a string.",
      );
    } else {
      email = req.body.email
        .trim()
        .toLowerCase();

      if (!email) {
        addFieldError(
          fieldErrors,
          "email",
          "Email is required.",
        );
      } else if (email.length > 254) {
        addFieldError(
          fieldErrors,
          "email",
          "Email cannot exceed 254 characters.",
        );
      } else if (
        !EMAIL_PATTERN.test(email)
      ) {
        addFieldError(
          fieldErrors,
          "email",
          "Please provide a valid email address.",
        );
      }
    }

    if (
      !hasOwn(
        req.body,
        "consentAccepted",
      )
    ) {
      addFieldError(
        fieldErrors,
        "consentAccepted",
        "Newsletter consent is required.",
      );
    } else if (
      typeof req.body.consentAccepted !==
      "boolean"
    ) {
      addFieldError(
        fieldErrors,
        "consentAccepted",
        "Newsletter consent must be a boolean.",
      );
    } else if (
      req.body.consentAccepted !== true
    ) {
      addFieldError(
        fieldErrors,
        "consentAccepted",
        "Please accept newsletter consent to subscribe.",
      );
    }

    if (hasFieldErrors(fieldErrors)) {
      return res.status(400).json({
        success: false,
        message:
          "Please correct the highlighted fields.",
        fieldErrors,
      });
    }

    await ensureActiveSubscription(email);

    return res.status(200).json(
      genericSuccessResponse,
    );
  } catch (error) {
    const fieldErrors =
      buildMongooseFieldErrors(error);

    if (hasFieldErrors(fieldErrors)) {
      return res.status(400).json({
        success: false,
        message:
          "Please correct the highlighted fields.",
        fieldErrors,
      });
    }

    return next(error);
  }
}

export { createSubscriber };
