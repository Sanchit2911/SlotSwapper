// server/src/controllers/swap.controller.ts

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import swapService from "../services/swap.service";
import logger from "../utils/logger";

// @desc    Get all available swappable slots
// @route   GET /api/swaps/available-slots
// @access  Private
export const getAvailableSlots = async (req: AuthRequest, res: Response) => {
  try {
    const slots = await swapService.getAvailableSlots(req.user.id);

    res.status(200).json({
      success: true,
      count: slots.length,
      data: slots,
    });
  } catch (error: any) {
    logger.error("Error fetching available slots", {
      error: error.message,
      user: req.user?.id,
    });
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Create a swap request
// @route   POST /api/swaps/request
// @access  Private
export const createSwapRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { mySlotId, theirSlotId } = req.body;

    if (!mySlotId || !theirSlotId) {
      return res.status(400).json({
        success: false,
        message: "Please provide both mySlotId and theirSlotId",
      });
    }

    const swapRequest = await swapService.createSwapRequest(
      req.user.id,
      mySlotId,
      theirSlotId
    );

    res.status(201).json({
      success: true,
      data: swapRequest,
      message: "Swap request created successfully",
    });
  } catch (error: any) {
    logger.error("Swap request creation failed", {
      error: error.message,
      user: req.user?.id,
      body: req.body,
    });
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create swap request",
    });
  }
};

// @desc    Get incoming swap requests
// @route   GET /api/swaps/incoming
// @access  Private
export const getIncomingRequests = async (req: AuthRequest, res: Response) => {
  try {
    const requests = await swapService.getIncomingRequests(req.user.id);

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error: any) {
    logger.error("Error fetching incoming swap requests", {
      error: error.message,
      user: req.user?.id,
    });
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Get outgoing swap requests
// @route   GET /api/swaps/outgoing
// @access  Private
export const getOutgoingRequests = async (req: AuthRequest, res: Response) => {
  try {
    const requests = await swapService.getOutgoingRequests(req.user.id);

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error: any) {
    logger.error("Error fetching outgoing swap requests", {
      error: error.message,
      user: req.user?.id,
    });
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Accept a swap request
// @route   POST /api/swaps/:id/accept
// @access  Private
export const acceptSwapRequest = async (req: AuthRequest, res: Response) => {
  try {
    const swapRequest = await swapService.acceptSwapRequest(
      req.params.id,
      req.user.id
    );

    res.status(200).json({
      success: true,
      data: swapRequest,
      message: "Swap accepted successfully! Events have been exchanged.",
    });
  } catch (error: any) {
    logger.error("Swap acceptance failed", {
      error: error.message,
      user: req.user?.id,
      params: req.params,
    });
    res.status(400).json({
      success: false,
      message: error.message || "Failed to accept swap request",
    });
  }
};

// @desc    Reject a swap request
// @route   POST /api/swaps/:id/reject
// @access  Private
export const rejectSwapRequest = async (req: AuthRequest, res: Response) => {
  try {
    const swapRequest = await swapService.rejectSwapRequest(
      req.params.id,
      req.user.id
    );

    res.status(200).json({
      success: true,
      data: swapRequest,
      message: "Swap request rejected",
    });
  } catch (error: any) {
    logger.error("Swap rejection failed", {
      error: error.message,
      user: req.user?.id,
      params: req.params,
    });
    res.status(400).json({
      success: false,
      message: error.message || "Failed to reject swap request",
    });
  }
};

// @desc    Cancel an outgoing swap request
// @route   DELETE /api/swaps/:id
// @access  Private
export const cancelSwapRequest = async (req: AuthRequest, res: Response) => {
  try {
    const result = await swapService.cancelSwapRequest(
      req.params.id,
      req.user.id
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    logger.error("Swap cancelation failed", {
      error: error.message,
      user: req.user?.id,
      params: req.params,
    });
    res.status(400).json({
      success: false,
      message: error.message || "Failed to cancel swap request",
    });
  }
};
