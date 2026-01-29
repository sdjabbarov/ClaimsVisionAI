import { NextRequest, NextResponse } from "next/server";
import { getClaims } from "@/lib/store";

// Force dynamic rendering - prevent Next.js from caching this route
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const claims = getClaims();
  
  // Always log CLM-001 status (not just in development)
  const claim001 = claims.find(c => c.id === "CLM-001");
  if (claim001) {
    console.log(`[API] GET /api/claims: CLM-001 status is "${claim001.status}"`);
  } else {
    console.log(`[API] GET /api/claims: CLM-001 not found in store`);
  }
  
  // Log all claim statuses for debugging
  console.log(`[API] GET /api/claims: Total claims: ${claims.length}`);
  claims.forEach(c => {
    if (c.id.startsWith("CLM-00")) {
      console.log(`[API] GET /api/claims: ${c.id} status = "${c.status}"`);
    }
  });
  
  return NextResponse.json(claims, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
