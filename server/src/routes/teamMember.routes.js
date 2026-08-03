import { Router } from "express";

import {
  getPublicTeamMemberBySlug,
  getPublicTeamMembers,
} from "../controllers/teamMember.controller.js";

const router = Router();

router.get("/", getPublicTeamMembers);

router.get("/:slug", getPublicTeamMemberBySlug);

export default router;
