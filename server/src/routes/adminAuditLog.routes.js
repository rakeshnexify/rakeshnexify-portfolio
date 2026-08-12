import express from "express";

import {
  getAdminAuditLogById,
  getAdminAuditLogs,
} from "../controllers/adminAuditLog.controller.js";
import {
  requireAdminAuth,
  requireAdminRoles,
} from "../middleware/adminAuth.middleware.js";

const router = express.Router();

router.use(requireAdminAuth);
router.use(requireAdminRoles("super-admin"));

router.get("/", getAdminAuditLogs);
router.get("/:id", getAdminAuditLogById);

export default router;
