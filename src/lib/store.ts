import fs from "fs";
import path from "path";
import type { Claim } from "./types";
import { MOCK_CLAIMS } from "./data";

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

const CLAIMS_STATE_FILE = path.join(process.cwd(), "claims-state.json");

function loadClaimsFromFile(): Claim[] | null {
  try {
    if (fs.existsSync(CLAIMS_STATE_FILE)) {
      const raw = fs.readFileSync(CLAIMS_STATE_FILE, "utf-8");
      const parsed = JSON.parse(raw) as Claim[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore: use fallback
  }
  return null;
}

function persistClaimsToFile(claims: Claim[]): void {
  try {
    fs.writeFileSync(CLAIMS_STATE_FILE, JSON.stringify(claims, null, 2), "utf-8");
  } catch (err) {
    console.error("[Store] Failed to persist claims to file:", err);
  }
}

// Initialize: load from persisted file if it exists, otherwise use mock data
let claimsStore: Claim[] = (() => {
  const fromFile = loadClaimsFromFile();
  if (fromFile) {
    return fromFile;
  }
  return deepClone(MOCK_CLAIMS);
})();

export function getClaims(): Claim[] {
  return deepClone(claimsStore);
}

export function getClaimById(id: string): Claim | undefined {
  return claimsStore.find((c) => c.id === id);
}

export function updateClaim(
  id: string,
  updates: {
    status?: Claim["status"];
    aiAssessment?: Claim["aiAssessment"];
    estimateSource?: Claim["estimateSource"];
    agentAnnotatedImageUrl?: string | null;
    originalAIAssessment?: Claim["aiAssessment"];
  }
): Claim | null {
  const idx = claimsStore.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  const current = claimsStore[idx]!;
  const updated: Claim = {
    ...current,
    ...(updates.status != null && { status: updates.status }),
    ...(updates.aiAssessment != null && { aiAssessment: updates.aiAssessment }),
    ...(updates.estimateSource != null && {
      estimateSource: updates.estimateSource,
    }),
    ...(updates.originalAIAssessment != null && {
      originalAIAssessment: updates.originalAIAssessment,
    }),
  };

  if (updates.agentAnnotatedImageUrl === null) {
    delete updated.agentAnnotatedImageUrl;
  } else if (updates.agentAnnotatedImageUrl !== undefined) {
    updated.agentAnnotatedImageUrl = updates.agentAnnotatedImageUrl;
  }

  if (updates.status != null) {
    updated.status = updates.status;
  }

  claimsStore[idx] = updated;

  // Persist to file so dashboard and any future requests see the same data
  persistClaimsToFile(claimsStore);

  return claimsStore[idx]!;
}
