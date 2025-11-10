//  server/src/models/Events.ts   //
import mongoose, { Schema, Document } from "mongoose";
import { EventStatus, IUser } from "../types";

export interface IEvent extends Document {
  userId: mongoose.Types.ObjectId | IUser;
  title: string;
  startTime: Date;
  endTime: Date;
  status: EventStatus;
  swapRequestId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // <-- REMOVED index: true (Covered by the compound index below)
    },
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      minlength: [1, "Title must be at least 1 character"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    startTime: {
      type: Date,
      required: [true, "Start time is required"],
    },
    endTime: {
      type: Date,
      required: [true, "End time is required"],
    },
    status: {
      type: String,
      enum: Object.values(EventStatus),
      default: EventStatus.BUSY,
      required: true,
      index: true,
    },
    swapRequestId: {
      type: Schema.Types.ObjectId,
      ref: "SwapRequest",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Validate endTime is after startTime
eventSchema.pre("save", function (next) {
  if (this.endTime <= this.startTime) {
    next(new Error("End time must be after start time"));
  }
  next();
});

// Compound index for querying a user's events by date
// This is your MOST IMPORTANT index for the dashboard/calendar.
eventSchema.index({ userId: 1, startTime: 1 });

export default mongoose.model<IEvent>("Event", eventSchema);
