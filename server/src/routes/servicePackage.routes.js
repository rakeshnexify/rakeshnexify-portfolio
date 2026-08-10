import { Router } from "express";

import {
  getPublicServicePackageBySlugs,
  getPublicServicePackages,
} from "../controllers/servicePackage.controller.js";

const router = Router();

router.get("/", getPublicServicePackages);
router.get(
  "/:serviceSlug/:group/:packageSlug",
  getPublicServicePackageBySlugs,
);

export default router;
