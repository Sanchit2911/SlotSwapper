import { z } from "zod";
import { EventStatus } from "../types"; // Import our new enum

// Schema for client-side event creation
// This mirrors your backend 'createEventSchema'
export const createEventSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200, "Title is too long"),
    // We use strings here because the <input type="datetime-local"> gives strings
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    status: z.nativeEnum(EventStatus).optional(),
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: "End time must be after start time",
    path: ["endTime"], // Apply the error to the 'endTime' field
  });

// Schema for client-side event updates
export const updateEventSchema = createEventSchema.partial();

// Export types for use in components
export type CreateEventFormData = z.infer<typeof createEventSchema>;
export type UpdateEventFormData = z.infer<typeof updateEventSchema>;
