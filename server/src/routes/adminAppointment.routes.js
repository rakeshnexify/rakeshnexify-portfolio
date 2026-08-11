import express from "express";

import {
  convertAppointmentToLead,
  deleteAdminAppointment,
  getAdminAppointmentById,
  getAdminAppointments,
  updateAdminAppointment,
} from "../controllers/adminAppointment.controller.js";
import {
  requireAdminAuth,
  requireAdminRoles,
} from "../middleware/adminAuth.middleware.js";

const router = express.Router();

router.use(requireAdminAuth);

router.get("/", getAdminAppointments);

router.post(
  "/:id/convert-to-lead",
  requireAdminRoles(
    "super-admin",
    "admin",
    "editor",
  ),
  convertAppointmentToLead,
);

router.get("/:id", getAdminAppointmentById);

router.patch(
  "/:id",
  requireAdminRoles(
    "super-admin",
    "admin",
    "editor",
  ),
  updateAdminAppointment,
);

router.delete(
  "/:id",
  requireAdminRoles("super-admin", "admin"),
  deleteAdminAppointment,
);

export default router;