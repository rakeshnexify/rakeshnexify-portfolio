import { Router } from "express";

import {
  createAdminExperience,
  deleteAdminExperience,
  getAdminExperience,
  getAdminExperienceById,
  updateAdminExperience,
} from "../controllers/adminExperience.controller.js";

import {
  requireAdminAuth,
  requireAdminRoles,
} from "../middleware/adminAuth.middleware.js";

const router = Router();

router.use(requireAdminAuth);

router.get("/", getAdminExperience);

router.post(
  "/",
  requireAdminRoles("super-admin", "admin", "editor"),
  createAdminExperience,
);

router.get("/:id", getAdminExperienceById);

router.patch(
  "/:id",
  requireAdminRoles("super-admin", "admin", "editor"),
  updateAdminExperience,
);

router.delete(
  "/:id",
  requireAdminRoles("super-admin", "admin"),
  deleteAdminExperience,
);

export default router;
