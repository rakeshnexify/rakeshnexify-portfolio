import mongoose from "mongoose";

import Subscriber, {
  SUBSCRIBER_STATUSES,
} from "../models/Subscriber.js";

const allowedListQueryFields =
  new Set([
    "page",
    "limit",
    "search",
    "status",
  ]);

const allowedUpdateFields =
  new Set([
    "status",
  ]);

function isPlainObject(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value),
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

function escapeRegex(value) {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
}

function parsePositiveInteger(
  value,
  fieldName,
  fieldErrors,
  {
    defaultValue,
    maxValue,
  },
) {
  if (
    value === undefined ||
    value === ""
  ) {
    return defaultValue;
  }

  if (
    typeof value !== "string" ||
    !/^\d+$/.test(value)
  ) {
    addFieldError(
      fieldErrors,
      fieldName,
      `${fieldName} must be a positive integer.`,
    );

    return defaultValue;
  }

  const parsedValue =
    Number(value);

  if (
    !Number.isSafeInteger(
      parsedValue,
    ) ||
    parsedValue < 1
  ) {
    addFieldError(
      fieldErrors,
      fieldName,
      `${fieldName} must be a positive integer.`,
    );

    return defaultValue;
  }

  if (
    maxValue &&
    parsedValue > maxValue
  ) {
    addFieldError(
      fieldErrors,
      fieldName,
      `${fieldName} cannot exceed ${maxValue}.`,
    );

    return defaultValue;
  }

  return parsedValue;
}

function buildMongooseFieldErrors(
  error,
) {
  const fieldErrors = {};

  if (
    error?.name !==
    "ValidationError"
  ) {
    return fieldErrors;
  }

  Object.entries(
    error.errors || {},
  ).forEach(
    ([
      fieldName,
      fieldError,
    ]) => {
      fieldErrors[fieldName] =
        fieldError?.message ||
        "This value is invalid.";
    },
  );

  return fieldErrors;
}

async function getAdminSubscribers(
  req,
  res,
  next,
) {
  try {
    const fieldErrors = {};

    Object.entries(
      req.query,
    ).forEach(
      ([
        fieldName,
        fieldValue,
      ]) => {
        if (
          !allowedListQueryFields.has(
            fieldName,
          )
        ) {
          addFieldError(
            fieldErrors,
            fieldName,
            "This query parameter is not allowed.",
          );

          return;
        }

        if (
          typeof fieldValue !==
            "string" ||
          Array.isArray(fieldValue)
        ) {
          addFieldError(
            fieldErrors,
            fieldName,
            "This query parameter must occur once.",
          );
        }
      },
    );

    const page =
      parsePositiveInteger(
        req.query.page,
        "page",
        fieldErrors,
        {
          defaultValue: 1,
          maxValue: 100000,
        },
      );

    const limit =
      parsePositiveInteger(
        req.query.limit,
        "limit",
        fieldErrors,
        {
          defaultValue: 20,
          maxValue: 100,
        },
      );

    let search = "";

    if (
      req.query.search !==
      undefined
    ) {
      if (
        typeof req.query
          .search !== "string"
      ) {
        addFieldError(
          fieldErrors,
          "search",
          "Search must be a string.",
        );
      } else {
        search =
          req.query.search
            .trim()
            .toLowerCase();

        if (
          search.length > 254
        ) {
          addFieldError(
            fieldErrors,
            "search",
            "Search cannot exceed 254 characters.",
          );
        }
      }
    }

    let status = "";

    if (
      req.query.status !==
      undefined
    ) {
      if (
        typeof req.query
          .status !== "string"
      ) {
        addFieldError(
          fieldErrors,
          "status",
          "Status must be a string.",
        );
      } else {
        status =
          req.query.status
            .trim()
            .toLowerCase();

        if (
          status &&
          !SUBSCRIBER_STATUSES.includes(
            status,
          )
        ) {
          addFieldError(
            fieldErrors,
            "status",
            "Status must be active or unsubscribed.",
          );
        }
      }
    }

    if (
      hasFieldErrors(
        fieldErrors,
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please correct the invalid Subscriber filters.",
        fieldErrors,
      });
    }

    const query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.email =
        new RegExp(
          escapeRegex(search),
          "i",
        );
    }

    const skip =
      (page - 1) * limit;

    const [
      subscribers,
      total,
    ] = await Promise.all([
      Subscriber.find(query)
        .sort({
          subscribedAt: -1,
          _id: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      Subscriber.countDocuments(
        query,
      ),
    ]);

    return res.json({
      success: true,
      count:
        subscribers.length,
      total,
      page,
      limit,
      pages: Math.max(
        1,
        Math.ceil(
          total / limit,
        ),
      ),
      data: subscribers,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateAdminSubscriber(
  req,
  res,
  next,
) {
  try {
    if (
      !mongoose.isValidObjectId(
        req.params.id,
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Subscriber ID is invalid.",
        fieldErrors: {
          id:
            "Subscriber ID is invalid.",
        },
      });
    }

    if (
      !isPlainObject(
        req.body,
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Subscriber update data must be a valid object.",
        fieldErrors: {
          body:
            "Subscriber update data must be a valid object.",
        },
      });
    }

    const fieldErrors = {};

    Object.keys(
      req.body,
    ).forEach(
      (fieldName) => {
        if (
          !allowedUpdateFields.has(
            fieldName,
          )
        ) {
          addFieldError(
            fieldErrors,
            fieldName,
            "This field cannot be updated.",
          );
        }
      },
    );

    if (
      Object.keys(
        req.body,
      ).length === 0
    ) {
      addFieldError(
        fieldErrors,
        "body",
        "Status is required.",
      );
    }

    if (
      Object.prototype.hasOwnProperty.call(
        req.body,
        "status",
      )
    ) {
      if (
        typeof req.body
          .status !== "string"
      ) {
        addFieldError(
          fieldErrors,
          "status",
          "Status must be a string.",
        );
      } else {
        const requestedStatus =
          req.body.status
            .trim()
            .toLowerCase();

        if (
          requestedStatus !==
          "unsubscribed"
        ) {
          addFieldError(
            fieldErrors,
            "status",
            "Admin may only unsubscribe an active Subscriber.",
          );
        }
      }
    }

    if (
      hasFieldErrors(
        fieldErrors,
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please correct the highlighted fields.",
        fieldErrors,
      });
    }

    const subscriber =
      await Subscriber.findOneAndUpdate(
        {
          _id: req.params.id,
          status: "active",
        },
        {
          $set: {
            status:
              "unsubscribed",
            unsubscribedAt:
              new Date(),
          },
        },
        {
          new: true,
          runValidators: true,
        },
      );

    if (!subscriber) {
      const existingSubscriber =
        await Subscriber.findById(
          req.params.id,
        )
          .select("_id status")
          .lean();

      if (!existingSubscriber) {
        return res.status(404).json({
          success: false,
          message:
            "Subscriber was not found.",
        });
      }

      return res.status(409).json({
        success: false,
        message:
          "This Subscriber is already unsubscribed.",
        fieldErrors: {
          status:
            "Only an active Subscriber can be unsubscribed.",
        },
      });
    }

    return res.json({
      success: true,
      message:
        "Subscriber unsubscribed successfully.",
      data:
        subscriber.toObject(),
    });
  } catch (error) {
    const fieldErrors =
      buildMongooseFieldErrors(
        error,
      );

    if (
      hasFieldErrors(
        fieldErrors,
      )
    ) {
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

async function deleteAdminSubscriber(
  req,
  res,
  next,
) {
  const session =
    await mongoose.startSession();

  try {
    if (
      !mongoose.isValidObjectId(
        req.params.id,
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Subscriber ID is invalid.",
        fieldErrors: {
          id:
            "Subscriber ID is invalid.",
        },
      });
    }

    let outcome = null;

    await session.withTransaction(
      async () => {
        const subscriber =
          await Subscriber.findById(
            req.params.id,
          )
            .select(
              "_id email status subscribedAt unsubscribedAt",
            )
            .session(session)
            .lean();

        if (!subscriber) {
          outcome = {
            type: "not-found",
          };

          return;
        }

        const deleteResult =
          await Subscriber.deleteOne(
            {
              _id:
                subscriber._id,
            },
          ).session(session);

        if (
          deleteResult.deletedCount !==
          1
        ) {
          outcome = {
            type: "not-found",
          };

          return;
        }

        outcome = {
          type: "deleted",
          subscriber,
        };
      },
    );

    if (
      outcome?.type ===
      "not-found"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Subscriber was not found.",
      });
    }

    return res.json({
      success: true,
      message:
        "Subscriber permanently deleted.",
      data: {
        id:
          outcome.subscriber._id,
        email:
          outcome.subscriber.email,
        status:
          outcome.subscriber.status,
      },
    });
  } catch (error) {
    return next(error);
  } finally {
    await session.endSession();
  }
}

export {
  deleteAdminSubscriber,
  getAdminSubscribers,
  updateAdminSubscriber,
};
