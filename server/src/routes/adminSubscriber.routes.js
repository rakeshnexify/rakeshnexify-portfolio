import express from "express";

import {
  deleteAdminSubscriber,
  getAdminSubscribers,
  updateAdminSubscriber,
} from "../controllers/adminSubscriber.controller.js";
import {
  requireAdminAuth,
  requireAdminRoles,
} from "../middleware/adminAuth.middleware.js";

const router = express.Router();

router.use(requireAdminAuth);

router.get("/", getAdminSubscribers);

router.patch(
  "/:id",
  requireAdminRoles(
    "super-admin",
    "admin",
    "editor",
  ),
  updateAdminSubscriber,
);

router.delete(
  "/:id",
  requireAdminRoles(
    "super-admin",
    "admin",
  ),
  deleteAdminSubscriber,
);

export default router;
