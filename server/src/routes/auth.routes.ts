// server/src/routes/auth.routes.ts

import express from "express";
import { signup, login, getMe } from "../controllers/auth.controller";
import { protect } from "../middleware/auth";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", protect, getMe);

export default router;
