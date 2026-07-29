import { Router } from "express";

import {
  createAdminProject,
  deleteAdminProject,
  getAdminProjectById,
  getAdminProjects,
  updateAdminProject,
} from "../controllers/adminProject.controller.js";

import {
  requireAdminAuth,
  requireAdminRoles,
} from "../middleware/adminAuth.middleware.js";

const router = Router();

router.use(requireAdminAuth);

router.get("/", getAdminProjects);

router.post(
  "/",
  requireAdminRoles("super-admin", "admin", "editor"),
  createAdminProject,
);

router.get("/:id", getAdminProjectById);

router.patch(
  "/:id",
  requireAdminRoles("super-admin", "admin", "editor"),
  updateAdminProject,
);

router.delete(
  "/:id",
  requireAdminRoles("super-admin", "admin"),
  deleteAdminProject,
);

export default router;
