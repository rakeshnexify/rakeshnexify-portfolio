import { Router } from "express";

import {
  createAdminTeamMember,
  deleteAdminTeamMember,
  getAdminTeamMemberById,
  getAdminTeamMembers,
  updateAdminTeamMember,
} from "../controllers/adminTeamMember.controller.js";

import {
  requireAdminAuth,
  requireAdminRoles,
} from "../middleware/adminAuth.middleware.js";

const router = Router();

router.use(requireAdminAuth);

router.get("/", getAdminTeamMembers);

router.post(
  "/",
  requireAdminRoles("super-admin", "admin", "editor"),
  createAdminTeamMember,
);

router.get("/:id", getAdminTeamMemberById);

router.patch(
  "/:id",
  requireAdminRoles("super-admin", "admin", "editor"),
  updateAdminTeamMember,
);

router.delete(
  "/:id",
  requireAdminRoles("super-admin", "admin"),
  deleteAdminTeamMember,
);

export default router;
