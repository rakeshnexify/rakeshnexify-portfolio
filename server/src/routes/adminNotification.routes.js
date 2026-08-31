import { Router } from "express";

import {
  getAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "../controllers/adminNotification.controller.js";
import { requireAdminAuth } from "../middleware/adminAuth.middleware.js";

const router = Router();

router.use(requireAdminAuth);

router.get("/", getAdminNotifications);

router.patch(
  "/read-all",
  markAllAdminNotificationsRead,
);

router.patch(
  "/:id/read",
  markAdminNotificationRead,
);

export default router;
