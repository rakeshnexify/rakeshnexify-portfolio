import { Router } from "express";

import {
  createAdminFaq,
  deleteAdminFaq,
  getAdminFaqById,
  getAdminFaqs,
  updateAdminFaq,
} from "../controllers/adminFaq.controller.js";

import {
  requireAdminAuth,
  requireAdminRoles,
} from "../middleware/adminAuth.middleware.js";

const router = Router();

router.use(requireAdminAuth);

router.get("/", getAdminFaqs);

router.post(
  "/",
  requireAdminRoles("super-admin", "admin", "editor"),
  createAdminFaq,
);

router.get("/:id", getAdminFaqById);

router.patch(
  "/:id",
  requireAdminRoles("super-admin", "admin", "editor"),
  updateAdminFaq,
);

router.delete(
  "/:id",
  requireAdminRoles("super-admin", "admin"),
  deleteAdminFaq,
);

export default router;
