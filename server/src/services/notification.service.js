import Notification, {
  NOTIFICATION_TYPES,
} from "../models/Notification.js";
import {
  sendAdminPushNotificationSafely,
} from "./pushNotification.service.js";

const NOTIFICATION_DEFINITIONS = {
  "contact-message": {
    title: "New Contact Message",
    createMessage(resource) {
      const sender = String(resource?.name || "").trim() || "A visitor";
      const subject = String(resource?.subject || "").trim();

      return subject
        ? `${sender} sent: ${subject}`
        : `${sender} sent a new contact message.`;
    },
    createTargetPath(resourceId) {
      return `/admin/contact-messages?notification=${encodeURIComponent(
        String(resourceId),
      )}`;
    },
  },

  lead: {
    title: "New Lead",
    createMessage(resource) {
      const name = String(resource?.name || "").trim() || "A prospect";
      const subject = String(resource?.subject || "").trim();

      return subject
        ? `${name}: ${subject}`
        : `${name} was added to Leads / CRM.`;
    },
    createTargetPath(resourceId) {
      return `/admin/leads/${encodeURIComponent(
        String(resourceId),
      )}/edit`;
    },
  },

  "service-order": {
    title: "New Service Order",
    createMessage(resource) {
      const customer =
        String(resource?.customerName || "").trim() || "A customer";
      const orderNumber = String(resource?.orderNumber || "").trim();
      const service =
        String(resource?.serviceSnapshot?.title || "").trim();

      if (orderNumber && service) {
        return `${customer} submitted ${orderNumber} for ${service}.`;
      }

      if (orderNumber) {
        return `${customer} submitted Service Order ${orderNumber}.`;
      }

      return `${customer} submitted a new Service Order.`;
    },
    createTargetPath(resourceId) {
      return `/admin/service-orders/${encodeURIComponent(
        String(resourceId),
      )}`;
    },
  },

  appointment: {
    title: "New Consultation Request",
    createMessage(resource) {
      const name = String(resource?.name || "").trim() || "A visitor";
      const service = String(resource?.serviceTitle || "").trim();

      return service
        ? `${name} requested a consultation for ${service}.`
        : `${name} requested a new consultation.`;
    },
    createTargetPath(resourceId) {
      return `/admin/appointments/${encodeURIComponent(
        String(resourceId),
      )}`;
    },
  },
};

function assertSupportedNotificationType(type) {
  if (!NOTIFICATION_TYPES.includes(type)) {
    throw new Error(`Unsupported notification type: ${type}`);
  }
}

function createNotificationEventKey(type, resourceId) {
  return `${type}:${String(resourceId)}:created`;
}

function buildNotificationPayload(type, resource) {
  assertSupportedNotificationType(type);

  if (!resource?._id) {
    throw new Error("Notification resource must include an _id.");
  }

  const definition = NOTIFICATION_DEFINITIONS[type];

  return {
    eventKey: createNotificationEventKey(type, resource._id),
    type,
    title: definition.title,
    message: definition.createMessage(resource),
    resourceId: resource._id,
    targetPath: definition.createTargetPath(resource._id),
  };
}

async function persistEventNotification(
  {
    type,
    resource,
  },
  {
    session,
  } = {},
) {
  const payload = buildNotificationPayload(type, resource);

  const options = {
    upsert: true,
    setDefaultsOnInsert: true,
  };

  if (session) {
    options.session = session;
  }

  const result = await Notification.updateOne(
    {
      eventKey: payload.eventKey,
    },
    {
      $setOnInsert: payload,
    },
    options,
  );

  return {
    eventKey: payload.eventKey,
    created:
      result.upsertedCount === 1,
    payload,
  };
}

async function createEventNotification(
  args,
  options,
) {
  const result =
    await persistEventNotification(
      args,
      options,
    );

  return result.eventKey;
}

async function createEventNotificationSafely(args) {
  try {
    const result =
      await persistEventNotification(
        args,
      );

    if (result.created) {
      void sendAdminPushNotificationSafely(
        result.payload,
      );
    }

    return result.eventKey;
  } catch (error) {
    console.error(
      `Notification creation failed for ${args?.type || "unknown"}:`,
      error?.message || error,
    );

    return "";
  }
}

export {
  buildNotificationPayload,
  createEventNotification,
  createEventNotificationSafely,
  createNotificationEventKey,
};
