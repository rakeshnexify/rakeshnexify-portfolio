import nodemailer from "nodemailer";

const EMAIL_NOTIFICATION_TYPES = new Set([
  "contact-message",
  "service-order",
  "appointment",
]);

const SMTP_BOOLEAN_TRUE_VALUES = new Set([
  "1",
  "true",
  "yes",
  "on",
]);

const SMTP_BOOLEAN_FALSE_VALUES = new Set([
  "0",
  "false",
  "no",
  "off",
]);

let cachedTransportSignature = "";
let cachedTransporter = null;

function cleanEnvironmentValue(name) {
  return String(process.env[name] || "").trim();
}

function isLikelyEmailAddress(value) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(
    String(value || "").trim(),
  );
}

function readSmtpPort() {
  const rawPort = cleanEnvironmentValue(
    "SMTP_PORT",
  );

  if (!/^\d{1,5}$/.test(rawPort)) {
    return null;
  }

  const port = Number(rawPort);

  return Number.isInteger(port) &&
    port >= 1 &&
    port <= 65535
    ? port
    : null;
}

function readSmtpSecure() {
  const rawValue = cleanEnvironmentValue(
    "SMTP_SECURE",
  ).toLowerCase();

  if (SMTP_BOOLEAN_TRUE_VALUES.has(rawValue)) {
    return true;
  }

  if (SMTP_BOOLEAN_FALSE_VALUES.has(rawValue)) {
    return false;
  }

  return null;
}

function readRecipientEmails() {
  const seen = new Set();

  return cleanEnvironmentValue(
    "ADMIN_NOTIFICATION_EMAILS",
  )
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => {
      const normalizedValue =
        value.toLowerCase();

      if (
        !isLikelyEmailAddress(value) ||
        seen.has(normalizedValue)
      ) {
        return false;
      }

      seen.add(normalizedValue);

      return true;
    });
}

function readEmailConfiguration() {
  const host = cleanEnvironmentValue(
    "SMTP_HOST",
  );
  const port = readSmtpPort();
  const secure = readSmtpSecure();
  const user = cleanEnvironmentValue(
    "SMTP_USER",
  );
  const pass = cleanEnvironmentValue(
    "SMTP_PASS",
  );
  const fromEmail = cleanEnvironmentValue(
    "SMTP_FROM_EMAIL",
  );
  const fromName =
    cleanEnvironmentValue(
      "SMTP_FROM_NAME",
    ) || "RakeshNexify";
  const recipients = readRecipientEmails();

  const configured = Boolean(
    host &&
      port &&
      secure !== null &&
      user &&
      pass &&
      isLikelyEmailAddress(fromEmail) &&
      recipients.length > 0,
  );

  return {
    host,
    port,
    secure,
    user,
    pass,
    fromEmail,
    fromName,
    recipients,
    configured,
  };
}

function getEmailNotificationConfigurationStatus() {
  const configuration =
    readEmailConfiguration();

  return {
    configured: configuration.configured,
    recipientCount:
      configuration.recipients.length,
    hostConfigured:
      Boolean(configuration.host),
    portConfigured:
      Boolean(configuration.port),
    secureConfigured:
      configuration.secure !== null,
    authConfigured:
      Boolean(
        configuration.user &&
          configuration.pass,
      ),
    fromConfigured:
      isLikelyEmailAddress(
        configuration.fromEmail,
      ),
  };
}

function createTransportSignature(configuration) {
  return [
    configuration.host,
    configuration.port,
    configuration.secure,
    configuration.user,
    configuration.pass,
    configuration.fromEmail,
    configuration.fromName,
  ].join("\u0000");
}

function getConfiguredTransporter() {
  const configuration =
    readEmailConfiguration();

  if (!configuration.configured) {
    return {
      configuration,
      transporter: null,
    };
  }

  const signature =
    createTransportSignature(
      configuration,
    );

  if (
    !cachedTransporter ||
    signature !== cachedTransportSignature
  ) {
    cachedTransporter =
      nodemailer.createTransport({
        host: configuration.host,
        port: configuration.port,
        secure: configuration.secure,
        auth: {
          user: configuration.user,
          pass: configuration.pass,
        },
      });

    cachedTransportSignature = signature;
  }

  return {
    configuration,
    transporter: cachedTransporter,
  };
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getSafeAdminTargetPath(value) {
  const targetPath =
    String(value || "").trim();

  return targetPath.startsWith("/admin")
    ? targetPath
    : "/admin";
}

function getAdminTargetUrl(targetPath) {
  const clientUrl =
    cleanEnvironmentValue("CLIENT_URL");

  if (!clientUrl) {
    return "";
  }

  try {
    const baseUrl = new URL(clientUrl);

    if (
      baseUrl.protocol !== "https:" &&
      baseUrl.protocol !== "http:"
    ) {
      return "";
    }

    return new URL(
      getSafeAdminTargetPath(targetPath),
      `${baseUrl.origin}/`,
    ).href;
  } catch {
    return "";
  }
}

function createEmailContent({
  title,
  message,
  targetPath,
}) {
  const safeTitle =
    String(title || "").trim() ||
    "New RakeshNexify activity";

  const safeMessage =
    String(message || "").trim() ||
    "A new Admin notification is available.";

  const targetUrl =
    getAdminTargetUrl(targetPath);

  const textParts = [
    safeTitle,
    "",
    safeMessage,
  ];

  if (targetUrl) {
    textParts.push(
      "",
      `Open Admin: ${targetUrl}`,
    );
  }

  const actionHtml = targetUrl
    ? `
      <p style="margin:24px 0 0">
        <a
          href="${escapeHtml(targetUrl)}"
          style="display:inline-block;padding:11px 16px;border-radius:8px;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:700"
        >
          Open Admin
        </a>
      </p>
    `
    : "";

  return {
    subject: `[RakeshNexify] ${safeTitle}`.slice(
      0,
      200,
    ),
    text: textParts.join("\n"),
    html: `
      <div style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a">
        <div style="max-width:620px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff">
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748b">
            RakeshNexify Admin Alert
          </p>
          <h1 style="margin:0 0 14px;font-size:21px;line-height:1.3">
            ${escapeHtml(safeTitle)}
          </h1>
          <p style="margin:0;font-size:15px;line-height:1.65;color:#334155">
            ${escapeHtml(safeMessage)}
          </p>
          ${actionHtml}
          <p style="margin:24px 0 0;font-size:11px;line-height:1.5;color:#94a3b8">
            This is an automated Admin notification from RakeshNexify.
          </p>
        </div>
      </div>
    `.trim(),
  };
}

async function sendConfiguredEmail({
  title,
  message,
  targetPath,
}) {
  const {
    configuration,
    transporter,
  } = getConfiguredTransporter();

  if (!transporter) {
    return {
      configured: false,
      sent: false,
      recipientCount: 0,
    };
  }

  const content = createEmailContent({
    title,
    message,
    targetPath,
  });

  const info = await transporter.sendMail({
    from: {
      name: configuration.fromName,
      address: configuration.fromEmail,
    },
    to: configuration.recipients,
    subject: content.subject,
    text: content.text,
    html: content.html,
  });

  return {
    configured: true,
    sent: true,
    recipientCount:
      configuration.recipients.length,
    messageId:
      String(info?.messageId || ""),
  };
}

async function verifyEmailTransport() {
  const {
    configuration,
    transporter,
  } = getConfiguredTransporter();

  if (!transporter) {
    throw new Error(
      "SMTP email notifications are not fully configured.",
    );
  }

  await transporter.verify();

  return {
    configured: true,
    recipientCount:
      configuration.recipients.length,
  };
}

async function sendAdminEmailNotification(
  notification,
) {
  const type =
    String(notification?.type || "").trim();

  if (!EMAIL_NOTIFICATION_TYPES.has(type)) {
    return {
      configured:
        readEmailConfiguration().configured,
      sent: false,
      skipped: true,
      reason:
        "notification-type-not-email-enabled",
    };
  }

  return sendConfiguredEmail({
    title: notification?.title,
    message: notification?.message,
    targetPath: notification?.targetPath,
  });
}

async function sendAdminEmailNotificationSafely(
  notification,
) {
  try {
    return await sendAdminEmailNotification(
      notification,
    );
  } catch (error) {
    console.error(
      `Email notification delivery failed for ${notification?.type || "unknown"}:`,
      error?.message || error,
    );

    return {
      configured:
        readEmailConfiguration().configured,
      sent: false,
      error: true,
    };
  }
}

async function sendAdminEmailTest() {
  const status =
    getEmailNotificationConfigurationStatus();

  if (!status.configured) {
    throw new Error(
      "SMTP email notifications are not fully configured.",
    );
  }

  return sendConfiguredEmail({
    title: "RakeshNexify Email Test",
    message:
      "Production-style SMTP email notifications are working.",
    targetPath: "/admin",
  });
}

export {
  getEmailNotificationConfigurationStatus,
  sendAdminEmailNotification,
  sendAdminEmailNotificationSafely,
  sendAdminEmailTest,
  verifyEmailTransport,
};
