"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import type { Claim } from "@/lib/types";
import { ClaimsTable, type SortKey, type SortDir } from "@/components/ClaimsTable";
import Link from "next/link";

function getStats(claims: Claim[]) {
  const pending = claims.filter((c) => c.status === "Pending Review").length;
  const pendingReturned = claims.filter(
    (c) => c.status === "Pending - Returned for Update"
  ).length;
  const sentForReview = claims.filter(
    (c) => c.status === "Awaiting approval"
  ).length;
  const escalated = claims.filter((c) => c.status === "Escalated").length;
  const lowConfidence = claims.filter(
    (c) =>
      (c.status === "Awaiting approval" ||
        c.status === "Pending - Returned for Update") &&
      c.aiAssessment.confidenceScore < 0.9
  ).length;
  return {
    pending,
    pendingReturned,
    sentForReview,
    escalated,
    lowConfidence,
  };
}

type StatusFilter =
  | "All"
  | "Pending Review"
  | "Pending - Returned for Update"
  | "Awaiting approval"
  | "Escalated";

function sortClaims(claims: Claim[], key: SortKey, dir: SortDir): Claim[] {
  const sorted = [...claims].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case "id":
        cmp = a.id.localeCompare(b.id);
        break;
      case "policyholder":
        cmp = a.policyInfo.driverName.localeCompare(b.policyInfo.driverName);
        break;
      case "claimDate":
        cmp = a.incidentDetails.dateTime.localeCompare(
          b.incidentDetails.dateTime
        );
        break;
      case "incidentType":
        cmp = a.incidentDetails.type.localeCompare(b.incidentDetails.type);
        break;
      case "status":
        cmp = a.status.localeCompare(b.status);
        break;
      case "reviewedBy":
        cmp = a.estimateSource.localeCompare(b.estimateSource);
        break;
      case "confidence":
        cmp =
          a.aiAssessment.confidenceScore - b.aiAssessment.confidenceScore;
        break;
      default:
        break;
    }
    return dir === "asc" ? cmp : -cmp;
  });
  return sorted;
}

export default function DashboardPage() {
  const pathname = usePathname();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [search, setSearch] = useState("");
  const [estimateSourceFilter, setEstimateSourceFilter] = useState<
    "All" | "AI only" | "Edited by claims agent" | "Claims agent only"
  >("All");

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Add timestamp query parameter to prevent any caching
      const timestamp = Date.now();
      const res = await fetch(`/api/claims?t=${timestamp}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
        },
      });
      if (!res.ok) {
        setError("Failed to load claims.");
        setClaims([]);
        return;
      }
      const data: Claim[] = await res.json();
      
      // Always log CLM-001 status
      const claim001 = data.find(c => c.id === "CLM-001");
      if (claim001) {
        console.log(`[Dashboard] Fetched claims: CLM-001 status is "${claim001.status}"`);
      } else {
        console.log(`[Dashboard] CLM-001 not found in fetched data`);
      }
      
      // Log all claim statuses for debugging
      console.log(`[Dashboard] Total claims fetched: ${data.length}`);
      data.forEach(c => {
        if (c.id.startsWith("CLM-00")) {
          console.log(`[Dashboard] ${c.id} status = "${c.status}"`);
        }
      });
      
      setClaims(data);
    } catch {
      setError("Failed to load claims.");
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Always fetch fresh data on mount
    fetchClaims();
    
    // Check if claims were updated while dashboard was not active
    const lastUpdateTime = sessionStorage.getItem("claimsLastUpdated");
    if (lastUpdateTime) {
      const timeSinceUpdate = Date.now() - parseInt(lastUpdateTime, 10);
      // If updated within last 60 seconds, refetch to ensure we have latest data
      if (timeSinceUpdate < 60000) {
        setTimeout(() => {
          fetchClaims();
        }, 200);
      }
    }
    
    // Listen for storage events (cross-tab updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "claimsLastUpdated") {
        setTimeout(() => {
          fetchClaims();
        }, 200);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [fetchClaims]);

  // Refetch when navigating to dashboard (pathname changes to /dashboard)
  useEffect(() => {
    if (pathname === "/dashboard") {
      const lastUpdateTime = sessionStorage.getItem("claimsLastUpdated");
      if (lastUpdateTime) {
        const timeSinceUpdate = Date.now() - parseInt(lastUpdateTime, 10);
        // If claims were updated recently (within last 60 seconds), refetch
        if (timeSinceUpdate < 60000) {
          fetchClaims();
        }
      }
    }
  }, [pathname, fetchClaims]);

  // Refetch when page becomes visible (user navigates back from detail page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Always refetch when becoming visible to ensure fresh data
        // Small delay to ensure any pending updates have completed
        setTimeout(() => {
          fetchClaims();
        }, 100);
      }
    };
    const handleFocus = () => {
      setTimeout(() => {
        fetchClaims();
      }, 100);
    };
    const handleClaimUpdated = () => {
      // Mark that claims were updated
      sessionStorage.setItem("claimsLastUpdated", Date.now().toString());
      // Refetch immediately when claim is updated
      setTimeout(() => {
        fetchClaims();
      }, 100);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("claimUpdated", handleClaimUpdated);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("claimUpdated", handleClaimUpdated);
    };
  }, [fetchClaims]);

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      const same = prev === key;
      setSortDir((d) => (same ? (d === "asc" ? "desc" : "asc") : "asc"));
      return key;
    });
  }, []);

  const filtered = useMemo(() => {
    let out = claims;
    if (statusFilter !== "All") {
      out = out.filter((c) => c.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.policyInfo.driverName.toLowerCase().includes(q) ||
          c.policyInfo.policyNumber.toLowerCase().includes(q)
      );
    }
    if (estimateSourceFilter !== "All") {
      out = out.filter((c) => c.estimateSource === estimateSourceFilter);
    }
    return out;
  }, [claims, statusFilter, search, estimateSourceFilter]);

  const sorted = useMemo(
    () => sortClaims(filtered, sortKey, sortDir),
    [filtered, sortKey, sortDir]
  );

  // Calculate stats based on filtered/visible claims
  const stats = getStats(filtered);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <p className="text-gray-600 dark:text-gray-400">Loading…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-950">
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
        <button
          type="button"
          onClick={fetchClaims}
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          Retry
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-4">
              <Link
                href="/"
                className="text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                ← Back to Home
              </Link>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
              Claims Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Review and manage vehicle damage claims with AI assessment.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchClaims}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Refresh
          </button>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Pending Review
            </p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {stats.pending}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Returned for Update
            </p>
            <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">
              {stats.pendingReturned}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Awaiting Approval
            </p>
            <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
              {stats.sentForReview}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Escalated
            </p>
            <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">
              {stats.escalated}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Low confidence (&lt;90%)
            </p>
            <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">
              {stats.lowConfidence}
            </p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label
              htmlFor="filter-status"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Status
            </label>
            <select
              id="filter-status"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as StatusFilter)
              }
              className="rounded border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="All">All</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Pending - Returned for Update">
                Pending - Returned for Update
              </option>
              <option value="Awaiting approval">
                Awaiting approval
              </option>
              <option value="Escalated">Escalated</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label
              htmlFor="filter-search"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Search
            </label>
            <input
              id="filter-search"
              type="text"
              placeholder="ID or policyholder"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Assessed by
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setEstimateSourceFilter("All")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                estimateSourceFilter === "All"
                  ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setEstimateSourceFilter("AI only")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                estimateSourceFilter === "AI only"
                  ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              AI only
            </button>
            <button
              type="button"
              onClick={() => setEstimateSourceFilter("Edited by claims agent")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                estimateSourceFilter === "Edited by claims agent"
                  ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Edited by claims agent
            </button>
            <button
              type="button"
              onClick={() => setEstimateSourceFilter("Claims agent only")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                estimateSourceFilter === "Claims agent only"
                  ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Claims agent only
            </button>
          </div>
        </div>

        <ClaimsTable
          claims={sorted}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
        />
      </div>
    </main>
  );
}
