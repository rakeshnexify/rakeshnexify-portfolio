import "dotenv/config";
import mongoose from "mongoose";

import connectDatabase from "../config/database.js";
import AdminUser from "../models/AdminUser.js";

function readRequiredEnvironmentVariable(variableName) {
  const value = process.env[variableName]?.trim();

  if (!value) {
    throw new Error(`${variableName} is missing from server/.env`);
  }

  return value;
}

function validateSetupPassword(password) {
  if (password.length < 12) {
    throw new Error(
      "ADMIN_SETUP_PASSWORD must contain at least 12 characters.",
    );
  }

  if (password.length > 128) {
    throw new Error("ADMIN_SETUP_PASSWORD cannot exceed 128 characters.");
  }
}

async function createSuperAdmin() {
  try {
    const name = readRequiredEnvironmentVariable("ADMIN_SETUP_NAME");

    const email =
      readRequiredEnvironmentVariable("ADMIN_SETUP_EMAIL").toLowerCase();

    const password = readRequiredEnvironmentVariable("ADMIN_SETUP_PASSWORD");

    validateSetupPassword(password);

    await connectDatabase();

    const existingSuperAdmin = await AdminUser.findOne({
      role: "super-admin",
    })
      .select("_id name email")
      .lean();

    if (existingSuperAdmin) {
      throw new Error(
        `A super-admin already exists with email ${existingSuperAdmin.email}.`,
      );
    }

    const existingEmail = await AdminUser.findOne({
      email,
    })
      .select("_id email role")
      .lean();

    if (existingEmail) {
      throw new Error(
        `An admin account already exists with email ${existingEmail.email}.`,
      );
    }

    const adminUser = await AdminUser.create({
      name,
      email,
      password,
      role: "super-admin",
      isActive: true,
    });

    console.log("");
    console.log("Super-admin created successfully.");
    console.log(`Admin ID: ${adminUser._id}`);
    console.log(`Name: ${adminUser.name}`);
    console.log(`Email: ${adminUser.email}`);
    console.log(`Role: ${adminUser.role}`);
    console.log("");
    console.log(
      "Remove ADMIN_SETUP_NAME, ADMIN_SETUP_EMAIL and ADMIN_SETUP_PASSWORD from server/.env now.",
    );
  } catch (error) {
    console.error("");
    console.error(`Super-admin setup failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    process.env.ADMIN_SETUP_PASSWORD = "";

    await mongoose.disconnect().catch(() => {});
  }
}

createSuperAdmin();
