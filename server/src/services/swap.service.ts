// server/src/services/swap.service.ts

import mongoose from "mongoose";
import Event, { IEvent } from "../models/Event";
import SwapRequest, { ISwapRequest } from "../models/SwapRequest";
import { EventStatus, SwapRequestStatus, IUser } from "../types";
import { startSafeSession } from "../utils/safeSessionHandler";

export class SwapService {
  /**
   * Create a swap request with validation and locking mechanism
   * Works safely even if MongoDB transactions are disabled (e.g., local dev)
   */
  async createSwapRequest(
    requesterId: string,
    requesterSlotId: string,
    targetSlotId: string
  ): Promise<ISwapRequest | null> {
    const session = await startSafeSession();
    const useSession = !(session as any).inFakeMode ? session : null;

    try {
      // 1. Fetch both slots with session lock
      const [requesterSlot, targetSlot] = await Promise.all([
        Event.findById(requesterSlotId).session(useSession),
        Event.findById(targetSlotId).session(useSession),
      ]);

      if (!requesterSlot || !targetSlot) {
        throw new Error("One or both slots not found");
      }

      if (requesterSlot.userId.toString() !== requesterId) {
        throw new Error("You do not own the offered slot");
      }

      if (requesterSlot.userId.toString() === targetSlot.userId.toString()) {
        throw new Error("Cannot swap with your own slot");
      }

      if (requesterSlot.status !== EventStatus.SWAPPABLE) {
        throw new Error("Your slot is not available for swapping");
      }

      if (targetSlot.status !== EventStatus.SWAPPABLE) {
        throw new Error("Target slot is no longer available for swapping");
      }

      const swapRequest = new SwapRequest({
        requesterId: new mongoose.Types.ObjectId(requesterId),
        requesterSlotId: new mongoose.Types.ObjectId(requesterSlotId),
        targetUserId: targetSlot.userId,
        targetSlotId: new mongoose.Types.ObjectId(targetSlotId),
        status: SwapRequestStatus.PENDING,
      });

      await swapRequest.save(useSession ? { session: useSession } : {});

      // Lock both slots
      requesterSlot.status = EventStatus.SWAP_PENDING;
      requesterSlot.swapRequestId = swapRequest._id as any;
      targetSlot.status = EventStatus.SWAP_PENDING;
      targetSlot.swapRequestId = swapRequest._id as any;

      await Promise.all([
        requesterSlot.save(useSession ? { session: useSession } : {}),
        targetSlot.save(useSession ? { session: useSession } : {}),
      ]);

      if (useSession) await session.commitTransaction();

      return await SwapRequest.findById(swapRequest._id)
        .populate("requesterId", "name email")
        .populate("requesterSlotId")
        .populate("targetUserId", "name email")
        .populate("targetSlotId");
    } catch (error) {
      if (useSession) await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Accept a swap request - atomic in replica set mode, safe fallback otherwise
   */
  async acceptSwapRequest(
    swapRequestId: string,
    userId: string
  ): Promise<ISwapRequest | null> {
    const session = await startSafeSession();
    const useSession = !(session as any).inFakeMode ? session : null;

    try {
      const swapRequest = await SwapRequest.findById(swapRequestId)
        .populate("requesterId", "name email")
        .populate("targetUserId", "name email")
        .session(useSession);

      if (!swapRequest) throw new Error("Swap request not found");

      if ((swapRequest.targetUserId as IUser)._id.toString() !== userId)
        throw new Error(
          "Unauthorized: You are not the recipient of this swap request"
        );

      if (swapRequest.status !== SwapRequestStatus.PENDING)
        throw new Error(
          `Swap request is already ${swapRequest.status.toLowerCase()}`
        );

      const [requesterSlot, targetSlot] = await Promise.all([
        Event.findById(swapRequest.requesterSlotId).session(useSession),
        Event.findById(swapRequest.targetSlotId).session(useSession),
      ]);

      if (!requesterSlot || !targetSlot)
        throw new Error("One or both slots no longer exist");

      if (requesterSlot.status !== EventStatus.SWAP_PENDING)
        throw new Error("Requester slot is no longer locked for this swap");

      if (targetSlot.status !== EventStatus.SWAP_PENDING)
        throw new Error("Target slot is no longer locked for this swap");

      if (String(requesterSlot.swapRequestId) !== String(swapRequest._id))
        throw new Error("Requester slot locked for another swap");

      if (String(targetSlot.swapRequestId) !== String(swapRequest._id))
        throw new Error("Target slot locked for another swap");

      // Perform swap
      const originalRequesterUserId = requesterSlot.userId;
      const originalTargetUserId = targetSlot.userId;

      requesterSlot.userId = originalTargetUserId;
      targetSlot.userId = originalRequesterUserId;

      requesterSlot.status = EventStatus.BUSY;
      requesterSlot.swapRequestId = undefined;
      targetSlot.status = EventStatus.BUSY;
      targetSlot.swapRequestId = undefined;

      swapRequest.status = SwapRequestStatus.ACCEPTED;

      await Promise.all([
        requesterSlot.save(useSession ? { session: useSession } : {}),
        targetSlot.save(useSession ? { session: useSession } : {}),
        swapRequest.save(useSession ? { session: useSession } : {}),
      ]);

      if (useSession) await session.commitTransaction();

      return await SwapRequest.findById(swapRequest._id)
        .populate("requesterId", "name email")
        .populate("requesterSlotId")
        .populate("targetUserId", "name email")
        .populate("targetSlotId");
    } catch (error) {
      if (useSession) await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Reject a swap request - unlocks both slots
   */
  async rejectSwapRequest(
    swapRequestId: string,
    userId: string
  ): Promise<ISwapRequest | null> {
    const session = await startSafeSession();
    const useSession = !(session as any).inFakeMode ? session : null;

    try {
      const swapRequest = await SwapRequest.findById(swapRequestId).session(
        useSession
      );
      if (!swapRequest) throw new Error("Swap request not found");

      if (swapRequest.targetUserId.toString() !== userId)
        throw new Error("Unauthorized: You are not the recipient");

      if (swapRequest.status !== SwapRequestStatus.PENDING)
        throw new Error(
          `Swap request is already ${swapRequest.status.toLowerCase()}`
        );

      const [requesterSlot, targetSlot] = await Promise.all([
        Event.findById(swapRequest.requesterSlotId).session(useSession),
        Event.findById(swapRequest.targetSlotId).session(useSession),
      ]);

      swapRequest.status = SwapRequestStatus.REJECTED;
      const updates: Promise<any>[] = [
        swapRequest.save(useSession ? { session: useSession } : {}),
      ];

      if (requesterSlot && requesterSlot.status === EventStatus.SWAP_PENDING) {
        requesterSlot.status = EventStatus.SWAPPABLE;
        requesterSlot.swapRequestId = undefined;
        updates.push(
          requesterSlot.save(useSession ? { session: useSession } : {})
        );
      }

      if (targetSlot && targetSlot.status === EventStatus.SWAP_PENDING) {
        targetSlot.status = EventStatus.SWAPPABLE;
        targetSlot.swapRequestId = undefined;
        updates.push(
          targetSlot.save(useSession ? { session: useSession } : {})
        );
      }

      await Promise.all(updates);

      if (useSession) await session.commitTransaction();

      return await SwapRequest.findById(swapRequest._id)
        .populate("requesterId", "name email")
        .populate("requesterSlotId")
        .populate("targetUserId", "name email")
        .populate("targetSlotId");
    } catch (error) {
      if (useSession) await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getAvailableSlots(userId: string): Promise<IEvent[]> {
    return Event.find({
      userId: { $ne: new mongoose.Types.ObjectId(userId) },
      status: EventStatus.SWAPPABLE,
    })
      .populate("userId", "name email")
      .sort({ startTime: 1 });
  }

  async getIncomingRequests(userId: string): Promise<ISwapRequest[]> {
    return SwapRequest.find({
      targetUserId: new mongoose.Types.ObjectId(userId),
      status: SwapRequestStatus.PENDING,
    })
      .populate("requesterId", "name email")
      .populate("requesterSlotId")
      .populate("targetSlotId")
      .sort({ createdAt: -1 });
  }

  async getOutgoingRequests(userId: string): Promise<ISwapRequest[]> {
    return SwapRequest.find({
      requesterId: new mongoose.Types.ObjectId(userId),
      status: SwapRequestStatus.PENDING,
    })
      .populate("targetUserId", "name email")
      .populate("requesterSlotId")
      .populate("targetSlotId")
      .sort({ createdAt: -1 });
  }

  async cancelSwapRequest(
    swapRequestId: string,
    userId: string
  ): Promise<{ message: string }> {
    const session = await startSafeSession();
    const useSession = !(session as any).inFakeMode ? session : null;

    try {
      const swapRequest = await SwapRequest.findById(swapRequestId).session(
        useSession
      );
      if (!swapRequest) throw new Error("Swap request not found");

      if (swapRequest.requesterId.toString() !== userId)
        throw new Error("Unauthorized: You did not create this request");

      if (swapRequest.status !== SwapRequestStatus.PENDING)
        throw new Error("Cannot cancel non-pending swap request");

      const [requesterSlot, targetSlot] = await Promise.all([
        Event.findById(swapRequest.requesterSlotId).session(useSession),
        Event.findById(swapRequest.targetSlotId).session(useSession),
      ]);

      await SwapRequest.findByIdAndDelete(
        swapRequestId,
        useSession ? { session: useSession } : {}
      );

      const updates: Promise<any>[] = [];
      if (requesterSlot && requesterSlot.status === EventStatus.SWAP_PENDING) {
        requesterSlot.status = EventStatus.SWAPPABLE;
        requesterSlot.swapRequestId = undefined;
        updates.push(
          requesterSlot.save(useSession ? { session: useSession } : {})
        );
      }
      if (targetSlot && targetSlot.status === EventStatus.SWAP_PENDING) {
        targetSlot.status = EventStatus.SWAPPABLE;
        targetSlot.swapRequestId = undefined;
        updates.push(
          targetSlot.save(useSession ? { session: useSession } : {})
        );
      }

      await Promise.all(updates);
      if (useSession) await session.commitTransaction();

      return { message: "Swap request cancelled successfully" };
    } catch (error) {
      if (useSession) await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

export default new SwapService();
