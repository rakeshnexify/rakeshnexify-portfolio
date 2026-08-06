import { Router } from "express";

import { getPublicEducation } from "../controllers/education.controller.js";

const router = Router();

router.get("/", getPublicEducation);

export default router;
