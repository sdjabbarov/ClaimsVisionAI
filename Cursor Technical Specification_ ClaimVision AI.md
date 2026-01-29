# Cursor Technical Specification: ClaimVision AI

**Objective:** This document provides a detailed, step-by-step technical plan for building the ClaimVision AI prototype using Cursor. Each section contains specific prompts and file paths to guide the AI code generation process.

---

### **1. Project Setup**

First, create the Next.js project. Open the Cursor terminal and run this command in your project folder.

> **Prompt for Cursor Terminal:**
> ```bash
> npx create-next-app@latest . --ts --eslint --tailwind --src-dir --app --import-alias "@/*"
> ```

---

### **2. File Structure & Initial Content**

Create the following file and folder structure. This will organize our code logically.

> **Prompt for Cursor:** "Create the following file and folder structure inside the `src/` directory. Leave the files empty for now:
> ```
> src/
> ├── app/
> │   ├── api/
> │   │   └── claims/
> │   │       └── [id]/
> │   │           └── route.ts
> │   ├── claim/
> │   │   └── [id]/
> │   │       └── page.tsx
> │   └── page.tsx
> ├── components/
> │   ├── ui/
> │   │   ├── Card.tsx
> │   │   └── Badge.tsx
> │   ├── ClaimsTable.tsx
> │   ├── DamageAnnotator.tsx
> │   └── AssessmentPanel.tsx
> ├── lib/
> │   ├── data.ts
> │   └── types.ts
> ```
> "

---

### **3. Data Layer: Types and Mock Data**

**A. Define Data Structures (`src/lib/types.ts`)**

> **Prompt for Cursor (`src/lib/types.ts`):**
> "Create and export TypeScript interfaces for our application data. I need:
> 1.  `Damage` interface with: `type` (string), `location` (string), `severity` (string), and `estimatedCost` (number).
> 2.  `AIAssessment` interface with: `confidenceScore` (number), `totalEstimatedCost` (number), and `damages` (an array of `Damage`).
> 3.  `Claim` interface with: `id` (string), `policyholder` (string), `claimDate` (string), `status` (
'Pending Review' | 'Approved' | 'Escalated'), `vehicleImageUrl` (string), and `aiAssessment` (`AIAssessment`)."

**B. Create Mock Data (`src/lib/data.ts`)**

> **Prompt for Cursor (`src/lib/data.ts`):**
> "Import the `Claim` type. Create and export a constant named `MOCK_CLAIMS` which is an array of 3 `Claim` objects. Populate it with realistic-looking data. For `vehicleImageUrl`, use placeholder paths like 
'/images/car-1.jpg'."

**C. Create the API Endpoint (`src/app/api/claims/[id]/route.ts`)**

> **Prompt for Cursor (`src/app/api/claims/[id]/route.ts`):**
> "Create a Next.js API GET route. It should import `MOCK_CLAIMS`. The route should find a claim in the `MOCK_CLAIMS` array where the `id` matches the `id` parameter from the URL. If a claim is found, respond with its JSON. If not found, respond with a 404 error and a message."

---

### **4. UI Component Implementation**

Now, let's build the reusable UI components.

**A. Badge (`src/components/ui/Badge.tsx`)**

> **Prompt for Cursor (`src/components/ui/Badge.tsx`):**
> "Create a simple, reusable Badge component using Tailwind CSS. It should accept a `variant` prop ('default', 'success', 'warning') that changes its color. It should also accept children to display text."

**B. Card (`src/components/ui/Card.tsx`)**

> **Prompt for Cursor (`src/components/ui/Card.tsx`):**
> "Create a reusable Card component using Tailwind CSS. It should have a light border, rounded corners, and a subtle shadow. It should render any children passed to it."

**C. Claims Table (`src/components/ClaimsTable.tsx`)**

> **Prompt for Cursor (`src/components/ClaimsTable.tsx`):**
> "Create a `ClaimsTable` component that accepts an array of `Claim` objects as a prop. Use the `Card` component as a container. Display the claims in a table with columns for Claim ID, Policyholder, Claim Date, and Status. Use the `Badge` component to display the status. Make each row a Next.js Link that navigates to `/claim/[id]`."

**D. Damage Annotator (`src/components/DamageAnnotator.tsx`)**

> **Prompt for Cursor (`src/components/DamageAnnotator.tsx`):**
> "Create a `DamageAnnotator` component. It should accept `imageUrl` (string) and `damages` (array of `Damage`) as props. It should display the image. Then, for each damage in the array, render a semi-transparent div positioned over the image to represent a bounding box (use placeholder positions for now). Inside the div, display the damage type and estimated cost."

**E. Assessment Panel (`src/components/AssessmentPanel.tsx`)**

> **Prompt for Cursor (`src/components/AssessmentPanel.tsx`):**
> "Create an `AssessmentPanel` component that accepts an `AIAssessment` object as a prop. Use the `Card` component. Display the `confidenceScore` and `totalEstimatedCost` prominently at the top. Below that, list each `Damage` with its type, location, and severity. Add 'Approve' and 'Escalate' buttons at the bottom. The `totalEstimatedCost` should be an editable input field."

---

### **5. Page Implementation**

Finally, assemble the components into pages.

**A. Dashboard Page (`src/app/page.tsx`)**

> **Prompt for Cursor (`src/app/page.tsx`):**
> "Create the main dashboard page. It should have a title 'Claims Dashboard'. Import and use the `ClaimsTable` component, passing the `MOCK_CLAIMS` data to it. Add a small section at the top showing high-level stats like 'Total Pending Claims'."

**B. Claim Detail Page (`src/app/claim/[id]/page.tsx`)**

> **Prompt for Cursor (`src/app/claim/[id]/page.tsx`):**
> "Create the claim detail page. It should be a client component (`'use client'`). Use React hooks (`useState`, `useEffect`) to fetch the data for a single claim from the `/api/claims/[id]` endpoint based on the URL parameter. While loading, show a 'Loading...' message. Once loaded, display the page in a two-column layout. On the left, render the `DamageAnnotator` component, passing the image URL and damages. On the right, render the `AssessmentPanel` component, passing the full AI assessment object."
