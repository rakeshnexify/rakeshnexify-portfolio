import { Router } from "express";

import { createServiceOrder } from "../controllers/serviceOrder.controller.js";
import serviceOrderRateLimiter from "../middleware/serviceOrderRateLimiter.js";

const router = Router();

router.post("/", serviceOrderRateLimiter, createServiceOrder);

export default router;
