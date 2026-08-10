import { Router } from "express";

import {
  getPublicPackageDesignBySlugs,
  getPublicPackageDesigns,
} from "../controllers/packageDesign.controller.js";

const router = Router();

router.get(
  "/",
  getPublicPackageDesigns,
);

router.get(
  "/:serviceSlug/:group/:packageSlug/:designSlug",
  getPublicPackageDesignBySlugs,
);

export default router;
