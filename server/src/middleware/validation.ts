// server/src/middleware/validation.ts
import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.issues.map((e: z.ZodIssue) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
};

// Example Schemas

export const signupSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(50),
    email: z.string().email(),
    password: z.string().min(8).max(128),
  }),
});

export const createEventSchema = z.object({
  body: z
    .object({
      title: z.string().min(1).max(200),
      // Use z.coerce.date() to convert the string to a Date object
      startTime: z.coerce.date(),
      endTime: z.coerce.date(),
      status: z.enum(["BUSY", "SWAPPABLE", "SWAP_PENDING"]).optional(),
    })
    // **CHANGE: Added .refine() to validate date logic here, not in the controller**
    .refine((data) => data.endTime > data.startTime, {
      message: "End time must be after start time",
      path: ["endTime"], // Field to assign the error to
    }),
});

// **CHANGE: Added updateEventSchema for PATCH requests (all fields optional)**
export const updateEventSchema = z.object({
  body: createEventSchema.shape.body.partial(), // Makes all fields optional
});
