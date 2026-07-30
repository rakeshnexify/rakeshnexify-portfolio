import { Router } from "express";

import {
  createAdminBrand,
  deleteAdminBrand,
  getAdminBrandById,
  getAdminBrands,
  updateAdminBrand,
} from "../controllers/adminBrand.controller.js";

import {
  requireAdminAuth,
  requireAdminRoles,
} from "../middleware/adminAuth.middleware.js";

const router = Router();

router.use(requireAdminAuth);

router.get("/", getAdminBrands);

router.post(
  "/",
  requireAdminRoles("super-admin", "admin", "editor"),
  createAdminBrand,
);

router.get("/:id", getAdminBrandById);

router.patch(
  "/:id",
  requireAdminRoles("super-admin", "admin", "editor"),
  updateAdminBrand,
);

router.delete(
  "/:id",
  requireAdminRoles("super-admin", "admin"),
  deleteAdminBrand,
);

export default router;
