import { Router } from "express";

import {
  createAdminEducation,
  deleteAdminEducation,
  getAdminEducation,
  getAdminEducationById,
  updateAdminEducation,
} from "../controllers/adminEducation.controller.js";

import {
  requireAdminAuth,
  requireAdminRoles,
} from "../middleware/adminAuth.middleware.js";

const router = Router();

router.use(requireAdminAuth);

router.get("/", getAdminEducation);

router.post(
  "/",
  requireAdminRoles("super-admin", "admin", "editor"),
  createAdminEducation,
);

router.get("/:id", getAdminEducationById);

router.patch(
  "/:id",
  requireAdminRoles("super-admin", "admin", "editor"),
  updateAdminEducation,
);

router.delete(
  "/:id",
  requireAdminRoles("super-admin", "admin"),
  deleteAdminEducation,
);

export default router;
