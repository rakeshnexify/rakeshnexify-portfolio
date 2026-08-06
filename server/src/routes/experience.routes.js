import { Router } from "express";

import { getPublicExperience } from "../controllers/experience.controller.js";

const router = Router();

router.get("/", getPublicExperience);

export default router;
