import { Router } from "express";

import {
  createAdminStatistic,
  deleteAdminStatistic,
  getAdminStatisticById,
  getAdminStatistics,
  updateAdminStatistic,
} from "../controllers/adminStatistic.controller.js";
import {
  requireAdminAuth,
  requireAdminRoles,
} from "../middleware/adminAuth.middleware.js";

const router = Router();

router.use(requireAdminAuth);

router.get("/", getAdminStatistics);

router.post(
  "/",
  requireAdminRoles("super-admin", "admin", "editor"),
  createAdminStatistic,
);

router.get("/:id", getAdminStatisticById);

router.patch(
  "/:id",
  requireAdminRoles("super-admin", "admin", "editor"),
  updateAdminStatistic,
);

router.delete(
  "/:id",
  requireAdminRoles("super-admin", "admin"),
  deleteAdminStatistic,
);

export default router;
