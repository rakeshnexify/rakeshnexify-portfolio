import { Router } from "express";

import {
  getPublicCompanies,
  getPublicCompanyBySlug,
} from "../controllers/company.controller.js";

const router = Router();

router.get("/", getPublicCompanies);

router.get("/:slug", getPublicCompanyBySlug);

export default router;
