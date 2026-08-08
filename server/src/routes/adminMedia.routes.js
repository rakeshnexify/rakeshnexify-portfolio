import { Router } from "express";

import {
  createAdminMedia,
  deleteAdminMedia,
  getAdminMedia,
  getAdminMediaFolders,
  getAdminMediaById,
  updateAdminMedia,
} from "../controllers/adminMedia.controller.js";

import {
  requireAdminAuth,
  requireAdminRoles,
} from "../middleware/adminAuth.middleware.js";

import {
  mediaUploadMiddleware,
  requireMediaUpload,
} from "../middleware/mediaUpload.middleware.js";

const router = Router();

router.use(requireAdminAuth);

router.get("/", getAdminMedia);

router.post(
  "/",
  requireAdminRoles("super-admin", "admin", "editor"),
  mediaUploadMiddleware,
  requireMediaUpload,
  createAdminMedia,
);

router.get("/folders", getAdminMediaFolders);

router.get("/:id", getAdminMediaById);

router.patch(
  "/:id",
  requireAdminRoles("super-admin", "admin", "editor"),
  updateAdminMedia,
);

router.delete(
  "/:id",
  requireAdminRoles("super-admin", "admin"),
  deleteAdminMedia,
);

export default router;
