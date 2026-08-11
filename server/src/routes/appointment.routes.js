import express from "express";

import { createAppointment } from "../controllers/appointment.controller.js";
import appointmentRateLimiter from "../middleware/appointmentRateLimiter.js";

const router = express.Router();

router.post(
  "/",
  appointmentRateLimiter,
  createAppointment,
);

export default router;