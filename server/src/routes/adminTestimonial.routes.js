import { Router } from "express";

import {
  createAdminTestimonial,
  deleteAdminTestimonial,
  getAdminTestimonialById,
  getAdminTestimonials,
  updateAdminTestimonial,
} from "../controllers/adminTestimonial.controller.js";

import {
  requireAdminAuth,
  requireAdminRoles,
} from "../middleware/adminAuth.middleware.js";

const router = Router();

router.use(requireAdminAuth);

router.get("/", getAdminTestimonials);

router.post(
  "/",
  requireAdminRoles("super-admin", "admin", "editor"),
  createAdminTestimonial,
);

router.get("/:id", getAdminTestimonialById);

router.patch(
  "/:id",
  requireAdminRoles("super-admin", "admin", "editor"),
  updateAdminTestimonial,
);

router.delete(
  "/:id",
  requireAdminRoles("super-admin", "admin"),
  deleteAdminTestimonial,
);

export default router;
