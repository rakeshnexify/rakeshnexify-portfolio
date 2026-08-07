import { Router } from "express";

import {
  createAdminPost,
  deleteAdminPost,
  getAdminPostById,
  getAdminPosts,
  updateAdminPost,
} from "../controllers/adminPost.controller.js";

import {
  requireAdminAuth,
  requireAdminRoles,
} from "../middleware/adminAuth.middleware.js";

const router = Router();

router.use(requireAdminAuth);

router.get("/", getAdminPosts);

router.post(
  "/",
  requireAdminRoles("super-admin", "admin", "editor"),
  createAdminPost,
);

router.get("/:id", getAdminPostById);

router.patch(
  "/:id",
  requireAdminRoles("super-admin", "admin", "editor"),
  updateAdminPost,
);

router.delete(
  "/:id",
  requireAdminRoles("super-admin", "admin"),
  deleteAdminPost,
);

export default router;
