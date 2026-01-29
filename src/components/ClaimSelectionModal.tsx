"use client";

import { useState, useEffect, useCallback } from "react";
import type { Claim } from "@/lib/types";
import { useRouter } from "next/navigation";

interface ClaimSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ClaimSelectionModal({
  isOpen,
  onClose,
}: ClaimSelectionModalProps) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending Review" | "Pending - Returned for Update">("All");
  const router = useRouter();

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      // Add cache-busting to ensure we get fresh data
      const res = await fetch("/api/claims", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      if (!res.ok) {
        setClaims([]);
        return;
      }
      const data: Claim[] = await res.json();
      // Filter to show only claims that are pending review (not yet reviewed)
      // Exclude "Awaiting approval" and "Escalated" claims
      const pendingClaims = data.filter(
        (c) => c.status === "Pending Review" || c.status === "Pending - Returned for Update"
      );
      setClaims(pendingClaims);
    } catch {
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchClaims();
    }
  }, [isOpen, fetchClaims]);

  const handleProceed = () => {
    if (selectedClaimId) {
      router.push(`/claim/${selectedClaimId}`);
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Filter claims based on search query and status filter
  const filteredClaims = claims.filter((claim) => {
    // Status filter
    if (statusFilter !== "All" && claim.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (!searchQuery.trim()) {
      return true;
    }

    const query = searchQuery.toLowerCase().trim();
    const policyholder = claim.policyInfo?.driverName?.toLowerCase() || "";
    const claimId = claim.id.toLowerCase();
    const policyNumber = claim.policyInfo?.policyNumber?.toLowerCase() || "";
    const vehicleMake = claim.policyInfo?.vehicleDetails?.make?.toLowerCase() || "";
    const vehicleModel = claim.policyInfo?.vehicleDetails?.model?.toLowerCase() || "";
    const vehicleYear = claim.policyInfo?.vehicleDetails?.year?.toString() || "";
    const vehicleType = `${vehicleYear} ${vehicleMake} ${vehicleModel}`.toLowerCase();
    const incidentType = claim.incidentDetails?.type?.toLowerCase() || "";
    const status = claim.status.toLowerCase();
    // Include date in search - search both raw date string and formatted date
    const dateTime = claim.incidentDetails?.dateTime?.toLowerCase() || "";
    const formattedDate = formatDate(claim.incidentDetails?.dateTime || "").toLowerCase();

    return (
      policyholder.includes(query) ||
      claimId.includes(query) ||
      policyNumber.includes(query) ||
      vehicleMake.includes(query) ||
      vehicleModel.includes(query) ||
      vehicleType.includes(query) ||
      incidentType.includes(query) ||
      status.includes(query) ||
      dateTime.includes(query) ||
      formattedDate.includes(query)
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-4xl rounded-lg bg-white shadow-xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Select Claim to Review
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Search and Filter Section */}
        <div className="border-b border-gray-200 p-6 dark:border-gray-700">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <label
                htmlFor="claim-search"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Search
              </label>
              <input
                id="claim-search"
                type="text"
                placeholder="Search by claim ID, policyholder, policy #, vehicle, incident type, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div className="sm:w-48">
              <label
                htmlFor="status-filter"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Status
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as "All" | "Pending Review" | "Pending - Returned for Update"
                  )
                }
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="All">All</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Pending - Returned for Update">
                  Pending - Returned for Update
                </option>
              </select>
            </div>
          </div>
          {filteredClaims.length !== claims.length && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Showing {filteredClaims.length} of {claims.length} claims
            </p>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-600 dark:text-gray-400">Loading claims...</p>
            </div>
          ) : filteredClaims.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                {claims.length === 0
                  ? "No pending claims available for review."
                  : "No claims match your search criteria."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredClaims.map((claim) => {
                const isSelected = selectedClaimId === claim.id;
                const isAIAssessed = claim.aiAssessment && claim.aiAssessment.damages.length > 0;

                return (
                  <div
                    key={claim.id}
                    onClick={() => setSelectedClaimId(claim.id)}
                    className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                      isSelected
                        ? "border-blue-600 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
                        : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {claim.id}
                          </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div>
                            <span className="font-medium">Policyholder:</span>{" "}
                            {claim.policyInfo?.driverName || "N/A"}
                          </div>
                          <div>
                            <span className="font-medium">Policy #:</span>{" "}
                            {claim.policyInfo?.policyNumber || "N/A"}
                          </div>
                          <div>
                            <span className="font-medium">Claim Date:</span>{" "}
                            {formatDate(claim.incidentDetails?.dateTime || "")}
                          </div>
                          <div>
                            <span className="font-medium">Incident Type:</span>{" "}
                            {claim.incidentDetails?.type || "N/A"}
                          </div>
                          <div>
                            <span className="font-medium">Vehicle:</span>{" "}
                            {claim.policyInfo?.vehicleDetails
                              ? `${claim.policyInfo.vehicleDetails.year} ${claim.policyInfo.vehicleDetails.make} ${claim.policyInfo.vehicleDetails.model}`
                              : "N/A"}
                          </div>
                          <div>
                            <span className="font-medium">Status:</span>{" "}
                            <span
                              className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                                claim.status === "Pending Review"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                              }`}
                            >
                              {claim.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="ml-4 flex items-center text-blue-600 dark:text-blue-400">
                          <svg
                            className="h-6 w-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 p-6 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleProceed}
            disabled={!selectedClaimId}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Proceed with Review
          </button>
        </div>
      </div>
    </div>
  );
}
