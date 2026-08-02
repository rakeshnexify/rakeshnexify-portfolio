import { Router } from "express";

import { getPublicStatistics } from "../controllers/statistic.controller.js";

const router = Router();

router.get("/", getPublicStatistics);

export default router;