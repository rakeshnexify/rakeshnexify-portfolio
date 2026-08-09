import { Router } from "express";

import { getPublicCertificationAchievements } from "../controllers/certificationAchievement.controller.js";

const router = Router();

router.get("/", getPublicCertificationAchievements);

export default router;
