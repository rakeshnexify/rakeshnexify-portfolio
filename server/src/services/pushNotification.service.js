import webPush from "web-push";

import AdminPushSubscription from "../models/AdminPushSubscription.js";
import AdminUser from "../models/AdminUser.js";
import Notification from "../models/Notification.js";

const PUSH_TTL_SECONDS = 180;
const STALE_PUSH_STATUS_CODES = new Set([404, 410]);

let configuredSignature = "";

function cleanEnvironmentValue(name) {
  return String(process.env[name] || "").trim();
}

function readWebPushConfiguration() {
  const subject = cleanEnvironmentValue("VAPID_SUBJECT");
  const publicKey = cleanEnvironmentValue("VAPID_PUBLIC_KEY");
  const privateKey = cleanEnvironmentValue("VAPID_PRIVATE_KEY");

  return {
    subject,
    publicKey,
    privateKey,
    configured: Boolean(subject && publicKey && privateKey),
  };
}

function configureWebPushIfNeeded() {
  const configuration = readWebPushConfiguration();

  if (!configuration.configured) {
    return {
      ...configuration,
      ready: false,
    };
  }

  const signature = [
    configuration.subject,
    configuration.publicKey,
    configuration.privateKey,
  ].join("|");

  if (signature !== configuredSignature) {
    webPush.setVapidDetails(
      configuration.subject,
      configuration.publicKey,
      configuration.privateKey,
    );

    configuredSignature = signature;
  }

  return {
    ...configuration,
    ready: true,
  };
}

function getWebPushConfigurationStatus() {
  const configuration = readWebPushConfiguration();

  return {
    configured: configuration.configured,
    publicKey: configuration.configured
      ? configuration.publicKey
      : "",
  };
}

function createPushPayload(notification) {
  return JSON.stringify({
    title:
      String(notification?.title || "").trim() ||
      "RakeshNexify",
    body:
      String(notification?.message || "").trim() ||
      "New Admin activity.",
    tag:
      `rnx-${String(notification?.type || "notification")}-${String(
        notification?.resourceId || notification?._id || "event",
      )}`,
    data: {
      notificationId: String(notification?._id || ""),
      type: String(notification?.type || ""),
      resourceId: String(notification?.resourceId || ""),
      targetPath: String(notification?.targetPath || "/admin"),
    },
  });
}

async function getActivePushSubscriptions({ adminId } = {}) {
  const activeAdminIds = adminId
    ? [adminId]
    : await AdminUser.find({
        isActive: true,
      }).distinct("_id");

  if (activeAdminIds.length === 0) {
    return [];
  }

  return AdminPushSubscription.find({
    admin: {
      $in: activeAdminIds,
    },
    disabledAt: null,
  }).lean();
}

async function markPushSubscriptionSuccess(subscriptionId) {
  await AdminPushSubscription.updateOne(
    {
      _id: subscriptionId,
    },
    {
      $set: {
        lastSuccessAt: new Date(),
        failureCount: 0,
      },
    },
  );
}

async function recordPushSubscriptionFailure(subscription, error) {
  const statusCode = Number(
    error?.statusCode ||
      error?.status,
  );

  if (STALE_PUSH_STATUS_CODES.has(statusCode)) {
    await AdminPushSubscription.deleteOne({
      _id: subscription._id,
    });

    return;
  }

  await AdminPushSubscription.updateOne(
    {
      _id: subscription._id,
    },
    {
      $inc: {
        failureCount: 1,
      },
    },
  );

  console.error("Web Push delivery failed:", {
    subscriptionId: String(subscription._id),
    statusCode: Number.isFinite(statusCode)
      ? statusCode
      : null,
    message:
      error?.message ||
      "Unknown push delivery error.",
  });
}

async function sendPushToSubscription(subscription, payload) {
  try {
    await webPush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
      payload,
      {
        TTL: PUSH_TTL_SECONDS,
        urgency: "high",
      },
    );

    await markPushSubscriptionSuccess(
      subscription._id,
    );

    return true;
  } catch (error) {
    await recordPushSubscriptionFailure(
      subscription,
      error,
    );

    return false;
  }
}

async function sendAdminPushNotification(
  notification,
  {
    adminId,
  } = {},
) {
  const configuration = configureWebPushIfNeeded();

  if (!configuration.ready) {
    return {
      configured: false,
      attempted: 0,
      delivered: 0,
    };
  }

  const subscriptions =
    await getActivePushSubscriptions({
      adminId,
    });

  if (subscriptions.length === 0) {
    return {
      configured: true,
      attempted: 0,
      delivered: 0,
    };
  }

  const payload = createPushPayload(notification);

  const results = await Promise.all(
    subscriptions.map((subscription) =>
      sendPushToSubscription(
        subscription,
        payload,
      ),
    ),
  );

  return {
    configured: true,
    attempted: subscriptions.length,
    delivered: results.filter(Boolean).length,
  };
}

async function sendAdminPushNotificationSafely(
  notification,
  options,
) {
  try {
    return await sendAdminPushNotification(
      notification,
      options,
    );
  } catch (error) {
    console.error(
      "Web Push dispatch failed:",
      error?.message || error,
    );

    return {
      configured:
        readWebPushConfiguration().configured,
      attempted: 0,
      delivered: 0,
    };
  }
}

async function sendStoredEventNotificationPushSafely(
  type,
  resourceId,
) {
  try {
    const notification =
      await Notification.findOne({
        type,
        resourceId,
      })
        .sort({
          createdAt: -1,
          _id: -1,
        })
        .lean();

    if (!notification) {
      return {
        configured:
          readWebPushConfiguration().configured,
        attempted: 0,
        delivered: 0,
      };
    }

    return await sendAdminPushNotificationSafely(
      notification,
    );
  } catch (error) {
    console.error(
      "Stored Web Push dispatch failed:",
      error?.message || error,
    );

    return {
      configured:
        readWebPushConfiguration().configured,
      attempted: 0,
      delivered: 0,
    };
  }
}

export {
  getWebPushConfigurationStatus,
  sendAdminPushNotification,
  sendAdminPushNotificationSafely,
  sendStoredEventNotificationPushSafely,
};
