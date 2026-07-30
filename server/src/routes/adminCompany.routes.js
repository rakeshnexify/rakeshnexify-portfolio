import { Router } from "express";

import {
  createAdminCompany,
  deleteAdminCompany,
  getAdminCompanies,
  getAdminCompanyById,
  updateAdminCompany,
} from "../controllers/adminCompany.controller.js";

import {
  requireAdminAuth,
  requireAdminRoles,
} from "../middleware/adminAuth.middleware.js";

const router = Router();

router.use(requireAdminAuth);

router.get("/", getAdminCompanies);

router.post(
  "/",
  requireAdminRoles("super-admin", "admin", "editor"),
  createAdminCompany,
);

router.get("/:id", getAdminCompanyById);

router.patch(
  "/:id",
  requireAdminRoles("super-admin", "admin", "editor"),
  updateAdminCompany,
);

router.delete(
  "/:id",
  requireAdminRoles("super-admin", "admin"),
  deleteAdminCompany,
);

export default router;
