import mongoose from "mongoose";

import AdminUser from "../models/AdminUser.js";
import { verifyAdminAccessToken } from "../utils/adminToken.js";

function readBearerToken(authorizationHeader = "") {
  const [scheme, token] = authorizationHeader.trim().split(/\s+/);

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return "";
  }

  return token;
}

function sendUnauthorisedResponse(
  res,
  message = "Admin authentication is required.",
) {
  return res.status(401).json({
    success: false,
    message,
  });
}

async function requireAdminAuth(req, res, next) {
  const accessToken = readBearerToken(req.headers.authorization);

  if (!accessToken) {
    return sendUnauthorisedResponse(res);
  }

  try {
    const tokenPayload = verifyAdminAccessToken(accessToken);

    const adminId = tokenPayload?.sub;

    if (
      tokenPayload?.tokenType !== "admin-access" ||
      !adminId ||
      !mongoose.isValidObjectId(adminId)
    ) {
      return sendUnauthorisedResponse(res, "Invalid admin access token.");
    }

    const adminUser = await AdminUser.findById(adminId).select(
      "_id name email role isActive lastLoginAt passwordChangedAt",
    );

    if (!adminUser || !adminUser.isActive) {
      return sendUnauthorisedResponse(res, "Admin account is unavailable.");
    }

    if (adminUser.passwordChangedAt && tokenPayload.iat) {
      const passwordChangedAtSeconds = Math.floor(
        adminUser.passwordChangedAt.getTime() / 1000,
      );

      if (passwordChangedAtSeconds > tokenPayload.iat) {
        return sendUnauthorisedResponse(
          res,
          "Admin password changed after this token was issued. Please log in again.",
        );
      }
    }

    req.admin = adminUser;
    req.adminAccessToken = accessToken;

    return next();
  } catch (error) {
    if (error?.name === "TokenExpiredError") {
      return sendUnauthorisedResponse(
        res,
        "Admin session has expired. Please log in again.",
      );
    }

    return sendUnauthorisedResponse(res, "Invalid admin access token.");
  }
}

function requireAdminRoles(...allowedRoles) {
  return function adminRoleMiddleware(req, res, next) {
    if (!req.admin) {
      return sendUnauthorisedResponse(res);
    }

    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action.",
      });
    }

    return next();
  };
}

export { requireAdminAuth, requireAdminRoles };
