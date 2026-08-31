import mongoose from "mongoose";

import Notification from "../models/Notification.js";

const MAX_NOTIFICATION_LIMIT = 50;
const DEFAULT_NOTIFICATION_LIMIT = 12;

function cleanLimit(value) {
  if (value === undefined || value === "") {
    return DEFAULT_NOTIFICATION_LIMIT;
  }

  const limit = Number(value);

  if (
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > MAX_NOTIFICATION_LIMIT
  ) {
    return null;
  }

  return limit;
}

function hasAdminReadNotification(notification, adminId) {
  return Array.isArray(notification?.readBy)
    ? notification.readBy.some(
        (readAdminId) =>
          String(readAdminId) === String(adminId),
      )
    : false;
}

function serializeNotification(notification, adminId) {
  return {
    _id: notification._id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    resourceId: notification.resourceId,
    targetPath: notification.targetPath,
    createdAt: notification.createdAt,
    isRead: hasAdminReadNotification(
      notification,
      adminId,
    ),
  };
}

async function getAdminNotifications(req, res, next) {
  try {
    const limit = cleanLimit(req.query.limit);

    if (!limit) {
      return res.status(400).json({
        success: false,
        message: `Notification limit must be between 1 and ${MAX_NOTIFICATION_LIMIT}.`,
      });
    }

    const adminId = req.admin._id;

    const [notifications, unreadCount] =
      await Promise.all([
        Notification.find({})
          .sort({
            createdAt: -1,
            _id: -1,
          })
          .limit(limit)
          .lean(),

        Notification.countDocuments({
          readBy: {
            $ne: adminId,
          },
        }),
      ]);

    return res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications.map((notification) =>
        serializeNotification(
          notification,
          adminId,
        ),
      ),
    });
  } catch (error) {
    return next(error);
  }
}

async function markAdminNotificationRead(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Notification ID is invalid.",
      });
    }

    const notification =
      await Notification.findByIdAndUpdate(
        req.params.id,
        {
          $addToSet: {
            readBy: req.admin._id,
          },
        },
        {
          new: true,
        },
      ).lean();

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    const unreadCount =
      await Notification.countDocuments({
        readBy: {
          $ne: req.admin._id,
        },
      });

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      unreadCount,
      data: serializeNotification(
        notification,
        req.admin._id,
      ),
    });
  } catch (error) {
    return next(error);
  }
}

async function markAllAdminNotificationsRead(req, res, next) {
  try {
    const result = await Notification.updateMany(
      {
        readBy: {
          $ne: req.admin._id,
        },
      },
      {
        $addToSet: {
          readBy: req.admin._id,
        },
      },
    );

    const unreadCount =
      await Notification.countDocuments({
        readBy: {
          $ne: req.admin._id,
        },
      });

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
      modifiedCount: result.modifiedCount,
      unreadCount,
    });
  } catch (error) {
    return next(error);
  }
}

export {
  getAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
};
