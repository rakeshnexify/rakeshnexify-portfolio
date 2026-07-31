import { Router } from "express";

import { createContactMessage } from "../controllers/contactMessage.controller.js";
import contactMessageRateLimiter from "../middleware/contactMessageRateLimiter.js";

const router = Router();

router.post("/", contactMessageRateLimiter, createContactMessage);

export default router;
