//  client/src/pages/Marketplace.tsx

import React, { useState, useEffect } from "react";
import { swapsAPI, eventsAPI, getErrorMessage } from "../services/api";
import { Event, EventStatus } from "../types";
import { format } from "date-fns";

interface UserObject {
  _id?: string;
  name: string;
  email?: string;
}

export const Marketplace: React.FC = () => {
  const [availableSlots, setAvailableSlots] = useState<Event[]>([]);
  const [mySwappableSlots, setMySwappableSlots] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTargetSlot, setSelectedTargetSlot] = useState<Event | null>(
    null
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setError("");
    try {
      const [slotsResponse, eventsResponse] = await Promise.all([
        swapsAPI.getAvailableSlots(),
        eventsAPI.getAll(),
      ]);

      setAvailableSlots(slotsResponse.data.data);

      const swappable = eventsResponse.data.data.filter(
        (e: Event) => e.status === EventStatus.SWAPPABLE
      );
      setMySwappableSlots(swappable);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSwap = (slot: Event) => {
    if (mySwappableSlots.length === 0) {
      setError(
        "You need to have at least one swappable slot to request a swap"
      );
      return;
    }
    setError("");
    setSelectedTargetSlot(slot);
    setShowModal(true);
  };

  const handleConfirmSwap = async (mySlotId: string) => {
    if (!selectedTargetSlot) return;

    setError("");
    setSuccess("");

    try {
      await swapsAPI.createRequest({
        mySlotId,
        theirSlotId: selectedTargetSlot._id,
      });
      setSuccess("Swap request sent successfully!");
      setShowModal(false);
      setSelectedTargetSlot(null);
      fetchData();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  };

  const getUserName = (event: Event): string => {
    if (typeof event.userId === "object" && event.userId !== null) {
      const userObj = event.userId as UserObject;
      return userObj.name;
    }
    return "Unknown User";
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Marketplace</h1>

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

      {mySwappableSlots.length === 0 && !loading && (
        <div className="mb-6 bg-yellow-50 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          You don't have any swappable slots. Go to your dashboard and mark an
          event as swappable first.
        </div>
      )}

      {availableSlots.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No available slots to swap at the moment.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {availableSlots.map((slot) => (
            <div
              key={slot._id}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {slot.title}
                </h3>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                  Available
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-2">
                Owner: <span className="font-medium">{getUserName(slot)}</span>
              </p>

              <div className="text-sm text-gray-700 mb-4">
                <p className="font-medium">Start:</p>
                <p>{format(new Date(slot.startTime), "PPpp")}</p>
                <p className="font-medium mt-2">End:</p>
                <p>{format(new Date(slot.endTime), "PPpp")}</p>
              </div>

              <button
                onClick={() => handleRequestSwap(slot)}
                disabled={mySwappableSlots.length === 0}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Request Swap
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Swap Request Modal */}
      {showModal && selectedTargetSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Request Swap</h2>

            <div className="mb-6 p-4 bg-gray-50 rounded">
              <h3 className="font-semibold mb-2">You want:</h3>
              <p className="text-lg">{selectedTargetSlot.title}</p>
              <p className="text-sm text-gray-600">
                {format(new Date(selectedTargetSlot.startTime), "PPpp")}
              </p>
            </div>

            <h3 className="font-semibold mb-3">
              Select one of your slots to offer:
            </h3>

            <div className="space-y-3">
              {mySwappableSlots.map((slot) => (
                <div
                  key={slot._id}
                  className="p-4 border border-gray-300 rounded hover:border-blue-500 cursor-pointer"
                  onClick={() => handleConfirmSwap(slot._id)}
                >
                  <h4 className="font-medium">{slot.title}</h4>
                  <p className="text-sm text-gray-600">
                    {format(new Date(slot.startTime), "PPpp")}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setShowModal(false);
                setSelectedTargetSlot(null);
              }}
              className="mt-6 w-full bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
