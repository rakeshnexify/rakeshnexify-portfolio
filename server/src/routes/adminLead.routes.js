import { Router } from "express";

import {
  addAdminLeadNote,
  createAdminLead,
  deleteAdminLead,
  getAdminLeadById,
  getAdminLeads,
  updateAdminLead,
} from "../controllers/adminLead.controller.js";

import {
  requireAdminAuth,
  requireAdminRoles,
} from "../middleware/adminAuth.middleware.js";

const router = Router();

router.use(requireAdminAuth);

router.get("/", getAdminLeads);

router.post(
  "/",
  requireAdminRoles("super-admin", "admin", "editor"),
  createAdminLead,
);

router.get("/:id", getAdminLeadById);

router.patch(
  "/:id",
  requireAdminRoles("super-admin", "admin", "editor"),
  updateAdminLead,
);

router.post(
  "/:id/notes",
  requireAdminRoles("super-admin", "admin", "editor"),
  addAdminLeadNote,
);

router.delete(
  "/:id",
  requireAdminRoles("super-admin", "admin"),
  deleteAdminLead,
);

export default router;
