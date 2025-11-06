// client/src/types/index.ts

export enum EventStatus {
  BUSY = "BUSY",
  SWAPPABLE = "SWAPPABLE",
  SWAP_PENDING = "SWAP_PENDING",
}

export enum SwapRequestStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
}

export type User = {
  _id: string;
  name: string;
  email: string;
};

export type Event = {
  _id: string;
  userId: string | User;
  title: string;
  startTime: string;
  endTime: string;
  status: EventStatus;
  swapRequestId?: string;
  createdAt: string;
  updatedAt: string;
};

export type SwapRequest = {
  _id: string;
  requesterId: User;
  requesterSlotId: Event;
  targetUserId: User;
  targetSlotId: Event;
  status: SwapRequestStatus;
  createdAt: string;
  updatedAt: string;
};
