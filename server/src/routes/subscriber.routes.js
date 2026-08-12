import express from "express";

import { createSubscriber } from "../controllers/subscriber.controller.js";
import subscriberRateLimiter from "../middleware/subscriberRateLimiter.js";

const router = express.Router();

router.post(
  "/",
  subscriberRateLimiter,
  createSubscriber,
);

export default router;
