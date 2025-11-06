//  server/src/models/SwapRequest.ts  //

import mongoose, { Schema, Document } from "mongoose";
import { SwapRequestStatus, IUser } from "../types";
import { IEvent } from "./Event";

export interface ISwapRequest extends Document {
  requesterId: mongoose.Types.ObjectId | IUser;
  requesterSlotId: mongoose.Types.ObjectId | IEvent;
  targetUserId: mongoose.Types.ObjectId | IUser;
  targetSlotId: mongoose.Types.ObjectId | IEvent;
  status: SwapRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

const swapRequestSchema = new Schema<ISwapRequest>(
  {
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    requesterSlotId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    targetUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    targetSlotId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(SwapRequestStatus),
      default: SwapRequestStatus.PENDING,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying incoming requests by target user
swapRequestSchema.index({ targetUserId: 1, status: 1 });

// Index for querying outgoing requests by requester
swapRequestSchema.index({ requesterId: 1, status: 1 });

export default mongoose.model<ISwapRequest>("SwapRequest", swapRequestSchema);
