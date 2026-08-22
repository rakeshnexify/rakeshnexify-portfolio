import { Router } from "express";

import { getPublicCompanies } from "../controllers/company.controller.js";

const router = Router();

router.get("/", getPublicCompanies);

export default router;
