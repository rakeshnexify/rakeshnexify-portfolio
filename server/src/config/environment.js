const SUPPORTED_NODE_ENVIRONMENTS = new Set([
  "development",
  "test",
  "production",
]);

const DATABASE_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
const JWT_EXPIRY_PATTERN = /^\d+(ms|s|m|h|d|w|y)$/i;

function readEnvironmentValue(variableName) {
  return String(process.env[variableName] || "").trim();
}

function validateNodeEnvironment(errors) {
  const nodeEnvironment = readEnvironmentValue("NODE_ENV") || "development";

  if (!SUPPORTED_NODE_ENVIRONMENTS.has(nodeEnvironment)) {
    errors.push("NODE_ENV must be development, test or production.");
  }

  return nodeEnvironment;
}

function validatePort(errors) {
  const portValue = readEnvironmentValue("PORT") || "5000";
  const port = Number(portValue);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errors.push("PORT must be an integer between 1 and 65535.");
  }

  return port;
}

function validateClientUrls(errors, nodeEnvironment) {
  const clientUrlValue = readEnvironmentValue("CLIENT_URL");

  if (!clientUrlValue) {
    if (nodeEnvironment === "production") {
      errors.push("CLIENT_URL is required in production.");
    }

    return [];
  }

  const clientUrls = clientUrlValue
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  if (clientUrls.length === 0) {
    errors.push("CLIENT_URL must contain at least one valid URL.");

    return [];
  }

  clientUrls.forEach((clientUrl) => {
    try {
      const parsedUrl = new URL(clientUrl);

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        errors.push(
          "Every CLIENT_URL value must use the http or https protocol.",
        );

        return;
      }

      if (nodeEnvironment === "production" && parsedUrl.protocol !== "https:") {
        errors.push("Every production CLIENT_URL must use HTTPS.");
      }

      if (
        nodeEnvironment === "production" &&
        ["localhost", "127.0.0.1", "::1"].includes(parsedUrl.hostname)
      ) {
        errors.push("Production CLIENT_URL cannot use localhost.");
      }
    } catch {
      errors.push("CLIENT_URL contains an invalid URL.");
    }
  });

  return clientUrls;
}

function validateMongoDatabase(errors) {
  const mongodbUri = readEnvironmentValue("MONGODB_URI");
  const databaseName = readEnvironmentValue("MONGODB_DB_NAME");

  if (!mongodbUri) {
    errors.push("MONGODB_URI is required.");
  } else if (
    !mongodbUri.startsWith("mongodb://") &&
    !mongodbUri.startsWith("mongodb+srv://")
  ) {
    errors.push("MONGODB_URI must start with mongodb:// or mongodb+srv://.");
  }

  if (!databaseName) {
    errors.push("MONGODB_DB_NAME is required.");
  } else {
    if (!DATABASE_NAME_PATTERN.test(databaseName)) {
      errors.push(
        "MONGODB_DB_NAME can contain letters, numbers, hyphens and underscores only.",
      );
    }

    if (Buffer.byteLength(databaseName, "utf8") > 63) {
      errors.push("MONGODB_DB_NAME cannot exceed 63 bytes.");
    }
  }

  return databaseName;
}

function validateJwtConfiguration(errors, nodeEnvironment) {
  const jwtSecret = readEnvironmentValue("JWT_SECRET");
  const jwtExpiresIn = readEnvironmentValue("JWT_EXPIRES_IN") || "2h";

  if (!jwtSecret) {
    errors.push("JWT_SECRET is required.");
  } else {
    const minimumSecretLength = nodeEnvironment === "production" ? 64 : 32;

    if (jwtSecret.length < minimumSecretLength) {
      errors.push(
        `JWT_SECRET must contain at least ${minimumSecretLength} characters in ${nodeEnvironment}.`,
      );
    }
  }

  if (!JWT_EXPIRY_PATTERN.test(jwtExpiresIn)) {
    errors.push("JWT_EXPIRES_IN must use a value such as 30m, 2h, 7d or 1w.");
  }
}

function validateServerEnvironment() {
  const errors = [];

  const nodeEnvironment = validateNodeEnvironment(errors);
  const port = validatePort(errors);
  const clientUrls = validateClientUrls(errors, nodeEnvironment);
  const databaseName = validateMongoDatabase(errors);

  validateJwtConfiguration(errors, nodeEnvironment);

  if (errors.length > 0) {
    const formattedErrors = errors
      .map((error, index) => `${index + 1}. ${error}`)
      .join("\n");

    throw new Error(
      `Server environment validation failed:\n${formattedErrors}`,
    );
  }

  return {
    nodeEnvironment,
    port,
    clientUrls,
    databaseName,
  };
}

export { validateServerEnvironment };

export default validateServerEnvironment;
