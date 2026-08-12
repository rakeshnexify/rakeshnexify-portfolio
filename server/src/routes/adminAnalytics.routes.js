import express from "express";

import {
  getAdminAnalytics,
} from "../controllers/adminAnalytics.controller.js";
import {
  requireAdminAuth,
} from "../middleware/adminAuth.middleware.js";

const router = express.Router();

router.use(requireAdminAuth);

router.get(
  "/",
  getAdminAnalytics,
);

export default router;
