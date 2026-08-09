import { Router } from "express";

import {
  deleteAdminContactMessage,
  getAdminContactMessageById,
  getAdminContactMessages,
  updateAdminContactMessage,
} from "../controllers/adminContactMessage.controller.js";

import { convertContactMessageToLead } from "../controllers/adminLead.controller.js";

import {
  requireAdminAuth,
  requireAdminRoles,
} from "../middleware/adminAuth.middleware.js";

const router = Router();

router.use(requireAdminAuth);

router.get("/", getAdminContactMessages);

router.post(
  "/:id/convert-to-lead",
  requireAdminRoles("super-admin", "admin", "editor"),
  convertContactMessageToLead,
);

router.get("/:id", getAdminContactMessageById);

router.patch(
  "/:id",
  requireAdminRoles("super-admin", "admin", "editor"),
  updateAdminContactMessage,
);

router.delete(
  "/:id",
  requireAdminRoles("super-admin", "admin"),
  deleteAdminContactMessage,
);

export default router;
