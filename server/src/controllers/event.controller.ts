// server/src/controllers/event.controller.ts

import { Response, NextFunction } from "express"; // **CHANGE: Imported NextFunction**
import Event from "../models/Event";
import { AuthRequest } from "../middleware/auth";
import { EventStatus } from "../types";

// @desc    Get all events for logged-in user
// @route   GET /api/events
// @access  Private
export const getEvents = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction // **CHANGE: Added next**
) => {
  try {
    const events = await Event.find({ userId: req.user.id }).sort({
      startTime: 1,
    });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error: any) {
    // **CHANGE: Pass error to centralized error handler**
    next(error);
  }
};

// @desc    Create new event
// @route   POST /api/events
// @access  Private
export const createEvent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction // **CHANGE: Added next**
) => {
  try {
    const { title, startTime, endTime, status } = req.body;

    // **CHANGE: Removed all manual validation. Zod middleware handles this now.**

    const event = await Event.create({
      userId: req.user.id,
      title,
      startTime: new Date(startTime), // startTime and endTime are already validated strings
      endTime: new Date(endTime),
      status: status || EventStatus.BUSY,
    });

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error: any) {
    // **CHANGE: Pass error to centralized error handler**
    next(error);
  }
};

// @desc    Update event
// @route   PATCH /api/events/:id
// @access  Private
export const updateEvent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction // **CHANGE: Added next**
) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
      // Note: This could also be passed to error handler
      // next(new Error('Event not found'));
    }

    // Check ownership
    if (event.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this event",
      });
    }

    // Prevent status change if event is SWAP_PENDING
    if (
      event.status === EventStatus.SWAP_PENDING &&
      req.body.status !== EventStatus.SWAP_PENDING &&
      req.body.status !== undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot change status while swap is pending. Please cancel or complete the swap first.",
      });
    }

    // **CHANGE: Safer update logic**

    // Check date logic if dates are part of the update
    const newStartTime = req.body.startTime
      ? new Date(req.body.startTime)
      : event.startTime;
    const newEndTime = req.body.endTime
      ? new Date(req.body.endTime)
      : event.endTime;

    if (newEndTime <= newStartTime) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time",
      });
    }

    // Update fields
    // This is now safe because req.body has been filtered by updateEventSchema
    Object.assign(event, req.body);

    // Ensure dates are saved as Date objects if they were in req.body
    event.startTime = newStartTime;
    event.endTime = newEndTime;

    await event.save();

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error: any) {
    // **CHANGE: Pass error to centralized error handler**
    next(error);
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private
export const deleteEvent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction // **CHANGE: Added next**
) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check ownership
    if (event.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this event",
      });
    }

    // Prevent deletion if event is SWAP_PENDING
    if (event.status === EventStatus.SWAP_PENDING) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete event while swap is pending. Please cancel the swap first.",
      });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error: any) {
    // **CHANGE: Pass error to centralized error handler**
    next(error);
  }
};
