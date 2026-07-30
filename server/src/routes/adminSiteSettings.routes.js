import { Router } from "express";

import {
  getAdminSiteSettings,
  updateAdminSiteSettings,
} from "../controllers/adminSiteSettings.controller.js";

import {
  requireAdminAuth,
  requireAdminRoles,
} from "../middleware/adminAuth.middleware.js";

const router = Router();

router.use(requireAdminAuth);

router.get("/", getAdminSiteSettings);

router.patch(
  "/",
  requireAdminRoles("super-admin", "admin", "editor"),
  updateAdminSiteSettings,
);

export default router;
