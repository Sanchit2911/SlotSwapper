// client/src/pages/Requests.tsx

import React, { useState, useEffect } from "react";
import { swapsAPI, getErrorMessage } from "../services/api";
import { SwapRequest } from "../types";
import { format } from "date-fns";

export const Requests: React.FC = () => {
  const [incomingRequests, setIncomingRequests] = useState<SwapRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"incoming" | "outgoing">(
    "incoming"
  );

  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(
    null
  );

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setError("");
    try {
      const [incomingResponse, outgoingResponse] = await Promise.all([
        swapsAPI.getIncoming(),
        swapsAPI.getOutgoing(),
      ]);

      setIncomingRequests(incomingResponse.data.data);
      setOutgoingRequests(outgoingResponse.data.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    setError("");
    setSuccess("");

    try {
      await swapsAPI.accept(requestId);
      setSuccess("Swap accepted! Your calendars have been updated.");
      fetchRequests();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  };

  const handleReject = async (requestId: string) => {
    setError("");
    setSuccess("");

    try {
      await swapsAPI.reject(requestId);
      setSuccess("Swap rejected.");
      fetchRequests();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  };

  const handleCancel = (requestId: string) => {
    setShowCancelConfirm(requestId);
  };

  const confirmCancel = async () => {
    if (!showCancelConfirm) return;

    setError("");
    setSuccess("");

    try {
      await swapsAPI.cancel(showCancelConfirm);
      setSuccess("Swap request cancelled.");
      fetchRequests();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setShowCancelConfirm(null);
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Swap Requests</h1>

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

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("incoming")}
          className={`px-6 py-3 font-medium ${
            activeTab === "incoming"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Incoming ({incomingRequests.length})
        </button>
        <button
          onClick={() => setActiveTab("outgoing")}
          className={`px-6 py-3 font-medium ${
            activeTab === "outgoing"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Outgoing ({outgoingRequests.length})
        </button>
      </div>

      {/* Incoming Requests */}
      {activeTab === "incoming" && (
        <div>
          {incomingRequests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No incoming swap requests at the moment.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {incomingRequests.map((request) => (
                <div
                  key={request._id}
                  className="bg-white p-6 rounded-lg shadow-md"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">
                          {request.requesterId.name}
                        </span>{" "}
                        wants to swap with you
                      </p>

                      <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-4 bg-blue-50 rounded">
                          <h4 className="font-semibold text-blue-900 mb-2">
                            They offer:
                          </h4>
                          <p className="font-medium">
                            {request.requesterSlotId.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {format(
                              new Date(request.requesterSlotId.startTime),
                              "PPpp"
                            )}
                          </p>
                        </div>

                        <div className="p-4 bg-green-50 rounded">
                          <h4 className="font-semibold text-green-900 mb-2">
                            For your:
                          </h4>
                          <p className="font-medium">
                            {request.targetSlotId.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {format(
                              new Date(request.targetSlotId.startTime),
                              "PPpp"
                            )}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 mt-3">
                        Requested on{" "}
                        {format(new Date(request.createdAt), "PPp")}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => handleAccept(request._id)}
                        className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(request._id)}
                        className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Outgoing Requests */}
      {activeTab === "outgoing" && (
        <div>
          {outgoingRequests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No outgoing swap requests at the moment.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {outgoingRequests.map((request) => (
                <div
                  key={request._id}
                  className="bg-white p-6 rounded-lg shadow-md"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-2">
                        Waiting for response from{" "}
                        <span className="font-medium">
                          {request.targetUserId.name}
                        </span>
                      </p>

                      <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-4 bg-blue-50 rounded">
                          <h4 className="font-semibold text-blue-900 mb-2">
                            You offered:
                          </h4>
                          <p className="font-medium">
                            {request.requesterSlotId.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {format(
                              new Date(request.requesterSlotId.startTime),
                              "PPpp"
                            )}
                          </p>
                        </div>

                        <div className="p-4 bg-green-50 rounded">
                          <h4 className="font-semibold text-green-900 mb-2">
                            For their:
                          </h4>
                          <p className="font-medium">
                            {request.targetSlotId.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {format(
                              new Date(request.targetSlotId.startTime),
                              "PPpp"
                            )}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 mt-3">
                        Requested on{" "}
                        {format(new Date(request.createdAt), "PPp")}
                      </p>
                    </div>

                    <div className="ml-4">
                      <button
                        onClick={() => handleCancel(request._id)}
                        className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
                      >
                        Cancel Request
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Are you sure?</h2>
            <p className="text-gray-700 mb-6">
              This will permanently cancel your swap request.
            </p>
            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={confirmCancel}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Yes, Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowCancelConfirm(null)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Keep Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
