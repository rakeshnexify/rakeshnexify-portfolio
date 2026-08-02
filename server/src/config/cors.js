const DEVELOPMENT_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];

function normalizeOrigin(origin) {
  const originValue = String(origin || "").trim();

  if (!originValue) {
    return "";
  }

  try {
    return new URL(originValue).origin;
  } catch {
    return "";
  }
}

function getConfiguredClientOrigins() {
  const configuredOrigins = String(process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);

  const allowedOrigins =
    process.env.NODE_ENV === "production"
      ? configuredOrigins
      : [...DEVELOPMENT_ORIGINS, ...configuredOrigins];

  return [...new Set(allowedOrigins)];
}

function createCorsOriginValidator() {
  const allowedOrigins = getConfiguredClientOrigins();

  return function validateCorsOrigin(origin, callback) {
    /*
     * Browser ke bahar se aane wali requests,
     * server-to-server requests aur health checks
     * me Origin header absent ho sakta hai.
     */
    if (!origin) {
      callback(null, true);
      return;
    }

    const normalizedRequestOrigin = normalizeOrigin(origin);

    if (
      normalizedRequestOrigin &&
      allowedOrigins.includes(normalizedRequestOrigin)
    ) {
      callback(null, true);
      return;
    }

    const error = new Error("Request origin is not allowed by CORS.");

    error.statusCode = 403;

    callback(error);
  };
}

const corsOptions = {
  origin: createCorsOriginValidator(),

  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: ["Content-Type", "Authorization"],

  optionsSuccessStatus: 204,

  maxAge: 86400,
};

export {
  DEVELOPMENT_ORIGINS,
  createCorsOriginValidator,
  getConfiguredClientOrigins,
};

export default corsOptions;
