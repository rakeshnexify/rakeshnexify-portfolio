import AdminUser from "../models/AdminUser.js";
import { createAdminAccessToken } from "../utils/adminToken.js";

const INVALID_LOGIN_MESSAGE = "Invalid admin email or password.";

function formatAdminUser(adminUser) {
  return {
    id: adminUser._id,
    name: adminUser.name,
    email: adminUser.email,
    role: adminUser.role,
    isActive: adminUser.isActive,
    lastLoginAt: adminUser.lastLoginAt,
    createdAt: adminUser.createdAt,
    updatedAt: adminUser.updatedAt,
  };
}

function validateLoginInput(requestBody = {}) {
  const email = String(requestBody.email || "")
    .trim()
    .toLowerCase();

  const password = String(requestBody.password || "");

  const fieldErrors = {};

  if (!email) {
    fieldErrors.email = "Admin email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "Please enter a valid email address.";
  }

  if (!password) {
    fieldErrors.password = "Admin password is required.";
  } else if (password.length > 128) {
    fieldErrors.password = "Admin password cannot exceed 128 characters.";
  }

  return {
    email,
    password,
    fieldErrors,
  };
}

function getRemainingLockSeconds(lockUntil) {
  if (!lockUntil) {
    return 0;
  }

  return Math.max(
    1,
    Math.ceil((new Date(lockUntil).getTime() - Date.now()) / 1000),
  );
}

function sendLockedResponse(res, lockUntil) {
  const retryAfterSeconds = getRemainingLockSeconds(lockUntil);

  res.set("Retry-After", String(retryAfterSeconds));

  return res.status(429).json({
    success: false,
    message: "Too many failed login attempts. Please try again later.",
    retryAfterSeconds,
  });
}

async function loginAdmin(req, res, next) {
  try {
    const { email, password, fieldErrors } = validateLoginInput(req.body);

    if (Object.keys(fieldErrors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Please correct the admin login details.",
        fieldErrors,
      });
    }

    const adminUser = await AdminUser.findOne({
      email,
    }).select(
      "+password name email role isActive lastLoginAt failedLoginAttempts lockUntil passwordChangedAt createdAt updatedAt",
    );

    if (!adminUser || !adminUser.isActive) {
      return res.status(401).json({
        success: false,
        message: INVALID_LOGIN_MESSAGE,
      });
    }

    if (adminUser.lockUntil && adminUser.lockUntil <= new Date()) {
      adminUser.failedLoginAttempts = 0;
      adminUser.lockUntil = null;

      await adminUser.save({
        validateBeforeSave: false,
      });
    }

    if (adminUser.isAccountLocked()) {
      return sendLockedResponse(res, adminUser.lockUntil);
    }

    const passwordMatches = await adminUser.comparePassword(password);

    if (!passwordMatches) {
      await adminUser.registerFailedLogin();

      if (adminUser.isAccountLocked()) {
        return sendLockedResponse(res, adminUser.lockUntil);
      }

      return res.status(401).json({
        success: false,
        message: INVALID_LOGIN_MESSAGE,
      });
    }

    await adminUser.registerSuccessfulLogin();

    const accessToken = createAdminAccessToken(adminUser);

    return res.status(200).json({
      success: true,
      message: "Admin login successful.",
      data: {
        accessToken,
        tokenType: "Bearer",
        expiresIn: process.env.JWT_EXPIRES_IN?.trim() || "2h",
        admin: formatAdminUser(adminUser),
      },
    });
  } catch (error) {
    return next(error);
  }
}

function getCurrentAdmin(req, res) {
  return res.status(200).json({
    success: true,
    data: {
      admin: formatAdminUser(req.admin),
    },
  });
}

export { getCurrentAdmin, loginAdmin };
