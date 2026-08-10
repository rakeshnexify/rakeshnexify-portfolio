import { Router } from "express";

import {
  createAdminPackageDesign,
  deleteAdminPackageDesign,
  getAdminPackageDesignById,
  getAdminPackageDesigns,
  updateAdminPackageDesign,
} from "../controllers/adminPackageDesign.controller.js";
import {
  requireAdminAuth,
  requireAdminRoles,
} from "../middleware/adminAuth.middleware.js";

const router = Router();

router.use(requireAdminAuth);

router.get(
  "/",
  getAdminPackageDesigns,
);

router.post(
  "/",
  requireAdminRoles(
    "super-admin",
    "admin",
    "editor",
  ),
  createAdminPackageDesign,
);

router.get(
  "/:id",
  getAdminPackageDesignById,
);

router.patch(
  "/:id",
  requireAdminRoles(
    "super-admin",
    "admin",
    "editor",
  ),
  updateAdminPackageDesign,
);

router.delete(
  "/:id",
  requireAdminRoles(
    "super-admin",
    "admin",
  ),
  deleteAdminPackageDesign,
);

export default router;
