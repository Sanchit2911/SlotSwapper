// tests/swapService.test.ts

import mongoose from "mongoose";
import SwapServiceClass, { SwapService } from "../src/services/swap.service";
import Event from "../src/models/Event";
import SwapRequest from "../src/models/SwapRequest";
import { EventStatus, SwapRequestStatus, IUser } from "../src/types";
import * as safeSession from "../src/utils/safeSessionHandler";

// MOCKS

jest.mock("../src/models/Event");
jest.mock("../src/models/SwapRequest");

const MockedEventModel = Event as jest.Mocked<typeof Event>;
const MockedSwapRequestModel = SwapRequest as jest.Mocked<typeof SwapRequest>;

// Mock session
const mockSession = {
  inFakeMode: true,
  commitTransaction: jest.fn().mockResolvedValue(undefined),
  abortTransaction: jest.fn().mockResolvedValue(undefined),
  endSession: jest.fn(),
  startTransaction: jest.fn(),
  withTransaction: jest.fn(),
  hasEnded: false,
  inTransaction: () => false,
  advanceClusterTime: jest.fn(),
  advanceOperationTime: jest.fn(),
  id: undefined,
  client: {} as any,
  options: {},
  transaction: { state: "NO_TRANSACTION" as const },
  clusterTime: undefined,
  operationTime: undefined,
};

jest
  .spyOn(safeSession, "startSafeSession")
  .mockResolvedValue(mockSession as any);

/**
 * Mocks a Mongoose query chain (findById, findOne, etc.)
 * Supports .populate(), .session(), and is "awaitable"
 */
const mockMongooseChain = (doc: any) => {
  const chain = {
    populate: jest.fn().mockReturnThis(),
    session: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn(() => Promise.resolve(doc)),
    // Mock .then() to make the query "awaitable"
    then: jest.fn(function (onFulfilled) {
      // Simulates await by calling the onFulfilled callback with the doc
      return Promise.resolve(onFulfilled(doc));
    }),
  };
  return chain;
};

describe("SwapService", () => {
  const swapService: SwapService = SwapServiceClass;

  let requester: IUser;
  let target: IUser;
  let requesterSlot: any;
  let targetSlot: any;
  let swapRequest: any;

  beforeEach(() => {
    const requesterId = new mongoose.Types.ObjectId();
    const targetId = new mongoose.Types.ObjectId();

    requester = {
      _id: requesterId.toHexString(),
      name: "Alice",
      email: "alice@test.com",
      password: "pass",
      comparePassword: async () => true,
    } as any;

    target = {
      _id: targetId.toHexString(),
      name: "Bob",
      email: "bob@test.com",
      password: "pass",
      comparePassword: async () => true,
    } as any;

    const requesterSlotId = new mongoose.Types.ObjectId();
    const targetSlotId = new mongoose.Types.ObjectId();

    requesterSlot = {
      _id: requesterSlotId,
      userId: requesterId,
      title: "Requester Slot",
      startTime: new Date(),
      endTime: new Date(Date.now() + 3600000),
      status: EventStatus.SWAPPABLE,
      swapRequestId: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      save: jest.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
      populate: jest.fn().mockResolvedValue(undefined),
    };

    targetSlot = {
      _id: targetSlotId,
      userId: targetId,
      title: "Target Slot",
      startTime: new Date(),
      endTime: new Date(Date.now() + 3600000),
      status: EventStatus.SWAPPABLE,
      swapRequestId: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      save: jest.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
      populate: jest.fn().mockResolvedValue(undefined),
    };

    swapRequest = {
      _id: new mongoose.Types.ObjectId(),
      requesterId: requesterSlot.userId,
      targetUserId: targetSlot.userId,
      requesterSlotId: requesterSlot._id,
      targetSlotId: targetSlot._id,
      status: SwapRequestStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      save: jest.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createSwapRequest", () => {
    beforeEach(() => {
      // Mock Event.findById for fetching slots
      MockedEventModel.findById = jest.fn().mockImplementation((id: any) => {
        let doc = null;
        if (id.toString() === requesterSlot._id.toString()) doc = requesterSlot;
        if (id.toString() === targetSlot._id.toString()) doc = targetSlot;
        return mockMongooseChain(doc);
      }) as any;

      // Mock SwapRequest constructor save
      MockedSwapRequestModel.prototype.save = jest
        .fn()
        .mockImplementation(function (this: any) {
          // 'this' is the swapRequest object created inside the service
          // 'swapRequest' (without 'this') is the global mock object

          this._id = swapRequest._id; // Assign the mock _id to the instance
          return Promise.resolve(this); // Return the mutated instance
        }) as any;

      // Mock SwapRequest.findById - this is called ONCE at the end
      MockedSwapRequestModel.findById = jest.fn().mockImplementation(() => {
        return mockMongooseChain({
          ...swapRequest,
          status: SwapRequestStatus.PENDING,
        });
      }) as any;
    });

    it("should create a swap request successfully", async () => {
      const result = await swapService.createSwapRequest(
        requester._id,
        requesterSlot._id.toString(),
        targetSlot._id.toString()
      );

      expect(result).toBeDefined();
      expect(result).not.toBeNull();

      if (result) {
        expect(result.status).toBe(SwapRequestStatus.PENDING);
      }
      expect(requesterSlot.status).toBe(EventStatus.SWAP_PENDING);
      expect(targetSlot.status).toBe(EventStatus.SWAP_PENDING);
      // This will now pass
      expect(requesterSlot.swapRequestId).toBeDefined();
      expect(targetSlot.swapRequestId).toBeDefined();
      expect(MockedSwapRequestModel.prototype.save).toHaveBeenCalled();
    });

    it("should throw error if user does not own requester slot", async () => {
      requesterSlot.userId = new mongoose.Types.ObjectId(
        "000000000000000000000001"
      );

      await expect(
        swapService.createSwapRequest(
          requester._id,
          requesterSlot._id.toString(),
          targetSlot._id.toString()
        )
      ).rejects.toThrow("You do not own the offered slot");
    });

    it("should throw error if swapping with own slot", async () => {
      targetSlot.userId = requesterSlot.userId;

      await expect(
        swapService.createSwapRequest(
          requester._id,
          requesterSlot._id.toString(),
          targetSlot._id.toString()
        )
      ).rejects.toThrow("Cannot swap with your own slot");
    });
  });

  describe("acceptSwapRequest", () => {
    let findByIdCallCount: number;

    beforeEach(() => {
      // Set up slots as if they're already locked by a swap request
      requesterSlot.status = EventStatus.SWAP_PENDING;
      targetSlot.status = EventStatus.SWAP_PENDING;
      requesterSlot.swapRequestId = swapRequest._id;
      targetSlot.swapRequestId = swapRequest._id;

      // Track number of calls to findById
      findByIdCallCount = 0;

      MockedSwapRequestModel.findById = jest.fn().mockImplementation(() => {
        findByIdCallCount++;

        if (findByIdCallCount === 1) {
          // First call: return swap request with session and populate
          const populatedSwapRequest = {
            ...swapRequest,
            targetUserId: target,
          };
          return mockMongooseChain(populatedSwapRequest);
        } else {
          // Second call: return with populate and lean chain
          return mockMongooseChain({
            ...swapRequest,
            status: SwapRequestStatus.ACCEPTED,
          });
        }
      }) as any;

      MockedEventModel.findById = jest.fn().mockImplementation((id: any) => {
        let doc = null;
        if (id.toString() === requesterSlot._id.toString()) doc = requesterSlot;
        if (id.toString() === targetSlot._id.toString()) doc = targetSlot;
        return mockMongooseChain(doc);
      }) as any;
    });

    it("should accept swap request successfully", async () => {
      const result = await swapService.acceptSwapRequest(
        swapRequest._id.toString(),
        target._id.toString()
      );

      expect(result).toBeDefined();
      expect(result).not.toBeNull();

      if (result) {
        expect(result.status).toBe(SwapRequestStatus.ACCEPTED);
      }
      expect(requesterSlot.userId.toString()).toBe(target._id.toString());
      expect(targetSlot.userId.toString()).toBe(requester._id.toString());
      expect(requesterSlot.status).toBe(EventStatus.BUSY);
      expect(targetSlot.status).toBe(EventStatus.BUSY);
      expect(requesterSlot.swapRequestId).toBeUndefined();
      expect(targetSlot.swapRequestId).toBeUndefined();
      expect(requesterSlot.save).toHaveBeenCalled();
      expect(targetSlot.save).toHaveBeenCalled();
    });

    it("should throw error if unauthorized user", async () => {
      await expect(
        swapService.acceptSwapRequest(
          swapRequest._id.toString(),
          "unauthorizedUser"
        )
      ).rejects.toThrow(
        "Unauthorized: You are not the recipient of this swap request"
      );
    });
  });

  describe("rejectSwapRequest", () => {
    let findByIdCallCount: number;
    beforeEach(() => {
      requesterSlot.status = EventStatus.SWAP_PENDING;
      targetSlot.status = EventStatus.SWAP_PENDING;

      // Track number of calls to findById
      findByIdCallCount = 0;

      MockedSwapRequestModel.findById = jest.fn().mockImplementation(() => {
        findByIdCallCount++;

        if (findByIdCallCount === 1) {
          // First call: return swap request with session
          return mockMongooseChain(swapRequest);
        } else {
          // Second call: return with populate and lean chain
          return mockMongooseChain({
            ...swapRequest,
            status: SwapRequestStatus.REJECTED,
          });
        }
      }) as any;

      MockedEventModel.findById = jest.fn().mockImplementation((id: any) => {
        let doc = null;
        if (id.toString() === requesterSlot._id.toString()) doc = requesterSlot;
        if (id.toString() === targetSlot._id.toString()) doc = targetSlot;
        return mockMongooseChain(doc);
      }) as any;
    });

    it("should reject swap request successfully", async () => {
      const result = await swapService.rejectSwapRequest(
        swapRequest._id.toString(),
        target._id.toString()
      );

      expect(result).toBeDefined();
      expect(result).not.toBeNull();

      if (result) {
        expect(result.status).toBe(SwapRequestStatus.REJECTED);
      }
      expect(requesterSlot.status).toBe(EventStatus.SWAPPABLE);
      expect(targetSlot.status).toBe(EventStatus.SWAPPABLE);
      expect(requesterSlot.swapRequestId).toBeUndefined();
      expect(targetSlot.swapRequestId).toBeUndefined();
      expect(requesterSlot.save).toHaveBeenCalled();
      expect(targetSlot.save).toHaveBeenCalled();
    });
  });

  describe("cancelSwapRequest", () => {
    beforeEach(() => {
      MockedSwapRequestModel.findById = jest
        .fn()
        .mockImplementation(() => mockMongooseChain(swapRequest)) as any;

      MockedEventModel.findById = jest.fn().mockImplementation((id: any) => {
        let doc = null;
        if (id.toString() === requesterSlot._id.toString()) doc = requesterSlot;
        if (id.toString() === targetSlot._id.toString()) doc = targetSlot;
        return mockMongooseChain(doc);
      }) as any;

      MockedSwapRequestModel.findByIdAndDelete = jest
        .fn()
        .mockImplementation(() => mockMongooseChain(swapRequest)) as any;
    });

    it("should cancel swap request successfully", async () => {
      requesterSlot.status = EventStatus.SWAP_PENDING;
      targetSlot.status = EventStatus.SWAP_PENDING;

      const result = await swapService.cancelSwapRequest(
        swapRequest._id.toString(),
        requester._id.toString()
      );

      expect(result).toBeDefined();
      expect(result).not.toBeNull();

      if (result) {
        expect(result.message).toBe("Swap request cancelled successfully");
      }
      expect(requesterSlot.status).toBe(EventStatus.SWAPPABLE);
      expect(targetSlot.status).toBe(EventStatus.SWAPPABLE);
      expect(requesterSlot.swapRequestId).toBeUndefined();
      expect(targetSlot.swapRequestId).toBeUndefined();
      expect(requesterSlot.save).toHaveBeenCalled();
      expect(targetSlot.save).toHaveBeenCalled();
      expect(MockedSwapRequestModel.findByIdAndDelete).toHaveBeenCalled();
    });
  });
});
