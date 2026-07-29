import { Router } from "express";

import {
  getPublicProjectBySlug,
  getPublicProjects,
} from "../controllers/project.controller.js";

const router = Router();

router.get("/", getPublicProjects);
router.get("/:slug", getPublicProjectBySlug);

export default router;
