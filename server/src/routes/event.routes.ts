// server/src/routes/event.routes.ts
import express from "express";
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/event.controller";
import { protect } from "../middleware/auth";
// **CHANGE: Import validation middleware and schemas**
import { validate } from "../middleware/validation";
import { createEventSchema, updateEventSchema } from "../middleware/validation";

const router = express.Router();

router.use(protect); // All routes are protected

// **CHANGE: Added validate(createEventSchema) to the POST route**
router.route("/").get(getEvents).post(validate(createEventSchema), createEvent);

// **CHANGE: Added validate(updateEventSchema) to the PATCH route**
router
  .route("/:id")
  .patch(validate(updateEventSchema), updateEvent)
  .delete(deleteEvent);

export default router;
