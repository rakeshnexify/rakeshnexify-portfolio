import { Router } from "express";

import {
  deleteAdminPushSubscription,
  getAdminPushStatus,
  saveAdminPushSubscription,
  sendAdminPushTest,
} from "../controllers/adminPush.controller.js";
import { requireAdminAuth } from "../middleware/adminAuth.middleware.js";

const router = Router();

router.use(requireAdminAuth);

router.get(
  "/status",
  getAdminPushStatus,
);

router.post(
  "/subscriptions",
  saveAdminPushSubscription,
);

router.delete(
  "/subscriptions",
  deleteAdminPushSubscription,
);

router.post(
  "/test",
  sendAdminPushTest,
);

export default router;
