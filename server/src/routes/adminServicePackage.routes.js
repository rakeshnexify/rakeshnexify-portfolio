import { Router } from "express";

import {
  createAdminServicePackage,
  deleteAdminServicePackage,
  getAdminServicePackageById,
  getAdminServicePackages,
  updateAdminServicePackage,
} from "../controllers/adminServicePackage.controller.js";
import {
  requireAdminAuth,
  requireAdminRoles,
} from "../middleware/adminAuth.middleware.js";

const router = Router();

router.use(requireAdminAuth);

router.get("/", getAdminServicePackages);

router.post(
  "/",
  requireAdminRoles("super-admin", "admin", "editor"),
  createAdminServicePackage,
);

router.get("/:id", getAdminServicePackageById);

router.patch(
  "/:id",
  requireAdminRoles("super-admin", "admin", "editor"),
  updateAdminServicePackage,
);

router.delete(
  "/:id",
  requireAdminRoles("super-admin", "admin"),
  deleteAdminServicePackage,
);

export default router;
