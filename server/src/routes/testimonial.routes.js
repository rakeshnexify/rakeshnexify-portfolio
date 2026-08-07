import { Router } from "express";

import { getPublicTestimonials } from "../controllers/testimonial.controller.js";

const router = Router();

router.get("/", getPublicTestimonials);

export default router;
