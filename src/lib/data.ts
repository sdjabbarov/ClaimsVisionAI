import type { Claim } from "./types";
import rawData from "../../mock_data.json";

function fixImagePath(path: string): string {
  if (path.startsWith("/home/ubuntu/mock_images/")) {
    return path.replace("/home/ubuntu/mock_images", "/images");
  }
  return path;
}

function extractDate(dateTime: string): string {
  // Extract date from ISO datetime string (e.g., "2026-01-15T09:30:00Z" -> "2026-01-15")
  return dateTime.split("T")[0] || "";
}

function transformClaim(raw: any): Claim {
  // Deep clone aiAssessment for originalAIAssessment
  const originalAI = raw.aiAssessment
    ? JSON.parse(JSON.stringify(raw.aiAssessment))
    : undefined;

  const claim: Claim = {
    ...raw,
    status: raw.status || "Pending Review",
    vehicleImageUrl: fixImagePath(raw.vehicleImageUrl),
    annotatedVehicleImageUrl: raw.annotatedVehicleImageUrl
      ? fixImagePath(raw.annotatedVehicleImageUrl)
      : undefined,
    agentAnnotatedImageUrl: raw.agentAnnotatedImageUrl
      ? raw.agentAnnotatedImageUrl.startsWith("data:")
        ? raw.agentAnnotatedImageUrl // Keep data URLs as-is
        : fixImagePath(raw.agentAnnotatedImageUrl)
      : undefined,
    originalAIAssessment: raw.originalAIAssessment || originalAI,
    estimateSource: raw.estimateSource || "AI only",
    // Backward compatibility fields
    policyholder: raw.policyInfo?.driverName || raw.policyholder || "",
    claimDate: raw.incidentDetails?.dateTime
      ? extractDate(raw.incidentDetails.dateTime)
      : raw.claimDate || "",
  };
  return claim;
}

export const MOCK_CLAIMS: Claim[] = (rawData as any[]).map(transformClaim);
