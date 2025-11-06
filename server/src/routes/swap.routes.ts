// server/src/routes/swap.routes.ts

import express from "express";
import {
  getAvailableSlots,
  createSwapRequest,
  getIncomingRequests,
  getOutgoingRequests,
  acceptSwapRequest,
  rejectSwapRequest,
  cancelSwapRequest,
} from "../controllers/swap.controller";
import { protect } from "../middleware/auth";

const router = express.Router();

router.use(protect); // All routes are protected

router.get("/available-slots", getAvailableSlots);
router.post("/request", createSwapRequest);
router.get("/incoming", getIncomingRequests);
router.get("/outgoing", getOutgoingRequests);
router.post("/:id/accept", acceptSwapRequest);
router.post("/:id/reject", rejectSwapRequest);
router.delete("/:id", cancelSwapRequest);

export default router;
