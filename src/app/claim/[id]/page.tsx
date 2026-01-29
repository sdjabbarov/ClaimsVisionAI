"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import type {
  Claim,
  ClaimStatus,
  AIAssessment,
  EstimateSource,
  BoundingBox,
} from "@/lib/types";
import Link from "next/link";
import { DamageAnnotator } from "@/components/DamageAnnotator";
import { AssessmentPanel } from "@/components/AssessmentPanel";
import { ClaimDetailsPanel } from "@/components/ClaimDetailsPanel";
import { ImageUploadSection } from "@/components/ImageUploadSection";

export default function ClaimDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  
  // Check if accessed from dashboard (via referrer or query param)
  const fromDashboard = searchParams.get("from") === "dashboard" || 
    (typeof window !== "undefined" && document.referrer.includes("/dashboard"));

  const [claim, setClaim] = useState<Claim | null>(null);
  const [assessment, setAssessment] = useState<AIAssessment | null>(null);
  const [originalAIAssessment, setOriginalAIAssessment] =
    useState<AIAssessment | null>(null);
  const [estimateSource, setEstimateSource] = useState<EstimateSource>("AI only");
  const [agentAnnotatedImageUrl, setAgentAnnotatedImageUrl] = useState<
    string | undefined
  >(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [pendingBoundingBox, setPendingBoundingBox] =
    useState<BoundingBox | null>(null);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [showAssessmentSection, setShowAssessmentSection] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedAnnotatedImageUrl, setSelectedAnnotatedImageUrl] = useState<string | undefined>(undefined);
  const [isAssessing, setIsAssessing] = useState(false);

  const fetchClaim = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Add timestamp to prevent caching
      const res = await fetch(`/api/claims/${id}?t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      if (!res.ok) {
        if (res.status === 404) {
          setError("Claim not found.");
          setClaim(null);
          setAssessment(null);
        } else {
          setError("Failed to load claim.");
        }
        return;
      }
      const data: Claim = await res.json();
      console.log(`[Claim Detail] fetchClaim: Loaded claim ${id} with status "${data.status}"`);
      setClaim(data);
      setAssessment(data.aiAssessment);
      setOriginalAIAssessment(data.originalAIAssessment || data.aiAssessment);
      setEstimateSource(data.estimateSource || "AI only");
      setAgentAnnotatedImageUrl(data.agentAnnotatedImageUrl);
      // Initialize additional images (for now, empty array - will be populated from API later)
      setAdditionalImages([]);
      
      // Only auto-show assessment section when claim has been submitted (Awaiting approval / Escalated).
      // For "Pending Review", user must click "Proceed with AI Assessment" and wait for the progress bar.
      if (data.aiAssessment && data.status !== "Pending Review" && data.status !== "Pending - Returned for Update") {
        const imageToUse = data.agentAnnotatedImageUrl || 
                          data.annotatedVehicleImageUrl || 
                          data.vehicleImageUrl;
        if (imageToUse) {
          setSelectedImageUrl(imageToUse);
          setSelectedAnnotatedImageUrl(data.agentAnnotatedImageUrl || data.annotatedVehicleImageUrl);
          setShowAssessmentSection(true);
        }
      }
    } catch (error) {
      console.error(`[Claim Detail] fetchClaim error:`, error);
      setError("Failed to load claim.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchClaim();
  }, [fetchClaim]);

  const handleAssessmentChange = useCallback((next: AIAssessment) => {
    setAssessment(next);
  }, []);

  const patchClaim = useCallback(
    async (updates: {
      status?: ClaimStatus;
      aiAssessment?: AIAssessment;
      estimateSource?: EstimateSource;
      agentAnnotatedImageUrl?: string | null;
      originalAIAssessment?: AIAssessment;
    }): Promise<boolean> => {
      const res = await fetch(`/api/claims/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        console.error(`[Claim Detail] patchClaim failed: ${res.status} ${res.statusText}`);
        return false;
      }
      const updated: Claim = await res.json();
      console.log(`[Claim Detail] patchClaim response: Claim ${id} status is "${updated.status}"`);
      setClaim(updated);
      if (updated.aiAssessment) setAssessment(updated.aiAssessment);
      if (updated.estimateSource) setEstimateSource(updated.estimateSource);
      // Handle agentAnnotatedImageUrl deletion
      if (updates.agentAnnotatedImageUrl === null) {
        setAgentAnnotatedImageUrl(undefined);
      } else if (updates.agentAnnotatedImageUrl !== undefined) {
        setAgentAnnotatedImageUrl(updates.agentAnnotatedImageUrl);
      } else if (updated.agentAnnotatedImageUrl !== undefined) {
        setAgentAnnotatedImageUrl(updated.agentAnnotatedImageUrl);
      }
      if (updated.originalAIAssessment)
        setOriginalAIAssessment(updated.originalAIAssessment);
      
      // Update UI state based on claim status and assessment
      // If status is not "Pending Review" or has assessment with damages, show assessment section
      if (updated.status !== "Pending Review" && updated.aiAssessment) {
        const imageToUse = updated.agentAnnotatedImageUrl || 
                          updated.annotatedVehicleImageUrl || 
                          updated.vehicleImageUrl;
        if (imageToUse) {
          setSelectedImageUrl(imageToUse);
          setSelectedAnnotatedImageUrl(updated.agentAnnotatedImageUrl || updated.annotatedVehicleImageUrl);
          setShowAssessmentSection(true);
        }
      } else if (updated.status === "Pending Review" && updates.status === "Pending Review") {
        // If reverting to Pending Review, hide assessment section (handled in handleRevert)
        // But if it's just an update while already in Pending Review, keep current state
        // Only reset if we're explicitly reverting (which is handled in handleRevert)
      }
      
      // Mark that claims were updated in sessionStorage (for dashboard sync)
      if (typeof window !== "undefined" && updates.status) {
        const timestamp = Date.now().toString();
        sessionStorage.setItem("claimsLastUpdated", timestamp);
        // Dispatch event immediately to trigger dashboard refetch
        window.dispatchEvent(new CustomEvent("claimUpdated", { detail: { timestamp } }));
        // Also trigger a storage event for cross-tab communication
        window.dispatchEvent(new StorageEvent("storage", {
          key: "claimsLastUpdated",
          newValue: timestamp,
        }));
      }
      
      return true;
    },
    [id]
  );

  const handleApprove = useCallback(
    async (_claimId: string, nextAssessment: AIAssessment) => {
      try {
        const success = await patchClaim({
          status: "Awaiting approval",
          aiAssessment: nextAssessment,
          estimateSource,
          agentAnnotatedImageUrl,
        });
        if (success) {
          // Small delay to ensure server-side update completes
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Verify the update persisted by fetching fresh data
          const verifyRes = await fetch(`/api/claims/${id}?t=${Date.now()}`, {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache",
            },
          });
          if (verifyRes.ok) {
            const verifiedClaim: Claim = await verifyRes.json();
            console.log(`[Claim Detail] Verification: Claim ${id} status is now "${verifiedClaim.status}"`);
            
            if (verifiedClaim.status === "Awaiting approval") {
              setClaim(verifiedClaim);
              
              // Ensure dashboard gets notified immediately
              if (typeof window !== "undefined") {
                const timestamp = Date.now().toString();
                sessionStorage.setItem("claimsLastUpdated", timestamp);
                // Dispatch multiple events to ensure dashboard catches it
                window.dispatchEvent(new CustomEvent("claimUpdated", { 
                  detail: { timestamp, claimId: id, status: "Awaiting approval" } 
                }));
                // Small delay then dispatch again to catch any late listeners
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent("claimUpdated", { 
                    detail: { timestamp, claimId: id, status: "Awaiting approval" } 
                  }));
                }, 200);
              }
              
              // Refresh the router cache
              router.refresh();
              
              console.log(`[Claim Detail] Successfully updated claim ${id} status to "Awaiting approval"`);
            } else {
              console.error(`[Claim Detail] ERROR: Status update verification failed! Expected "Awaiting approval", got "${verifiedClaim.status}"`);
              // Still update local state to show what we tried to set
              setClaim(verifiedClaim);
            }
          } else {
            console.error("[Claim Detail] Failed to verify claim update - API request failed");
          }
        } else {
          console.error("[Claim Detail] Failed to update claim status - patchClaim returned false");
        }
      } catch (error) {
        console.error("Error updating claim status:", error);
      }
    },
    [patchClaim, estimateSource, agentAnnotatedImageUrl, router, id]
  );

  const handleEscalate = useCallback(
    (_claimId: string, nextAssessment: AIAssessment) => {
      patchClaim({
        status: "Escalated",
        aiAssessment: nextAssessment,
        estimateSource,
        agentAnnotatedImageUrl,
      });
    },
    [patchClaim, estimateSource, agentAnnotatedImageUrl]
  );

  const handleRevert = useCallback(
    (_claimId: string) => {
      if (!originalAIAssessment) return;
      // Restore original AI assessment and reset to AI only, delete agent image
      patchClaim({
        status: "Pending Review",
        aiAssessment: originalAIAssessment,
        estimateSource: "AI only",
        agentAnnotatedImageUrl: null, // Explicitly set to null to delete
      });
      setAssessment(originalAIAssessment);
      setEstimateSource("AI only");
      setAgentAnnotatedImageUrl(undefined);
      // Reset UI state - hide assessment section and clear selected images
      // This will show the "upload and proceed" flow again
      setShowAssessmentSection(false);
      setSelectedImageUrl(null);
      setSelectedAnnotatedImageUrl(undefined);
      setAdditionalImages([]);
    },
    [patchClaim, originalAIAssessment]
  );

  const handleRevertToAIImage = useCallback(() => {
    // Only revert the image, keep other edits
    patchClaim({
      agentAnnotatedImageUrl: null, // Delete agent annotated image
    });
    setAgentAnnotatedImageUrl(undefined);
  }, [patchClaim]);

  const handleBoundingBoxComplete = useCallback((box: BoundingBox) => {
    setPendingBoundingBox(box);
  }, []);

  const handleSaveAnnotatedImage = useCallback(
    async (imageDataUrl: string) => {
      if (!assessment) return;
      
      try {
        // Save image to filesystem via API
        const res = await fetch(`/api/claims/${id}/save-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageDataUrl }),
        });
        if (!res.ok) throw new Error("Failed to save image");
        const { imageUrl } = await res.json();
        
        // Update claim with the file path AND current assessment (to preserve all damages)
        setAgentAnnotatedImageUrl(imageUrl);
        await patchClaim({ 
          agentAnnotatedImageUrl: imageUrl,
          aiAssessment: assessment, // Save current assessment with all damages
        });
      } catch (error) {
        console.error("Error saving image:", error);
        // Fallback to data URL if file save fails
        setAgentAnnotatedImageUrl(imageDataUrl);
        await patchClaim({ 
          agentAnnotatedImageUrl: imageDataUrl,
          aiAssessment: assessment, // Save current assessment with all damages
        });
      }
    },
    [patchClaim, id, assessment]
  );

  const handleToggleAnnotationMode = useCallback((enabled: boolean) => {
    setAnnotationMode(enabled);
    if (!enabled) setPendingBoundingBox(null);
  }, []);

  const handleClearPendingBox = useCallback(() => {
    setPendingBoundingBox(null);
  }, []);

  const handleImageUploaded = useCallback((imageUrl: string) => {
    setAdditionalImages((prev) => [...prev, imageUrl]);
  }, []);

  const handleTriggerAIAssessment = useCallback((imageUrl: string) => {
    // Mock implementation - in production, this would trigger actual AI assessment
    console.log("Triggering AI assessment for image:", imageUrl);
    // The actual AI assessment would update the assessment state
    // For now, we just show a message
  }, []);

  const handleProceedWithAssessment = useCallback(() => {
    // Use most recently uploaded image, or fall back to claim's vehicle image
    const imageToUse = additionalImages.length > 0
      ? additionalImages[additionalImages.length - 1]
      : claim?.vehicleImageUrl;
    if (!imageToUse) return;

    setIsAssessing(true);
    // Do NOT show the vehicle damage / assessment section until after the progress completes
    setShowAssessmentSection(false);
    setSelectedImageUrl(null);
    setSelectedAnnotatedImageUrl(undefined);

    // Simulate AI damage assessment: show progress for 4 seconds, then reveal section
    const ASSESSMENT_DURATION_MS = 4000;
    setTimeout(() => {
      setSelectedImageUrl(imageToUse);
      const annotatedUrl = claim?.annotatedVehicleImageUrl && (assessment?.damages?.length ?? 0) > 0
        ? claim.annotatedVehicleImageUrl
        : undefined;
      setSelectedAnnotatedImageUrl(annotatedUrl);
      setShowAssessmentSection(true);
      setIsAssessing(false);
    }, ASSESSMENT_DURATION_MS);
  }, [additionalImages, claim, assessment]);

  const handleImageDeleted = useCallback((imageUrl: string) => {
    setAdditionalImages((prev) => prev.filter((url) => url !== imageUrl));
    // If the deleted image was the selected one, clear selection
    if (selectedImageUrl === imageUrl) {
      setSelectedImageUrl(null);
      setShowAssessmentSection(false);
    }
  }, [selectedImageUrl]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <p className="text-gray-600 dark:text-gray-400">Loading…</p>
      </main>
    );
  }

  if (error || !claim) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-950">
        <p className="text-gray-600 dark:text-gray-400">
          {error ?? "Claim not found."}
        </p>
        <Link
          href="/dashboard"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          Back to dashboard
        </Link>
      </main>
    );
  }

  if (!assessment) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <p className="text-gray-600 dark:text-gray-400">Missing assessment.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/"
            className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            ← Home
          </Link>
          <span className="text-gray-400 dark:text-gray-600">|</span>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Dashboard
          </Link>
          <h1 className="ml-auto text-2xl font-bold text-gray-900 dark:text-white">
            {claim.id} — {claim.policyInfo?.driverName || "Unknown"}
          </h1>
        </div>

        <div className="mb-8">
          <ClaimDetailsPanel claim={claim} />
        </div>

        {/* Uploaded Images Section - Always visible (users can add more images) */}
        <div className="mb-8">
          <ImageUploadSection
            claimId={claim.id}
            existingImages={additionalImages}
            onImageUploaded={handleImageUploaded}
            onTriggerAIAssessment={handleTriggerAIAssessment}
            onProceedWithAssessment={handleProceedWithAssessment}
            onImageDeleted={handleImageDeleted}
            isAssessing={isAssessing}
            hideProceedButton={showAssessmentSection}
            canAssessWithClaimImage={!!claim.vehicleImageUrl}
          />
        </div>

        {/* Assessment Section - Only visible after clicking "Proceed with AI Assessment" */}
        {showAssessmentSection && selectedImageUrl && (
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Vehicle damage
              </h2>
              <DamageAnnotator
                imageUrl={selectedImageUrl}
                annotatedImageUrl={selectedAnnotatedImageUrl || claim.annotatedVehicleImageUrl}
                agentAnnotatedImageUrl={agentAnnotatedImageUrl}
                damages={assessment.damages}
                annotationMode={annotationMode}
                onBoundingBoxComplete={handleBoundingBoxComplete}
                onSaveAnnotatedImage={handleSaveAnnotatedImage}
                estimateSource={estimateSource}
                pendingBoundingBox={pendingBoundingBox}
                onRevertToAIImage={handleRevertToAIImage}
              />
            </div>
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Assessment
              </h2>
              <AssessmentPanel
                assessment={assessment}
                originalAIAssessment={originalAIAssessment || undefined}
                estimateSource={estimateSource}
                claimId={claim.id}
                onAssessmentChange={handleAssessmentChange}
                onEstimateSourceChange={setEstimateSource}
                onApprove={handleApprove}
                onEscalate={handleEscalate}
                onRevert={handleRevert}
                currentStatus={claim.status}
                annotationMode={annotationMode}
                onToggleAnnotationMode={handleToggleAnnotationMode}
                pendingBoundingBox={pendingBoundingBox}
                onClearPendingBox={handleClearPendingBox}
                onRevertToAIImage={handleRevertToAIImage}
                showRevertToAI={!!agentAnnotatedImageUrl}
                estimatedVehicleValue={claim.policyInfo?.estimatedVehicleValue}
                vehicleMake={claim.policyInfo?.vehicleDetails?.make}
                vehicleModel={claim.policyInfo?.vehicleDetails?.model}
                vehicleYear={claim.policyInfo?.vehicleDetails?.year}
              />
            </div>
          </div>
        )}

        {/* Bottom navigation - same as top for easier access */}
        <div className="mt-12 flex items-center gap-4 border-t border-gray-200 pt-6 dark:border-gray-800">
          <Link
            href="/"
            className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            ← Home
          </Link>
          <span className="text-gray-400 dark:text-gray-600">|</span>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
