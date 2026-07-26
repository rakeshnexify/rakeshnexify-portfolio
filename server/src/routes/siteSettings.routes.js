import { Router } from "express";

import { getPublicSiteSettings } from "../controllers/siteSettings.controller.js";

const router = Router();

router.get("/", getPublicSiteSettings);

export default router;
