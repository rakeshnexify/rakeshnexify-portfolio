import jwt from "jsonwebtoken";

const TOKEN_ISSUER = "rakeshnexify-api";
const TOKEN_AUDIENCE = "rakeshnexify-admin";
const TOKEN_ALGORITHM = "HS256";

function getJwtSecret() {
  const jwtSecret = process.env.JWT_SECRET?.trim();

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is missing from server/.env");
  }

  return jwtSecret;
}

function getJwtExpiry() {
  return process.env.JWT_EXPIRES_IN?.trim() || "2h";
}

function createAdminAccessToken(adminUser) {
  if (!adminUser?._id) {
    throw new Error("Admin user ID is required for token generation.");
  }

  return jwt.sign(
    {
      role: adminUser.role,
      tokenType: "admin-access",
    },
    getJwtSecret(),
    {
      algorithm: TOKEN_ALGORITHM,
      expiresIn: getJwtExpiry(),
      subject: String(adminUser._id),
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    },
  );
}

function verifyAdminAccessToken(token) {
  return jwt.verify(token, getJwtSecret(), {
    algorithms: [TOKEN_ALGORITHM],
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE,
  });
}

export { createAdminAccessToken, verifyAdminAccessToken };
