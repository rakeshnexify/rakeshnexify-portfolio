import { Router } from "express";

import { getPublicSkills } from "../controllers/skill.controller.js";

const router = Router();

router.get("/", getPublicSkills);

export default router;