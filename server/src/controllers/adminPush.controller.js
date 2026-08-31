import { createHash } from "node:crypto";

import AdminPushSubscription from "../models/AdminPushSubscription.js";
import {
  getWebPushConfigurationStatus,
  sendAdminPushNotification,
} from "../services/pushNotification.service.js";

const MAX_ENDPOINT_LENGTH = 2048;
const MAX_P256DH_LENGTH = 512;
const MAX_AUTH_LENGTH = 256;

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function cleanString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function createEndpointHash(endpoint) {
  return createHash("sha256")
    .update(endpoint)
    .digest("hex");
}

function validateEndpoint(value) {
  const endpoint = cleanString(value);

  if (!endpoint) {
    throw createHttpError(
      "Push subscription endpoint is required.",
    );
  }

  if (endpoint.length > MAX_ENDPOINT_LENGTH) {
    throw createHttpError(
      "Push subscription endpoint is too long.",
    );
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(endpoint);
  } catch {
    throw createHttpError(
      "Push subscription endpoint is invalid.",
    );
  }

  if (parsedUrl.protocol !== "https:") {
    throw createHttpError(
      "Push subscription endpoint must use HTTPS.",
    );
  }

  return endpoint;
}

function validatePushKey(
  value,
  fieldLabel,
  maximumLength,
) {
  const key = cleanString(value);

  if (!key) {
    throw createHttpError(
      `${fieldLabel} is required.`,
    );
  }

  if (
    key.length > maximumLength ||
    !/^[A-Za-z0-9_-]+$/.test(key)
  ) {
    throw createHttpError(
      `${fieldLabel} is invalid.`,
    );
  }

  return key;
}

function cleanExpirationTime(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const numericValue = Number(value);

  if (
    !Number.isFinite(numericValue) ||
    numericValue <= 0
  ) {
    throw createHttpError(
      "Push subscription expiration time is invalid.",
    );
  }

  const expirationTime = new Date(numericValue);

  if (Number.isNaN(expirationTime.getTime())) {
    throw createHttpError(
      "Push subscription expiration time is invalid.",
    );
  }

  return expirationTime;
}

function readPushSubscriptionBody(requestBody) {
  if (
    !requestBody ||
    typeof requestBody !== "object" ||
    Array.isArray(requestBody)
  ) {
    throw createHttpError(
      "Push subscription body must be an object.",
    );
  }

  const endpoint = validateEndpoint(
    requestBody.endpoint,
  );

  const keys =
    requestBody.keys &&
    typeof requestBody.keys === "object" &&
    !Array.isArray(requestBody.keys)
      ? requestBody.keys
      : {};

  return {
    endpoint,
    endpointHash:
      createEndpointHash(endpoint),
    p256dh:
      validatePushKey(
        keys.p256dh,
        "Push p256dh key",
        MAX_P256DH_LENGTH,
      ),
    auth:
      validatePushKey(
        keys.auth,
        "Push auth key",
        MAX_AUTH_LENGTH,
      ),
    expirationTime:
      cleanExpirationTime(
        requestBody.expirationTime,
      ),
  };
}

function getSafeUserAgent(req) {
  return cleanString(
    req.get("user-agent"),
  ).slice(0, 500);
}

async function getAdminPushStatus(req, res, next) {
  try {
    const configuration =
      getWebPushConfigurationStatus();

    const subscriptionCount =
      await AdminPushSubscription.countDocuments({
        admin: req.admin._id,
        disabledAt: null,
      });

    return res.status(200).json({
      success: true,
      data: {
        configured:
          configuration.configured,
        publicKey:
          configuration.publicKey,
        subscriptionCount,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function saveAdminPushSubscription(
  req,
  res,
  next,
) {
  try {
    const configuration =
      getWebPushConfigurationStatus();

    if (!configuration.configured) {
      return res.status(503).json({
        success: false,
        message:
          "Web Push is not configured on the server yet.",
      });
    }

    const subscription =
      readPushSubscriptionBody(req.body);

    const savedSubscription =
      await AdminPushSubscription.findOneAndUpdate(
        {
          endpointHash:
            subscription.endpointHash,
        },
        {
          $set: {
            admin: req.admin._id,
            endpoint:
              subscription.endpoint,
            keys: {
              p256dh:
                subscription.p256dh,
              auth:
                subscription.auth,
            },
            expirationTime:
              subscription.expirationTime,
            userAgent:
              getSafeUserAgent(req),
            disabledAt: null,
            failureCount: 0,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        },
      ).lean();

    return res.status(200).json({
      success: true,
      message:
        "Push notifications enabled for this device.",
      data: {
        id: savedSubscription._id,
        createdAt:
          savedSubscription.createdAt,
        updatedAt:
          savedSubscription.updatedAt,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteAdminPushSubscription(
  req,
  res,
  next,
) {
  try {
    const endpoint = validateEndpoint(
      req.body?.endpoint,
    );

    const result =
      await AdminPushSubscription.deleteOne({
        admin: req.admin._id,
        endpointHash:
          createEndpointHash(endpoint),
      });

    return res.status(200).json({
      success: true,
      message:
        "Push notifications disabled for this device.",
      deleted:
        result.deletedCount === 1,
    });
  } catch (error) {
    return next(error);
  }
}

async function sendAdminPushTest(req, res, next) {
  try {
    const configuration =
      getWebPushConfigurationStatus();

    if (!configuration.configured) {
      return res.status(503).json({
        success: false,
        message:
          "Web Push is not configured on the server yet.",
      });
    }

    const result =
      await sendAdminPushNotification(
        {
          _id: "push-test",
          type: "push-test",
          title:
            "RakeshNexify Push Test",
          message:
            "Phone/browser push notifications are working.",
          resourceId:
            req.admin._id,
          targetPath:
            "/admin",
        },
        {
          adminId:
            req.admin._id,
        },
      );

    if (result.attempted === 0) {
      return res.status(409).json({
        success: false,
        message:
          "No active push subscription exists for this Admin account.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Test push sent.",
      data: {
        attempted:
          result.attempted,
        delivered:
          result.delivered,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export {
  deleteAdminPushSubscription,
  getAdminPushStatus,
  saveAdminPushSubscription,
  sendAdminPushTest,
};
