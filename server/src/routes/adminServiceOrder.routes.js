import { Router } from "express";

import {
  deleteAdminServiceOrder,
  getAdminServiceOrderById,
  getAdminServiceOrders,
  updateAdminServiceOrder,
} from "../controllers/adminServiceOrder.controller.js";

import {
  requireAdminAuth,
  requireAdminRoles,
} from "../middleware/adminAuth.middleware.js";

const router = Router();

router.use(requireAdminAuth);

router.get("/", getAdminServiceOrders);

router.get("/:id", getAdminServiceOrderById);

router.patch(
  "/:id",
  requireAdminRoles("super-admin", "admin", "editor"),
  updateAdminServiceOrder,
);

router.delete(
  "/:id",
  requireAdminRoles("super-admin", "admin"),
  deleteAdminServiceOrder,
);

export default router;
