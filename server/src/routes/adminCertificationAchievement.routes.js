import { Router } from "express";

import {
  createAdminCertificationAchievement,
  deleteAdminCertificationAchievement,
  getAdminCertificationAchievementById,
  getAdminCertificationAchievements,
  updateAdminCertificationAchievement,
} from "../controllers/adminCertificationAchievement.controller.js";

import {
  requireAdminAuth,
  requireAdminRoles,
} from "../middleware/adminAuth.middleware.js";

const router = Router();

router.use(requireAdminAuth);

router.get("/", getAdminCertificationAchievements);

router.post(
  "/",
  requireAdminRoles("super-admin", "admin", "editor"),
  createAdminCertificationAchievement,
);

router.get("/:id", getAdminCertificationAchievementById);

router.patch(
  "/:id",
  requireAdminRoles("super-admin", "admin", "editor"),
  updateAdminCertificationAchievement,
);

router.delete(
  "/:id",
  requireAdminRoles("super-admin", "admin"),
  deleteAdminCertificationAchievement,
);

export default router;
