import { Router } from "express";

import {
  getPublicPostBySlug,
  getPublicPosts,
} from "../controllers/post.controller.js";

const router = Router();

router.get("/", getPublicPosts);
router.get("/:slug", getPublicPostBySlug);

export default router;
