import { Router } from "express";

import {
  getCurrentAdmin,
  loginAdmin,
} from "../controllers/adminAuth.controller.js";
import { requireAdminAuth } from "../middleware/adminAuth.middleware.js";

const router = Router();

router.post("/login", loginAdmin);

router.get("/me", requireAdminAuth, getCurrentAdmin);

export default router;
