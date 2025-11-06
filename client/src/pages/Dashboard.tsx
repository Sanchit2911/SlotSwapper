// client/src/pages/Dashboard.tsx

import React, { useState, useEffect } from "react";
import { eventsAPI, getErrorMessage } from "../services/api";
import { Event, EventStatus } from "../types";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createEventSchema,
  CreateEventFormData,
} from "../schemas/event.schema";

export const Dashboard: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    mode: "onChange",
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await eventsAPI.getAll();
      setEvents(response.data.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (data: CreateEventFormData) => {
    setError("");
    setSuccess("");

    try {
      await eventsAPI.create(data);
      setSuccess("Event created successfully!");
      closeAndResetModal();
      fetchEvents();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  };

  const handleStatusChange = async (
    eventId: string,
    newStatus: EventStatus
  ) => {
    setError("");
    setSuccess("");

    try {
      await eventsAPI.update(eventId, { status: newStatus });
      setSuccess("Event status updated!");
      fetchEvents();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  };

  const confirmDeleteEvent = async () => {
    if (!showDeleteConfirm) return;

    setError("");
    setSuccess("");

    try {
      await eventsAPI.delete(showDeleteConfirm);
      setSuccess("Event deleted successfully!");
      fetchEvents();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    setShowDeleteConfirm(eventId);
  };

  const closeAndResetModal = () => {
    setShowModal(false);
    reset({ title: "", startTime: "", endTime: "" });
  };

  // FIXED: Added dark mode variants for statuses
  const getStatusColor = (status: EventStatus): string => {
    switch (status) {
      case EventStatus.BUSY:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case EventStatus.SWAPPABLE:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case EventStatus.SWAP_PENDING:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        {/* FIXED: Added dark:text-gray-100 */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          My Events
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
        >
          Create Event
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {events.length === 0 ? (
        <div className="text-center py-12">
          {/* FIXED: Added dark:text-gray-400 */}
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No events yet. Create your first event!
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <div
              key={event._id}
              // FIXED: Added dark:bg-gray-800
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {/* FIXED: Added dark:text-gray-100 */}
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {event.title}
                  </h3>
                  {/* FIXED: Added dark:text-gray-400 */}
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    {format(new Date(event.startTime), "PPpp")} -{" "}
                    {format(new Date(event.endTime), "p")}
                  </p>
                  <span
                    className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      event.status
                    )}`}
                  >
                    {event.status}
                  </span>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  {event.status === EventStatus.BUSY && (
                    <button
                      onClick={() =>
                        handleStatusChange(event._id, EventStatus.SWAPPABLE)
                      }
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm"
                    >
                      Make Swappable
                    </button>
                  )}
                  {event.status === EventStatus.SWAPPABLE && (
                    <button
                      onClick={() =>
                        handleStatusChange(event._id, EventStatus.BUSY)
                      }
                      className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm"
                    >
                      Mark as Busy
                    </button>
                  )}
                  {event.status !== EventStatus.SWAP_PENDING && (
                    <button
                      onClick={() => handleDeleteEvent(event._id)}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
                    >
                      Delete
                    </button>
                  )}
                  {event.status === EventStatus.SWAP_PENDING && (
                    // FIXED: Added dark:text-yellow-400
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 text-center">
                      Locked in swap
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          {/* FIXED: Added dark:bg-gray-800 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full">
            {/* FIXED: Added dark:text-gray-100 */}
            <h2 className="text-2xl font-bold mb-4 dark:text-gray-100">
              Create New Event
            </h2>
            <form
              onSubmit={handleSubmit(handleCreateEvent)}
              className="space-y-4"
            >
              <div>
                {/* FIXED: Added dark:text-gray-300 */}
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  {...register("title")}
                  /*
                   * FIXED: Added dark:bg-gray-700, dark:text-gray-100, dark:border-gray-600
                   */
                  className={`mt-1 block w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 ${
                    errors.title ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.title.message}
                  </p>
                )}
              </div>
              <div>
                {/* FIXED: Added dark:text-gray-300 */}
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  required
                  {...register("startTime")}
                  /*
                   * FIXED: Added dark:bg-gray-700, dark:text-gray-100, dark:border-gray-600
                   */
                  className={`mt-1 block w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 ${
                    errors.startTime ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.startTime && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.startTime.message}
                  </p>
                )}
              </div>
              <div>
                {/* FIXED: Added dark:text-gray-300 */}
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  required
                  {...register("endTime")}
                  /*
                   * FIXED: Added dark:bg-gray-700, dark:text-gray-100, dark:border-gray-600
                   */
                  className={`mt-1 block w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 ${
                    errors.endTime ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.endTime && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.endTime.message}
                  </p>
                )}
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create"}
                </button>
                {/* FIXED: Added dark: styles for cancel button */}
                <button
                  type="button"
                  onClick={closeAndResetModal}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          {/* FIXED: Added dark:bg-gray-800 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full">
            {/* FIXED: Added dark:text-gray-100 */}
            <h2 className="text-2xl font-bold mb-4 dark:text-gray-100">
              Are you sure?
            </h2>
            {/* FIXED: Added dark:text-gray-300 */}
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              This action cannot be undone. This will permanently delete the
              event.
            </p>
            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={confirmDeleteEvent}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Yes, Delete
              </button>
              {/* FIXED: Added dark: styles for cancel button */}
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
