const SUPPORTED_NODE_ENVIRONMENTS = new Set([
  "development",
  "test",
  "production",
]);

const DATABASE_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
const JWT_EXPIRY_PATTERN = /^\d+(ms|s|m|h|d|w|y)$/i;

const DEFAULT_MEDIA_LIMITS_MB = Object.freeze({
  image: 10,
  svg: 5,
  document: 20,
  audio: 50,
  video: 100,
});

const MEDIA_LIMIT_ENVIRONMENT_VARIABLES = Object.freeze({
  image: "MEDIA_IMAGE_MAX_MB",
  svg: "MEDIA_SVG_MAX_MB",
  document: "MEDIA_DOCUMENT_MAX_MB",
  audio: "MEDIA_AUDIO_MAX_MB",
  video: "MEDIA_VIDEO_MAX_MB",
});

function readEnvironmentValue(variableName) {
  return String(process.env[variableName] || "").trim();
}

function validateNodeEnvironment(errors) {
  const nodeEnvironment =
    readEnvironmentValue("NODE_ENV") || "development";

  if (!SUPPORTED_NODE_ENVIRONMENTS.has(nodeEnvironment)) {
    errors.push(
      "NODE_ENV must be development, test or production.",
    );
  }

  return nodeEnvironment;
}

function validatePort(errors) {
  const portValue = readEnvironmentValue("PORT") || "5000";
  const port = Number(portValue);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errors.push(
      "PORT must be an integer between 1 and 65535.",
    );
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
    errors.push(
      "CLIENT_URL must contain at least one valid URL.",
    );

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

      if (
        nodeEnvironment === "production" &&
        parsedUrl.protocol !== "https:"
      ) {
        errors.push(
          "Every production CLIENT_URL must use HTTPS.",
        );
      }

      if (
        nodeEnvironment === "production" &&
        ["localhost", "127.0.0.1", "::1"].includes(
          parsedUrl.hostname,
        )
      ) {
        errors.push(
          "Production CLIENT_URL cannot use localhost.",
        );
      }
    } catch {
      errors.push("CLIENT_URL contains an invalid URL.");
    }
  });

  return clientUrls;
}

function validateMongoDatabase(errors) {
  const mongodbUri = readEnvironmentValue("MONGODB_URI");
  const databaseName = readEnvironmentValue(
    "MONGODB_DB_NAME",
  );

  if (!mongodbUri) {
    errors.push("MONGODB_URI is required.");
  } else if (
    !mongodbUri.startsWith("mongodb://") &&
    !mongodbUri.startsWith("mongodb+srv://")
  ) {
    errors.push(
      "MONGODB_URI must start with mongodb:// or mongodb+srv://.",
    );
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
      errors.push(
        "MONGODB_DB_NAME cannot exceed 63 bytes.",
      );
    }
  }

  return databaseName;
}

function validateJwtConfiguration(errors, nodeEnvironment) {
  const jwtSecret = readEnvironmentValue("JWT_SECRET");
  const jwtExpiresIn =
    readEnvironmentValue("JWT_EXPIRES_IN") || "2h";

  if (!jwtSecret) {
    errors.push("JWT_SECRET is required.");
  } else {
    const minimumSecretLength =
      nodeEnvironment === "production" ? 64 : 32;

    if (jwtSecret.length < minimumSecretLength) {
      errors.push(
        `JWT_SECRET must contain at least ${minimumSecretLength} characters in ${nodeEnvironment}.`,
      );
    }
  }

  if (!JWT_EXPIRY_PATTERN.test(jwtExpiresIn)) {
    errors.push(
      "JWT_EXPIRES_IN must use a value such as 30m, 2h, 7d or 1w.",
    );
  }
}

function validateCloudinaryConfiguration(
  errors,
  nodeEnvironment,
) {
  const cloudName = readEnvironmentValue(
    "CLOUDINARY_CLOUD_NAME",
  );
  const apiKey = readEnvironmentValue("CLOUDINARY_API_KEY");
  const apiSecret = readEnvironmentValue(
    "CLOUDINARY_API_SECRET",
  );
  const mediaFolder =
    readEnvironmentValue("CLOUDINARY_MEDIA_FOLDER") ||
    "rakeshnexify/media";

  const hasAnyCloudinaryValue = Boolean(
    cloudName || apiKey || apiSecret,
  );

  const cloudinaryRequired =
    nodeEnvironment === "production" ||
    hasAnyCloudinaryValue;

  if (cloudinaryRequired) {
    if (!cloudName) {
      errors.push(
        "CLOUDINARY_CLOUD_NAME is required when Media storage is enabled.",
      );
    }

    if (!apiKey) {
      errors.push(
        "CLOUDINARY_API_KEY is required when Media storage is enabled.",
      );
    }

    if (!apiSecret) {
      errors.push(
        "CLOUDINARY_API_SECRET is required when Media storage is enabled.",
      );
    }
  }

  if (
    mediaFolder.startsWith("/") ||
    mediaFolder.endsWith("/") ||
    mediaFolder.includes("\\") ||
    mediaFolder.includes("..") ||
    mediaFolder.includes("//")
  ) {
    errors.push(
      "CLOUDINARY_MEDIA_FOLDER must be a relative Cloudinary folder path without leading/trailing slashes, backslashes, duplicate slashes or parent-directory segments.",
    );
  }

  return {
    cloudName,
    apiKey,
    apiSecret,
    mediaFolder,
    configured: Boolean(
      cloudName && apiKey && apiSecret,
    ),
  };
}

function validateMediaLimit(
  errors,
  variableName,
  defaultValue,
) {
  const rawValue = readEnvironmentValue(variableName);

  if (!rawValue) {
    return defaultValue;
  }

  const numericValue = Number(rawValue);

  if (
    !Number.isFinite(numericValue) ||
    numericValue <= 0 ||
    numericValue > 500
  ) {
    errors.push(
      `${variableName} must be a number greater than 0 and no greater than 500.`,
    );

    return defaultValue;
  }

  return numericValue;
}

function validateMediaConfiguration(errors) {
  const limitsMb = Object.fromEntries(
    Object.entries(
      MEDIA_LIMIT_ENVIRONMENT_VARIABLES,
    ).map(([mediaType, variableName]) => [
      mediaType,
      validateMediaLimit(
        errors,
        variableName,
        DEFAULT_MEDIA_LIMITS_MB[mediaType],
      ),
    ]),
  );

  return {
    limitsMb,
    limitsBytes: Object.fromEntries(
      Object.entries(limitsMb).map(
        ([mediaType, megabytes]) => [
          mediaType,
          Math.round(
            megabytes * 1024 * 1024,
          ),
        ],
      ),
    ),
  };
}

function validateServerEnvironment() {
  const errors = [];

  const nodeEnvironment =
    validateNodeEnvironment(errors);

  const port = validatePort(errors);

  const clientUrls = validateClientUrls(
    errors,
    nodeEnvironment,
  );

  const databaseName =
    validateMongoDatabase(errors);

  validateJwtConfiguration(
    errors,
    nodeEnvironment,
  );

  const cloudinary =
    validateCloudinaryConfiguration(
      errors,
      nodeEnvironment,
    );

  const media = validateMediaConfiguration(errors);

  if (errors.length > 0) {
    const formattedErrors = errors
      .map(
        (error, index) =>
          `${index + 1}. ${error}`,
      )
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
    cloudinary,
    media,
  };
}

export { validateServerEnvironment };

export default validateServerEnvironment;