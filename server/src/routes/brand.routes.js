import { Router } from "express";

import {
  getPublicBrandBySlug,
  getPublicBrands,
} from "../controllers/brand.controller.js";

const router = Router();

router.get("/", getPublicBrands);

router.get("/:slug", getPublicBrandBySlug);

export default router;
