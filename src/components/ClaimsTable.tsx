"use client";

import Link from "next/link";
import type { Claim } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const CONFIDENCE_THRESHOLD = 0.9;

export type SortKey =
  | "id"
  | "policyholder"
  | "claimDate"
  | "incidentType"
  | "status"
  | "reviewedBy"
  | "confidence";
export type SortDir = "asc" | "desc";

function getStatusVariant(
  status: Claim["status"]
): "default" | "success" | "warning" {
  switch (status) {
    case "Awaiting approval":
      return "success";
    case "Escalated":
      return "warning";
    case "Pending - Returned for Update":
      return "warning";
    default:
      return "default";
  }
}

interface ClaimsTableProps {
  claims: Claim[];
  sortKey?: SortKey;
  sortDir?: SortDir;
  onSort?: (key: SortKey) => void;
}

function SortIcon({
  active,
  dir,
}: {
  active: boolean;
  dir?: SortDir;
}) {
  if (!active || !dir) {
    return (
      <span className="ml-1 inline-block w-3 text-gray-400" aria-hidden>
        ⇅
      </span>
    );
  }
  return (
    <span className="ml-1 inline-block w-3 font-medium text-blue-600 dark:text-blue-400" aria-hidden>
      {dir === "asc" ? "↑" : "↓"}
    </span>
  );
}

export function ClaimsTable({
  claims,
  sortKey = "id",
  sortDir = "asc",
  onSort,
}: ClaimsTableProps) {
  const headers: { key: SortKey; label: string }[] = [
    { key: "id", label: "Claim ID" },
    { key: "policyholder", label: "Policyholder" },
    { key: "claimDate", label: "Claim Date" },
    { key: "incidentType", label: "Incident Type" },
    { key: "status", label: "Status" },
    { key: "confidence", label: "AI Confidence" },
  ];

  const getEstimateSourceBadgeVariant = (
    source: Claim["estimateSource"]
  ): "default" | "success" | "warning" => {
    switch (source) {
      case "AI only":
        return "default";
      case "Edited by claims agent":
        return "warning";
      case "Claims agent only":
        return "success";
      default:
        return "default";
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
            <tr>
              {headers.map(({ key, label }) => (
                <th key={key} className="px-4 py-3 font-medium">
                  {onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(key)}
                      className="flex items-center hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {label}
                      <SortIcon
                        active={sortKey === key}
                        dir={sortKey === key ? sortDir : undefined}
                      />
                    </button>
                  ) : (
                    label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {claims.map((claim) => {
              const lowConfidence =
                claim.aiAssessment.confidenceScore < CONFIDENCE_THRESHOLD;
              return (
                <tr key={claim.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/claim/${claim.id}?from=dashboard`}
                      className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {claim.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {claim.policyInfo.driverName}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {claim.incidentDetails.dateTime.split("T")[0]}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {claim.incidentDetails.type}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={getStatusVariant(claim.status)}>
                      {claim.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {claim.status === "Awaiting approval" || 
                     claim.status === "Pending - Returned for Update" ? (
                      <span className="flex items-center gap-1.5">
                        {Math.round(
                          claim.aiAssessment.confidenceScore * 100
                        )}
                        %
                        {lowConfidence && (
                          <Badge variant="warning" className="text-[10px]">
                            Review
                          </Badge>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
