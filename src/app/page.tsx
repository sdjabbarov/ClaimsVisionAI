"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Claim } from "@/lib/types";
import { ClaimSelectionModal } from "@/components/ClaimSelectionModal";

function getStats(claims: Claim[]) {
  const pending = claims.filter((c) => c.status === "Pending Review").length;
  const pendingReturned = claims.filter(
    (c) => c.status === "Pending - Returned for Update"
  ).length;
  const sentForReview = claims.filter(
    (c) => c.status === "Awaiting approval"
  ).length;
  const escalated = claims.filter((c) => c.status === "Escalated").length;
  return {
    pending,
    pendingReturned,
    sentForReview,
    escalated,
  };
}

export default function LandingPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClaimModal, setShowClaimModal] = useState(false);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/claims");
      if (!res.ok) {
        setClaims([]);
        return;
      }
      const data: Claim[] = await res.json();
      setClaims(data);
    } catch {
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const stats = getStats(claims);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Scale Vision AI Branding */}
        <div className="mb-8 flex justify-end">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Powered by</span>
            <span className="flex items-center gap-1.5 font-semibold text-gray-900 dark:text-white">
              {/* Scale Vision AI Logo - Place logo at /public/scale-vision-ai-logo.svg or update src */}
              <span id="scaleai-logo-container">
                <img
                  src="/scale-vision-ai-logo.svg"
                  alt="Scale Vision AI"
                  className="h-5 w-auto hidden"
                  id="scaleai-logo-img"
                  onLoad={(e) => {
                    (e.target as HTMLImageElement).classList.remove('hidden');
                    const fallback = document.getElementById('scaleai-text-fallback');
                    if (fallback) fallback.classList.add('hidden');
                  }}
                  onError={() => {
                    const img = document.getElementById('scaleai-logo-img');
                    if (img) img.classList.add('hidden');
                  }}
                />
                <span id="scaleai-text-fallback">Scale Vision AI</span>
              </span>
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
            ClaimsVision AI
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Intelligent vehicle damage assessment and claims processing
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mb-12 grid gap-6 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setShowClaimModal(true)}
            className="group relative overflow-hidden rounded-lg border-2 border-gray-300 bg-white p-8 text-left transition-all hover:border-blue-600 hover:bg-blue-600 hover:text-white dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-500 dark:hover:bg-blue-500"
          >
            <div className="relative z-10">
              <div className="mb-2 flex items-center gap-2">
                <svg
                  className="h-6 w-6 text-gray-700 transition-colors group-hover:text-white dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h2 className="text-xl font-semibold text-gray-900 transition-colors group-hover:text-white dark:text-white">
                  Initiate Claim Review
                </h2>
              </div>
              <p className="text-sm text-gray-600 transition-colors group-hover:text-blue-100 dark:text-gray-400">
                Start reviewing a new claim with AI-powered damage assessment
              </p>
            </div>
          </button>

          <Link
            href="/dashboard"
            className="group relative overflow-hidden rounded-lg border-2 border-gray-300 bg-white p-8 text-left transition-all hover:border-blue-600 hover:bg-blue-600 hover:text-white dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-500 dark:hover:bg-blue-500"
          >
            <div className="relative z-10">
              <div className="mb-2 flex items-center gap-2">
                <svg
                  className="h-6 w-6 text-gray-700 transition-colors group-hover:text-white dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <h2 className="text-xl font-semibold text-gray-900 transition-colors group-hover:text-white dark:text-white">
                  Review Dashboard
                </h2>
              </div>
              <p className="text-sm text-gray-600 transition-colors group-hover:text-blue-100 dark:text-gray-400">
                View and manage all claims in the system
              </p>
            </div>
          </Link>

          <button
            type="button"
            disabled
            className="group relative overflow-hidden rounded-lg border-2 border-gray-300 bg-white p-8 text-left opacity-60 transition-all hover:border-blue-600 hover:bg-blue-600 hover:text-white dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-500 dark:hover:bg-blue-500"
          >
            <div className="relative z-10">
              <div className="mb-2 flex items-center gap-2">
                <svg
                  className="h-6 w-6 text-gray-700 transition-colors group-hover:text-white dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <h2 className="text-xl font-semibold text-gray-900 transition-colors group-hover:text-white dark:text-white">
                  Closed Reviews
                </h2>
              </div>
              <p className="text-sm text-gray-600 transition-colors group-hover:text-blue-100 dark:text-gray-400">
                Coming soon
              </p>
            </div>
          </button>
        </div>

        {/* Quick Start */}
        <div className="mb-12 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Quick Start
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-blue-600 dark:text-blue-400">•</span>
              <span>
                Click <strong>"Initiate Claim Review"</strong> to select and review a pending claim
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-blue-600 dark:text-blue-400">•</span>
              <span>
                Use the <strong>"Review Dashboard"</strong> to view all claims, filter by status, and access detailed views
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-blue-600 dark:text-blue-400">•</span>
              <span>
                AI assessments provide damage detection, cost estimates, and confidence scores
              </span>
            </li>
          </ul>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Pending Review
            </p>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {loading ? "..." : stats.pending}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Returned for Update
            </p>
            <p className="mt-2 text-3xl font-semibold text-amber-600 dark:text-amber-400">
              {loading ? "..." : stats.pendingReturned}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Awaiting Approval
            </p>
            <p className="mt-2 text-3xl font-semibold text-emerald-600 dark:text-emerald-400">
              {loading ? "..." : stats.sentForReview}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Escalated
            </p>
            <p className="mt-2 text-3xl font-semibold text-amber-600 dark:text-amber-400">
              {loading ? "..." : stats.escalated}
            </p>
          </div>
        </div>
      </div>

      <ClaimSelectionModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
      />
    </main>
  );
}
