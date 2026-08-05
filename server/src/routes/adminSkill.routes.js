import { Router } from "express";

import {
  createAdminSkill,
  deleteAdminSkill,
  getAdminSkillById,
  getAdminSkills,
  updateAdminSkill,
} from "../controllers/adminSkill.controller.js";

import {
  requireAdminAuth,
  requireAdminRoles,
} from "../middleware/adminAuth.middleware.js";

const router = Router();

router.use(requireAdminAuth);

router.get("/", getAdminSkills);

router.post(
  "/",
  requireAdminRoles("super-admin", "admin", "editor"),
  createAdminSkill,
);

router.get("/:id", getAdminSkillById);

router.patch(
  "/:id",
  requireAdminRoles("super-admin", "admin", "editor"),
  updateAdminSkill,
);

router.delete(
  "/:id",
  requireAdminRoles("super-admin", "admin"),
  deleteAdminSkill,
);

export default router;
