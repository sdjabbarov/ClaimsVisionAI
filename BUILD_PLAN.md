# ClaimVision AI — Build Plan & Gap Analysis

**Date:** 2026-01-28  
**Status:** Planning Phase  
**Sources:** Technical Specification, Product Requirements (V1), mock_data.json, BUILD_PLAN gap analysis

---

## Executive Summary

This document defines the step-by-step build plan for the ClaimVision AI prototype. It maps the Technical Specification to implementation, aligns with the PRD, and lists gaps, missing pieces, and recommended additions.

---

## Build Steps (Spec-Aligned)

### Phase 1: Project Foundation

| Step | Action | Details | Status |
|------|--------|---------|--------|
| **1.1** | Initialize Next.js | `npx create-next-app@latest . --ts --eslint --tailwind --src-dir --app --import-alias "@/*"` in `ClaimsVisionAI/` | Not Started |
| **1.2** | Create file structure | Create `src/` layout per spec (app, components, lib) | Not Started |

**File structure to create:**

```
src/
├── app/
│   ├── api/
│   │   └── claims/
│   │       ├── route.ts          ← GET all (for dashboard)
│   │       └── [id]/
│   │           └── route.ts      ← GET one, PATCH one (see gaps)
│   ├── claim/
│   │   └── [id]/
│   │       └── page.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   │   ├── Card.tsx
│   │   └── Badge.tsx
│   ├── ClaimsTable.tsx
│   ├── DamageAnnotator.tsx
│   └── AssessmentPanel.tsx
├── lib/
│   ├── data.ts
│   └── types.ts
```

---

### Phase 2: Data Layer

| Step | Action | Details | Status |
|------|--------|---------|--------|
| **2.1** | Define types (`src/lib/types.ts`) | `Damage`, `AIAssessment`, `Claim` per spec. Add `annotatedVehicleImageUrl` (in mock_data). | Not Started |
| **2.2** | Mock data (`src/lib/data.ts`) | Import `Claim`. Export `MOCK_CLAIMS` from `mock_data.json` (all 10 claims). Use existing paths `/images/raw/...`, `/images/annotated/...`. | Not Started |
| **2.3** | API: GET claim by ID | `src/app/api/claims/[id]/route.ts` — find by `id`, return JSON or 404. | Not Started |

**Image paths:** Already correct. Images live in `public/images/raw/` and `public/images/annotated/`; mock_data uses those paths. No migration needed.

---

### Phase 3: UI Components

| Step | Action | Details | Status |
|------|--------|---------|--------|
| **3.1** | `Badge` | Variants: `default`, `success`, `warning`. Tailwind. | Not Started |
| **3.2** | `Card` | Border, rounded corners, shadow. Children. | Not Started |
| **3.3** | `ClaimsTable` | Props: `Claim[]`. Card wrapper. Columns: ID, Policyholder, Claim Date, Status (Badge). Rows = `Link` to `/claim/[id]`. | Not Started |
| **3.4** | `DamageAnnotator` | Props: `imageUrl`, `damages`. Show image. Overlays: use **annotated image** (see gap) OR placeholder boxes. | Not Started |
| **3.5** | `AssessmentPanel` | Props: `AIAssessment`. Card. Show `confidenceScore`, `totalEstimatedCost` (editable). List damages (type, location, severity). Approve / Escalate buttons. | Not Started |

---

### Phase 4: Pages

| Step | Action | Details | Status |
|------|--------|---------|--------|
| **4.1** | Dashboard (`src/app/page.tsx`) | Title “Claims Dashboard”. `ClaimsTable` with `MOCK_CLAIMS`. Top section: high-level stats (see PRD gaps). | Not Started |
| **4.2** | Claim detail (`src/app/claim/[id]/page.tsx`) | Client component. `useState` + `useEffect`, fetch from `/api/claims/[id]`. Loading state. Two-column: left `DamageAnnotator`, right `AssessmentPanel`. | Not Started |

---

## Gaps vs. Technical Spec

| Gap | Spec Says | Actual / Recommended |
|-----|-----------|----------------------|
| Mock data size | 3 claims, placeholder image paths | Use all 10 claims from `mock_data.json`; paths already correct. |
| `annotatedVehicleImageUrl` | Not in types | Add to `Claim`. Use for `DamageAnnotator` when showing “annotated” view. |
| DamageAnnotator overlays | “Placeholder positions” for bounding boxes | Mock data has no bbox. **Decision:** Use **annotated image** as primary view; optional raw + simple overlay later. |
| GET all claims | Only GET `[id]` | Add `GET /api/claims` for dashboard table + stats. |

---

## Gaps vs. PRD (Missing or Underspecified)

| PRD Requirement | In Spec? | Action |
|-----------------|----------|--------|
| **Dashboard stats** — “Total Pending Claims”, “Average Review Time” | “High-level stats” only | Add stats section: e.g. pending count, optional avg review time (mock for now). |
| **&lt;90% confidence flagged** (US03) | No | Flag low-confidence claims in table (e.g. Badge/icon) and in AssessmentPanel. Threshold: 0.9. |
| **Adjust AI assessment** (US04); **editable total cost** | Editable `totalEstimatedCost` only | Support editing total cost. Optionally: edit individual damage `estimatedCost` and recompute total. |
| **Approve / Escalate** | Buttons only | Add handlers: update status to `Approved` or `Escalated`; optionally call `PATCH /api/claims/[id]`. |
| **Final report highlighting AI vs. agent changes** | No | **Defer to post-MVP:** store original vs modified assessment, add simple “Changes” summary. |
| **Photos/videos** | Single image per claim | **Out of scope for prototype:** single image only. |

---

## Additional Recommendations

### Before / During Build

1. **Types**
   - Add `annotatedVehicleImageUrl?: string` to `Claim`.
   - Keep `Damage` as in spec (no `boundingBox` for V1 if using annotated image).
2. **APIs**
   - `GET /api/claims`: return all claims (for dashboard).
   - `PATCH /api/claims/[id]`: optional for prototype; can update status (and optionally assessment) in memory.
3. **DamageAnnotator**
   - Use `annotatedVehicleImageUrl` when available; fallback to `vehicleImageUrl`.
   - Skip coordinate-based overlays for V1; rely on annotated image.
4. **AssessmentPanel**
   - Wire Approve/Escalate to state (and optional PATCH).
   - Store `originalAssessment` and `modifiedAssessment` if you add change tracking later.
5. **Confidence**
   - Badge or label for confidence &lt; 90% in `ClaimsTable` and `AssessmentPanel`.

### Optional Enhancements (Post–Core Build)

- **Change tracking:** Diff AI vs agent; show in assessment or simple “Report” view.
- **Bounding boxes:** Add `boundingBox` to `Damage` and overlay on raw image if you move beyond pre-annotated assets.
- **Persistence:** Replace in-memory mock with DB + real API persistence.
- **Error handling:** Error boundaries, API error states, clearer loading UX.

---

## Build Sequence (Recommended Order)

1. **Phase 1** — Next.js init, folder structure.
2. **Phase 2** — Types, `MOCK_CLAIMS` from `mock_data.json`, `GET /api/claims/[id]`, then `GET /api/claims`.
3. **Phase 3** — `Badge`, `Card` → `ClaimsTable` → `DamageAnnotator` (annotated image) → `AssessmentPanel`.
4. **Phase 4** — Dashboard (table + stats, confidence flags) → Claim detail (fetch, two-column layout).
5. **Wire-up** — Approve/Escalate, optional PATCH, confidence flagging.
6. **Polish** — Loading states, basic error handling, responsive layout.

---

## Checklist Before Starting

- [x] Images in `public/images/raw/` and `public/images/annotated/`; mock_data paths match.
- [ ] Next.js project initialized in `ClaimsVisionAI/`.
- [ ] Types include `annotatedVehicleImageUrl`.
- [ ] Decision recorded: use **annotated image** for DamageAnnotator (no bbox in V1).
- [ ] All 10 mock claims validated against `mock_data.json`.

---

## What’s *Not* in Scope for This Prototype

- Real AI/Scale AI integration; AI output is mock only.
- Multiple images or video per claim.
- Auth, RBAC, audit logs, PII redaction.
- Database or production-ready persistence.
- Full “generate report + escalate” workflow (only status updates and UI).

---

## Success Criteria (Definition of Done)

- [ ] All 10 claims appear in dashboard table with correct data.
- [ ] Claim detail loads from `/api/claims/[id]` and shows image + assessment.
- [ ] Raw and annotated images display correctly in detail view.
- [ ] Assessment panel shows confidence, total cost (editable), damage list, Approve/Escalate.
- [ ] Approve/Escalate update status (in UI, optionally via API).
- [ ] Claims with &lt;90% confidence are clearly flagged.
- [ ] Layout works on desktop (and reasonably on tablet).
- [ ] No blocking gaps; known limitations documented.

---

**Next step:** Complete Phase 1 (project setup + structure), then proceed through Phases 2–4 and wire-up in the order above.
