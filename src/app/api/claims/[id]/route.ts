import { NextRequest, NextResponse } from "next/server";
import type { Claim, EstimateSource } from "@/lib/types";
import { getClaimById, updateClaim } from "@/lib/store";

// Force dynamic rendering - prevent Next.js from caching this route
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const claim = getClaimById(id);

  if (!claim) {
    return NextResponse.json(
      { error: "Claim not found" },
      { status: 404 }
    );
  }
  
  // Always log the status when fetching a claim
  console.log(`[API] GET /api/claims/${id}: Returning claim with status "${claim.status}"`);

  return NextResponse.json(claim, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const claim = getClaimById(id);

  if (!claim) {
    return NextResponse.json(
      { error: "Claim not found" },
      { status: 404 }
    );
  }

  let body: {
    status?: string;
    aiAssessment?: Claim["aiAssessment"];
    estimateSource?: string;
    agentAnnotatedImageUrl?: string | null;
    originalAIAssessment?: Claim["aiAssessment"];
  };
  try {
    body = await request.json();
    console.log(`[API] PATCH /api/claims/${id}: Received body:`, JSON.stringify(body, null, 2));
  } catch (error) {
    console.error(`[API] PATCH /api/claims/${id}: Failed to parse JSON:`, error);
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const updates: {
    status?: Claim["status"];
    aiAssessment?: Claim["aiAssessment"];
    estimateSource?: EstimateSource;
    agentAnnotatedImageUrl?: string | null;
    originalAIAssessment?: Claim["aiAssessment"];
  } = {};
  
  if (body.status != null) {
    const validStatuses: Claim["status"][] = [
      "Pending Review",
      "Pending - Returned for Update",
      "Awaiting approval",
      "Escalated",
    ];
    console.log(`[API] PATCH /api/claims/${id}: Received status "${body.status}", valid: ${validStatuses.includes(body.status as Claim["status"])}`);
    if (!validStatuses.includes(body.status as Claim["status"])) {
      console.error(`[API] PATCH /api/claims/${id}: Invalid status "${body.status}"`);
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }
    updates.status = body.status as Claim["status"];
    console.log(`[API] PATCH /api/claims/${id}: Setting updates.status to "${updates.status}"`);
  }
  if (body.aiAssessment != null) {
    updates.aiAssessment = body.aiAssessment;
  }
  if (body.estimateSource != null) {
    const validSources: EstimateSource[] = [
      "AI only",
      "Edited by claims agent",
      "Claims agent only",
    ];
    if (!validSources.includes(body.estimateSource as EstimateSource)) {
      return NextResponse.json(
        { error: "Invalid estimate source" },
        { status: 400 }
      );
    }
    updates.estimateSource = body.estimateSource as EstimateSource;
  }
  if (body.agentAnnotatedImageUrl !== undefined) {
    // null means delete, string means update
    updates.agentAnnotatedImageUrl = body.agentAnnotatedImageUrl;
  }
  if (body.originalAIAssessment != null) {
    updates.originalAIAssessment = body.originalAIAssessment;
  }

  const updated = updateClaim(id, updates);
  if (!updated) {
    return NextResponse.json(
      { error: "Failed to update claim" },
      { status: 500 }
    );
  }
  
  // Always log status updates (not just in development)
  if (updates.status) {
    console.log(`[API] PATCH /api/claims/${id}: Updated status to "${updates.status}"`);
    console.log(`[API] Returning claim with status: "${updated.status}"`);
    
    // Verify by fetching again
    const verifyClaim = getClaimById(id);
    if (verifyClaim) {
      console.log(`[API] Verification fetch: Claim ${id} status is "${verifyClaim.status}"`);
      if (verifyClaim.status !== updates.status) {
        console.error(`[API] ERROR: Status mismatch! Expected "${updates.status}", got "${verifyClaim.status}"`);
      }
    }
  }
  
  return NextResponse.json(updated, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
