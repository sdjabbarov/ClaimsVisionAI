"use client";

import { useCallback, useState, useEffect } from "react";
import type {
  AIAssessment,
  ClaimStatus,
  Damage,
  EstimateSource,
  BoundingBox,
} from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CostReferenceModal } from "@/components/CostReferenceModal";
import { VehicleValueModal } from "@/components/VehicleValueModal";

const CONFIDENCE_THRESHOLD = 0.9;
const SEVERITIES = ["Low", "Medium", "High", "Critical"] as const;

function totalFromDamages(damages: Damage[]): number {
  return damages.reduce((sum, d) => sum + d.estimatedCost, 0);
}

interface AssessmentPanelProps {
  assessment: AIAssessment;
  originalAIAssessment?: AIAssessment;
  estimateSource: EstimateSource;
  claimId: string;
  onAssessmentChange?: (assessment: AIAssessment) => void;
  onEstimateSourceChange?: (source: EstimateSource) => void;
  onApprove?: (claimId: string, assessment: AIAssessment) => void;
  onEscalate?: (claimId: string, assessment: AIAssessment) => void;
  onRevert?: (claimId: string) => void;
  currentStatus?: ClaimStatus;
  annotationMode?: boolean;
  onToggleAnnotationMode?: (enabled: boolean) => void;
  pendingBoundingBox?: BoundingBox | null;
  onClearPendingBox?: () => void;
  onRevertToAIImage?: () => void;
  showRevertToAI?: boolean;
  estimatedVehicleValue?: number;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
}

function determineEstimateSource(
  current: AIAssessment,
  original?: AIAssessment
): EstimateSource {
  if (!original) return "AI only";
  
  // Check if all damages are different (agent only)
  const originalIds = new Set(
    original.damages.map((d) => `${d.type}-${d.location}`)
  );
  const currentIds = new Set(
    current.damages.map((d) => `${d.type}-${d.location}`)
  );
  
  // If no overlap, it's agent only
  const hasOverlap = Array.from(originalIds).some((id) => currentIds.has(id));
  if (!hasOverlap && current.damages.length > 0) {
    return "Claims agent only";
  }
  
  // Check if anything changed
  const damagesChanged =
    JSON.stringify(original.damages) !== JSON.stringify(current.damages);
  const costChanged = original.totalEstimatedCost !== current.totalEstimatedCost;
  
  if (damagesChanged || costChanged) {
    return "Edited by claims agent";
  }
  
  return "AI only";
}

export function AssessmentPanel({
  assessment,
  originalAIAssessment,
  estimateSource,
  claimId,
  onAssessmentChange,
  onEstimateSourceChange,
  onApprove,
  onEscalate,
  onRevert,
  currentStatus = "Pending Review",
  annotationMode = false,
  onToggleAnnotationMode,
  pendingBoundingBox = null,
  onClearPendingBox,
  onRevertToAIImage,
  showRevertToAI = false,
  estimatedVehicleValue,
  vehicleMake,
  vehicleModel,
  vehicleYear,
}: AssessmentPanelProps) {
  const [selectedDamage, setSelectedDamage] = useState<Damage | null>(null);
  const [showCostModal, setShowCostModal] = useState(false);
  const [showVehicleValueModal, setShowVehicleValueModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newDamage, setNewDamage] = useState({
    type: "",
    location: "",
    severity: "Medium" as (typeof SEVERITIES)[number],
    estimatedCost: 0,
  });

  const lowConfidence = assessment.confidenceScore < CONFIDENCE_THRESHOLD;
  const confidencePercent = Math.round(assessment.confidenceScore * 100);
  const totalCost = assessment.isTotalLoss 
    ? (assessment.totalLossValue || estimatedVehicleValue || assessment.totalEstimatedCost || 0)
    : (assessment.totalEstimatedCost || totalFromDamages(assessment.damages));
  const isPending =
    currentStatus === "Pending Review" ||
    currentStatus === "Pending - Returned for Update";

  // Update estimate source when assessment changes
  useEffect(() => {
    const newSource = determineEstimateSource(assessment, originalAIAssessment);
    if (newSource !== estimateSource && onEstimateSourceChange) {
      onEstimateSourceChange(newSource);
    }
  }, [assessment, originalAIAssessment, estimateSource, onEstimateSourceChange]);

  const handleToggleTotalLoss = useCallback(() => {
    const newIsTotalLoss = !assessment.isTotalLoss;
    const vehicleValue = estimatedVehicleValue || assessment.totalLossValue || assessment.totalEstimatedCost || 0;
    const updated: AIAssessment = {
      ...assessment,
      isTotalLoss: newIsTotalLoss,
      totalLossValue: newIsTotalLoss ? vehicleValue : undefined,
      totalEstimatedCost: newIsTotalLoss 
        ? vehicleValue
        : totalFromDamages(assessment.damages),
      // Clear totalLossReason if unchecking (agent override)
      totalLossReason: newIsTotalLoss ? assessment.totalLossReason : undefined,
    };
    onAssessmentChange?.(updated);
    const newSource = determineEstimateSource(updated, originalAIAssessment);
    onEstimateSourceChange?.(newSource);
  }, [assessment, estimatedVehicleValue, originalAIAssessment, onAssessmentChange, onEstimateSourceChange]);

  const updateDamageCost = useCallback(
    (index: number, cost: number) => {
      const next = [...assessment.damages];
      next[index] = { ...next[index]!, estimatedCost: Math.max(0, cost) };
      const updated = {
        ...assessment,
        damages: next,
        totalEstimatedCost: totalFromDamages(next),
      };
      onAssessmentChange?.(updated);
      const newSource = determineEstimateSource(updated, originalAIAssessment);
      onEstimateSourceChange?.(newSource);
    },
    [assessment, originalAIAssessment, onAssessmentChange, onEstimateSourceChange]
  );

  const addDamage = useCallback(() => {
    if (!newDamage.type.trim() || !newDamage.location.trim()) return;
    const d: Damage = {
      type: newDamage.type.trim(),
      location: newDamage.location.trim(),
      severity: newDamage.severity,
      estimatedCost: Math.max(0, newDamage.estimatedCost),
      ...(pendingBoundingBox && { boundingBox: { ...pendingBoundingBox } }),
    };
    const next = [...assessment.damages, d];
    const updated = {
      ...assessment,
      damages: next,
      totalEstimatedCost: totalFromDamages(next),
    };
    onAssessmentChange?.(updated);
    const newSource = determineEstimateSource(updated, originalAIAssessment);
    onEstimateSourceChange?.(newSource);
    setNewDamage({ type: "", location: "", severity: "Medium", estimatedCost: 0 });
    setAdding(false);
    onToggleAnnotationMode?.(false);
    // Clear pending bounding box after adding
    onClearPendingBox?.();
  }, [
    assessment,
    originalAIAssessment,
    newDamage,
    pendingBoundingBox,
    onAssessmentChange,
    onEstimateSourceChange,
    onToggleAnnotationMode,
  ]);

  const removeDamage = useCallback(
    (index: number) => {
      const next = assessment.damages.filter((_, i) => i !== index);
      const updated = {
        ...assessment,
        damages: next,
        totalEstimatedCost: totalFromDamages(next),
      };
      onAssessmentChange?.(updated);
      const newSource = determineEstimateSource(updated, originalAIAssessment);
      onEstimateSourceChange?.(newSource);
    },
    [assessment, originalAIAssessment, onAssessmentChange, onEstimateSourceChange]
  );

  const handleApprove = useCallback(() => {
    const vehicleValue = estimatedVehicleValue || assessment.totalLossValue || assessment.totalEstimatedCost || 0;
    const updatedAssessment: AIAssessment = {
      ...assessment,
      totalEstimatedCost: assessment.isTotalLoss
        ? vehicleValue
        : totalFromDamages(assessment.damages),
    };
    // Preserve total loss fields if they exist
    if (assessment.isTotalLoss !== undefined) {
      updatedAssessment.isTotalLoss = assessment.isTotalLoss;
    }
    if (assessment.isTotalLoss && vehicleValue) {
      updatedAssessment.totalLossValue = vehicleValue;
    }
    if (assessment.totalLossReason) {
      updatedAssessment.totalLossReason = assessment.totalLossReason;
    }
    onApprove?.(claimId, updatedAssessment);
  }, [claimId, assessment, estimatedVehicleValue, onApprove]);

  const handleEscalate = useCallback(() => {
    const vehicleValue = estimatedVehicleValue || assessment.totalLossValue || assessment.totalEstimatedCost || 0;
    const updatedAssessment: AIAssessment = {
      ...assessment,
      totalEstimatedCost: assessment.isTotalLoss
        ? vehicleValue
        : totalFromDamages(assessment.damages),
    };
    // Preserve total loss fields if they exist
    if (assessment.isTotalLoss !== undefined) {
      updatedAssessment.isTotalLoss = assessment.isTotalLoss;
    }
    if (assessment.isTotalLoss && vehicleValue) {
      updatedAssessment.totalLossValue = vehicleValue;
    }
    if (assessment.totalLossReason) {
      updatedAssessment.totalLossReason = assessment.totalLossReason;
    }
    onEscalate?.(claimId, updatedAssessment);
  }, [claimId, assessment, estimatedVehicleValue, onEscalate]);

  const startAdding = () => {
    setAdding(true);
    setNewDamage({ type: "", location: "", severity: "Medium", estimatedCost: 0 });
  };

  const cancelAdding = () => {
    setAdding(false);
    onToggleAnnotationMode?.(false);
  };

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="flex items-center gap-2">
          <Badge
            variant={
              estimateSource === "AI only"
                ? "default"
                : estimateSource === "Edited by claims agent"
                  ? "warning"
                  : "success"
            }
          >
            {estimateSource}
          </Badge>
          <Badge variant={lowConfidence ? "warning" : "success"}>
            {confidencePercent}% confidence
            {lowConfidence && " — Review required"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            {assessment.isTotalLoss ? "Total Loss Value" : "Total estimated cost"}
          </p>
          <p className="text-lg font-semibold">
            ${totalCost.toLocaleString()}
            {assessment.isTotalLoss && assessment.totalLossReason && (
              <span className="ml-2 text-xs font-normal text-amber-600 dark:text-amber-400">
                (AI)
              </span>
            )}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {assessment.isTotalLoss 
              ? assessment.totalLossReason || "Vehicle write-off value"
              : "Sum of damage costs"}
          </p>
          {assessment.isTotalLoss && estimatedVehicleValue && (
            <button
              type="button"
              onClick={() => setShowVehicleValueModal(true)}
              className="mt-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
            >
              View value sources
            </button>
          )}
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            Confidence
          </p>
          <p className="text-sm font-medium">{confidencePercent}%</p>
        </div>
      </div>

      {/* AI-determined Total Loss notice */}
      {assessment.isTotalLoss && assessment.totalLossReason && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-start gap-2">
            <span className="text-amber-600 dark:text-amber-400">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                AI Determined: Total Loss
              </p>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                {assessment.totalLossReason}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Total Loss checkbox - always visible */}
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
        <input
          type="checkbox"
          id="total-loss"
          checked={assessment.isTotalLoss || false}
          onChange={handleToggleTotalLoss}
          className="rounded"
        />
        <label
          htmlFor="total-loss"
          className="flex-1 cursor-pointer text-sm text-gray-700 dark:text-gray-300"
        >
          <span className="font-medium">Mark as Total Loss</span>
          {estimatedVehicleValue && (
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
              (Vehicle value: ${estimatedVehicleValue.toLocaleString()})
            </span>
          )}
          {!estimatedVehicleValue && assessment.isTotalLoss && (
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
              (Using assessment value)
            </span>
          )}
        </label>
        {assessment.isTotalLoss && estimatedVehicleValue && (
          <button
            type="button"
            onClick={() => setShowVehicleValueModal(true)}
            className="text-xs text-blue-600 hover:underline dark:text-blue-400"
          >
            View sources
          </button>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Damages
          </p>
          {!adding && (
            <button
              type="button"
              onClick={startAdding}
              className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              + Add damage
            </button>
          )}
        </div>

        {adding && (
          <div className="mb-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
            <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">
              New damage
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                placeholder="Type (e.g. Scratch)"
                value={newDamage.type}
                onChange={(e) =>
                  setNewDamage((d) => ({ ...d, type: e.target.value }))
                }
                className="rounded border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <input
                placeholder="Location (e.g. Rear door)"
                value={newDamage.location}
                onChange={(e) =>
                  setNewDamage((d) => ({ ...d, location: e.target.value }))
                }
                className="rounded border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <select
                value={newDamage.severity}
                onChange={(e) =>
                  setNewDamage((d) => ({
                    ...d,
                    severity: e.target.value as (typeof SEVERITIES)[number],
                  }))
                }
                className="rounded border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Cost"
                min={0}
                step={50}
                value={newDamage.estimatedCost || ""}
                onChange={(e) =>
                  setNewDamage((d) => ({
                    ...d,
                    estimatedCost: Number(e.target.value) || 0,
                  }))
                }
                className="rounded border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleAnnotationMode?.(!annotationMode)}
                className={`rounded px-2 py-1 text-xs font-medium ${
                  annotationMode
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {annotationMode
                  ? "Click & drag to draw rectangle"
                  : "Set rectangle on image"}
              </button>
              {pendingBoundingBox && (
                <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                  ✓ Rectangle set
                </span>
              )}
              <button
                type="button"
                onClick={addDamage}
                disabled={!newDamage.type.trim() || !newDamage.location.trim()}
                className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white disabled:opacity-50 hover:bg-emerald-700"
              >
                Add
              </button>
              <button
                type="button"
                onClick={cancelAdding}
                className="rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <ul className="space-y-2">
          {assessment.damages.map((d, i) => {
            // Check if this damage is from original AI assessment (for showing cost reference)
            const isFromAI = originalAIAssessment?.damages.some(
              (od) => od.type === d.type && od.location === d.location
            );
            const isAIOnly = estimateSource === "AI only";
            const canShowReference = (isFromAI || isAIOnly) && originalAIAssessment;

            return (
              <li
                key={i}
                className={`flex flex-wrap items-center gap-2 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800/50 ${
                  canShowReference
                    ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50"
                    : ""
                }`}
                onClick={() => {
                  if (canShowReference) {
                    setSelectedDamage(d);
                    setShowCostModal(true);
                  }
                }}
                title={
                  canShowReference
                    ? "Click to view cost reference data"
                    : undefined
                }
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium flex items-center gap-1.5 flex-wrap">
                    {d.type}
                    <span
                      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
                        isFromAI
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {isFromAI ? "AI" : "Manual"}
                    </span>
                    {canShowReference && (
                      <svg
                        className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-label="View cost reference"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {d.location} · {d.severity}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={d.estimatedCost}
                    onChange={(e) =>
                      updateDamageCost(i, Number(e.target.value) || 0)
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="w-24 rounded border border-gray-300 bg-white px-2 py-1 text-right text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                  <span className="text-xs text-gray-500">$</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeDamage(i);
                    }}
                    className="rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Remove damage"
                  >
                    ×
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {isPending && (
        <div className="mt-auto flex flex-wrap gap-2 border-t border-gray-200 pt-4 dark:border-gray-800">
          <button
            type="button"
            onClick={handleApprove}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Send for approval
          </button>
          <button
            type="button"
            onClick={handleEscalate}
            className="rounded-md border border-amber-500 bg-transparent px-4 py-2 text-sm font-medium text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
          >
            Escalate
          </button>
        </div>
      )}

      {!isPending && (
        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-gray-200 pt-4 dark:border-gray-800">
          <Badge
            variant={
              currentStatus === "Awaiting approval"
                ? "success"
                : "warning"
            }
          >
            {currentStatus}
          </Badge>
          {onRevert && (
            <button
              type="button"
              onClick={() => onRevert(claimId)}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Revert to Pending
            </button>
          )}
          {showRevertToAI && onRevertToAIImage && (
            <button
              type="button"
              onClick={onRevertToAIImage}
              className="rounded-md border border-blue-300 bg-white px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:bg-gray-800 dark:text-blue-300 dark:hover:bg-gray-700"
            >
              Revert to AI Image
            </button>
          )}
        </div>
      )}
      {selectedDamage && (
        <CostReferenceModal
          damage={selectedDamage}
          isOpen={showCostModal}
          onClose={() => {
            setShowCostModal(false);
            setSelectedDamage(null);
          }}
        />
      )}
      {estimatedVehicleValue && vehicleMake && vehicleModel && vehicleYear && (
        <VehicleValueModal
          vehicleValue={estimatedVehicleValue}
          make={vehicleMake}
          model={vehicleModel}
          year={vehicleYear}
          isOpen={showVehicleValueModal}
          onClose={() => setShowVehicleValueModal(false)}
        />
      )}
    </Card>
  );
}
