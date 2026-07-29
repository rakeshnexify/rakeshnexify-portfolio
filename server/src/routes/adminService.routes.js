import { Router } from "express";

import {
  createAdminService,
  deleteAdminService,
  getAdminServiceById,
  getAdminServices,
  updateAdminService,
} from "../controllers/adminService.controller.js";
import {
  requireAdminAuth,
  requireAdminRoles,
} from "../middleware/adminAuth.middleware.js";

const router = Router();

router.use(requireAdminAuth);

router.get("/", getAdminServices);

router.post(
  "/",
  requireAdminRoles("super-admin", "admin", "editor"),
  createAdminService,
);

router.get("/:id", getAdminServiceById);

router.patch(
  "/:id",
  requireAdminRoles("super-admin", "admin", "editor"),
  updateAdminService,
);

router.delete(
  "/:id",
  requireAdminRoles("super-admin", "admin"),
  deleteAdminService,
);

export default router;
