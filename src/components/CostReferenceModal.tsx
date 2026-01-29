"use client";

import { useEffect, useState } from "react";
import type { Damage } from "@/lib/types";

interface DataSource {
  source: string;
  recordCount: number | string;
  averageCost: number;
  notes: string;
}

interface DamageTypeReference {
  type: string;
  averageCost: number;
  costRange: {
    min: number;
    max: number;
  };
  dataSources: DataSource[];
}

interface CostReferenceModalProps {
  damage: Damage;
  isOpen: boolean;
  onClose: () => void;
}

export function CostReferenceModal({
  damage,
  isOpen,
  onClose,
}: CostReferenceModalProps) {
  const [referenceData, setReferenceData] =
    useState<DamageTypeReference | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    async function loadReferenceData() {
      try {
        const response = await fetch("/reference_database.json");
        if (!response.ok) {
          throw new Error(`Failed to fetch reference database: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        
        if (!data || !data.damageTypes || !Array.isArray(data.damageTypes)) {
          throw new Error("Invalid reference database structure");
        }
        
        const damageTypeLower = damage.type.toLowerCase();
        
        // Try exact match first
        let match = data.damageTypes.find(
          (dt: DamageTypeReference) =>
            dt.type.toLowerCase() === damageTypeLower
        );
        
        // Try partial match if no exact match
        if (!match) {
          match = data.damageTypes.find((dt: DamageTypeReference) => {
            const dtLower = dt.type.toLowerCase();
            return (
              damageTypeLower.includes(dtLower) ||
              dtLower.includes(damageTypeLower) ||
              // Handle common variations
              (damageTypeLower.includes("bumper") && dtLower.includes("bumper")) ||
              (damageTypeLower.includes("hood") && dtLower.includes("hood")) ||
              (damageTypeLower.includes("headlight") && dtLower.includes("headlight")) ||
              (damageTypeLower.includes("tail") && dtLower.includes("tail")) ||
              (damageTypeLower.includes("door") && dtLower.includes("door")) ||
              (damageTypeLower.includes("windshield") && dtLower.includes("windshield")) ||
              (damageTypeLower.includes("grille") && dtLower.includes("grille")) ||
              (damageTypeLower.includes("quarter") && dtLower.includes("quarter")) ||
              (damageTypeLower.includes("fender") && dtLower.includes("fender")) ||
              (damageTypeLower.includes("paint") && dtLower.includes("paint")) ||
              (damageTypeLower.includes("mirror") && dtLower.includes("mirror")) ||
              (damageTypeLower.includes("frame") && dtLower.includes("frame")) ||
              (damageTypeLower.includes("cab") && dtLower.includes("cab")) ||
              (damageTypeLower.includes("pillar") && dtLower.includes("pillar")) ||
              (damageTypeLower.includes("structure") && dtLower.includes("structure")) ||
              (damageTypeLower.includes("steering") && dtLower.includes("steering")) ||
              (damageTypeLower.includes("water") && dtLower.includes("water")) ||
              (damageTypeLower.includes("hail") && dtLower.includes("hail")) ||
              (damageTypeLower.includes("destruction") && dtLower.includes("destruction"))
            );
          });
        }
        
        if (match) {
          console.log(`Found reference data for "${damage.type}": matched to "${match.type}"`);
        } else {
          console.warn(`No reference data found for damage type: "${damage.type}"`);
        }
        
        setReferenceData(match || null);
      } catch (error) {
        console.error("Error loading reference data:", error);
        setReferenceData(null);
      } finally {
        setLoading(false);
      }
    }

    setLoading(true);
    loadReferenceData();
  }, [isOpen, damage.type]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Cost Reference: {damage.type}
            </h2>
            <button
              onClick={onClose}
              className="rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Close"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {damage.location} · Estimated: ${damage.estimatedCost.toLocaleString()}
          </p>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500 dark:text-gray-400">
                Loading reference data...
              </div>
            </div>
          ) : referenceData ? (
            <div className="space-y-6">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
                <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Market Average
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${referenceData.averageCost.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    (Range: ${referenceData.costRange.min.toLocaleString()} - $
                    {referenceData.costRange.max.toLocaleString()})
                  </span>
                </div>
                {damage.estimatedCost && (
                  <div className="mt-2">
                    <span
                      className={`text-sm font-medium ${
                        Math.abs(damage.estimatedCost - referenceData.averageCost) /
                          referenceData.averageCost <
                        0.1
                          ? "text-emerald-600 dark:text-emerald-400"
                          : Math.abs(
                              damage.estimatedCost - referenceData.averageCost
                            ) /
                              referenceData.averageCost <
                            0.2
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      Your estimate: ${damage.estimatedCost.toLocaleString()}
                      {damage.estimatedCost > referenceData.averageCost
                        ? ` (+${(
                            ((damage.estimatedCost - referenceData.averageCost) /
                              referenceData.averageCost) *
                            100
                          ).toFixed(1)}%)`
                        : ` (${(
                            ((damage.estimatedCost - referenceData.averageCost) /
                              referenceData.averageCost) *
                            100
                          ).toFixed(1)}%)`}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Data Sources
                </h3>
                <div className="space-y-3">
                  {referenceData.dataSources.map((source, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {source.source}
                          </h4>
                          {source.recordCount !== "N/A" && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {typeof source.recordCount === "number"
                                ? source.recordCount.toLocaleString()
                                : source.recordCount}{" "}
                              records
                            </p>
                          )}
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Average: ${source.averageCost.toLocaleString()}
                          </p>
                          {source.notes && source.notes !== "N/A" && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {source.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              No reference data available for "{damage.type}".
              <br />
              <span className="text-xs">
                This estimate is based on AI analysis of the vehicle damage.
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-4 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
