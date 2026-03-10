# PDF Polish & Code Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove dead chat code, add document IDs to PDFs, polish PDF layout minimally, fix hardcoded 960 constant, and deduplicate receipt validator types.

**Architecture:** Five independent, low-risk changes. No schema changes. No new dependencies. Each task is a focused edit to 1-3 files.

**Tech Stack:** Next.js App Router, Convex, pdf-lib, TypeScript, Vitest

---

## Task 1: Remove dead chat code

**Files:**
- Delete: `app/components/AI/ChatTrigger.tsx`
- Delete: `app/components/AI/ChatOverlay.tsx`
- Modify: `app/(protected)/layout.tsx:3,74`

**Step 1: Delete the two chat component files**

```bash
rm app/components/AI/ChatTrigger.tsx
rm app/components/AI/ChatOverlay.tsx
```

**Step 2: Remove import and comment from layout**

In `app/(protected)/layout.tsx`, remove line 3:
```ts
import { ChatTrigger } from "@/components/AI/ChatTrigger";
```
And remove line 74 (the comment):
```tsx
{/* ChatTrigger hidden until Budgy feature is ready */}
```

**Step 3: Verify build has no errors**

```bash
pnpm build 2>&1 | grep -E "error|Error" | head -20
```
Expected: no errors referencing ChatTrigger or ChatOverlay.

**Step 4: Commit**

```bash
git add -A
git commit -m "removed dead chat components"
```

---

## Task 2: Deduplicate receipt validator types

**Files:**
- Modify: `convex/reimbursements/validators.ts`

**Context:** `receiptValidator` and `travelReceiptValidator` share 8 identical fields. Extract them.

**Step 1: Rewrite the file**

Replace the entire contents of `convex/reimbursements/validators.ts` with:

```ts
import { v } from "convex/values";

const baseReceiptFields = {
  receiptNumber: v.optional(v.string()),
  receiptDate: v.string(),
  companyName: v.string(),
  description: v.string(),
  netAmount: v.number(),
  taxRate: v.number(),
  grossAmount: v.number(),
  fileStorageId: v.id("_storage"),
};

export const receiptValidator = v.object(baseReceiptFields);

export const travelReceiptValidator = v.object({
  ...baseReceiptFields,
  costType: v.union(
    v.literal("car"),
    v.literal("train"),
    v.literal("flight"),
    v.literal("taxi"),
    v.literal("bus"),
    v.literal("accommodation"),
  ),
  kilometers: v.optional(v.number()),
});
```

**Step 2: Verify tests still pass**

```bash
pnpm vitest run convex/reimbursements
```
Expected: all pass (no type changes, only restructured validators).

**Step 3: Commit**

```bash
git add convex/reimbursements/validators.ts
git commit -m "deduplicated receipt validator base fields"
```

---

## Task 3: Fix hardcoded 960 constant

**Files:**
- Modify: `app/(public)/ehrenamtspauschale/[id]/page.tsx`
- Modify: `app/components/Reimbursements/VolunteerAllowanceFormUI.tsx`

**Context:** `MAX_VOLUNTEER_ALLOWANCE_EUR = 960` lives in `convex/volunteerAllowance/constants.ts` but is re-defined or hardcoded raw in two other files.

**Step 1: Update ehrenamtspauschale page**

In `app/(public)/ehrenamtspauschale/[id]/page.tsx`:

Add import at top (after existing imports):
```ts
import { MAX_VOLUNTEER_ALLOWANCE_EUR } from "@/convex/volunteerAllowance/constants";
```

Remove lines 18-19 (the local IBAN/BIC regex) — wait, those are needed for validation. Keep those.

Replace the 4 raw `960` occurrences:
- Line 66: `if (parseFloat(value.replace(",", ".")) > 960) return;`
  → `if (parseFloat(value.replace(",", ".")) > MAX_VOLUNTEER_ALLOWANCE_EUR) return;`
- Line 98: `if (amount > 960) return toast.error("Maximal 960€ erlaubt");`
  → `if (amount > MAX_VOLUNTEER_ALLOWANCE_EUR) return toast.error(\`Maximal ${MAX_VOLUNTEER_ALLOWANCE_EUR}€ erlaubt\`);`
- Line 273: `<Label>Betrag in Euro (max. 960€) *</Label>`
  → `<Label>Betrag in Euro (max. {MAX_VOLUNTEER_ALLOWANCE_EUR}€) *</Label>`
- Line 277: `max="960"`
  → `max={String(MAX_VOLUNTEER_ALLOWANCE_EUR)}`

**Step 2: Update VolunteerAllowanceFormUI**

In `app/components/Reimbursements/VolunteerAllowanceFormUI.tsx`:

Add import (after existing imports):
```ts
import { MAX_VOLUNTEER_ALLOWANCE_EUR } from "@/convex/volunteerAllowance/constants";
```

Remove line 30:
```ts
const MAX_AMOUNT = 960;
```

Replace all uses of `MAX_AMOUNT` in this file with `MAX_VOLUNTEER_ALLOWANCE_EUR`.

**Step 3: Verify no raw 960 remains in these files**

```bash
grep -n "960" app/(public)/ehrenamtspauschale/[id]/page.tsx app/components/Reimbursements/VolunteerAllowanceFormUI.tsx
```
Expected: no output.

**Step 4: Run tests**

```bash
pnpm vitest run convex/volunteerAllowance
```
Expected: all pass.

**Step 5: Commit**

```bash
git add app/(public)/ehrenamtspauschale/[id]/page.tsx app/components/Reimbursements/VolunteerAllowanceFormUI.tsx
git commit -m "replaced hardcoded 960 with MAX_VOLUNTEER_ALLOWANCE_EUR constant"
```

---

## Task 4: Add document ID to reimbursement PDF

**Files:**
- Modify: `app/lib/fileHandlers/generateReimbursementPDF.ts`
- Modify: `app/(protected)/reimbursements/page.tsx`

**Context:** The PDF function signature is `generateReimbursementPDF(reimbursement, receipts)`. The `reimbursement` object already has `_id` available at the call site. We need to render the last 8 chars of the ID in the top-right of the header bar.

**Step 1: Update `drawHeader` to accept an optional docId**

In `generateReimbursementPDF.ts`, update the `drawHeader` function signature and body:

```ts
function drawHeader(
  page: ReturnType<PDFDocument["addPage"]>,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  boldFont: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  title: string,
  orgName: string,
  width: number,
  docId?: string,
) {
  // Blue header bar
  page.drawRectangle({
    x: 0,
    y: 792,
    width,
    height: 50,
    color: BLUE,
  });
  page.drawText(title, {
    x: 40,
    y: 808,
    size: 16,
    font: boldFont,
    color: rgb(1, 1, 1),
  });
  if (orgName) {
    const orgTextWidth = boldFont.widthOfTextAtSize(orgName, 10);
    page.drawText(orgName, {
      x: width - orgTextWidth - 40,
      y: 818,
      size: 10,
      font,
      color: rgb(0.85, 0.9, 1),
    });
  }
  if (docId) {
    const refText = `Ref: ${docId}`;
    const refWidth = font.widthOfTextAtSize(refText, 8);
    page.drawText(refText, {
      x: width - refWidth - 40,
      y: 797,
      size: 8,
      font,
      color: rgb(0.7, 0.8, 1),
    });
  }
}
```

**Step 2: Pass docId when drawing header on cover page and receipt pages**

In `generateReimbursementPDF`:

After `const title = ...` add:
```ts
const docId = reimbursement._id ? String(reimbursement._id).slice(-8) : undefined;
```

Update the cover page header call:
```ts
drawHeader(coverPage, font, boldFont, title, orgName, WIDTH, docId);
```

Receipt pages only show `BELEG N` as title — pass `undefined` for docId there (already the default).

**Step 3: Verify the function still compiles**

```bash
pnpm build 2>&1 | grep -E "generateReimbursementPDF|error" | head -10
```
Expected: no errors.

**Step 4: Commit**

```bash
git add app/lib/fileHandlers/generateReimbursementPDF.ts
git commit -m "added document ref ID to reimbursement PDF header"
```

---

## Task 5: Add document ID to volunteer allowance PDF

**Files:**
- Modify: `app/lib/fileHandlers/generateVolunteerAllowancePDF.ts`
- Modify: `app/(protected)/reimbursements/page.tsx`

**Context:** `generateVolunteerAllowancePDF(data, signatureUrl)` — `data` doesn't include `_id`. Need to add it.

**Step 1: Add `id` to the `VolunteerAllowanceData` type**

In `generateVolunteerAllowancePDF.ts`, add to the type:
```ts
type VolunteerAllowanceData = {
  id?: string;           // ← add this line
  amount: number;
  // ... rest unchanged
};
```

**Step 2: Render the doc ID in the header**

After the org name text draw (around line 58), add:
```ts
if (data.id) {
  const refText = `Ref: ${data.id.slice(-8)}`;
  const refWidth = font.widthOfTextAtSize(refText, 8);
  page.drawText(refText, {
    x: WIDTH - refWidth - M,
    y: 797,
    size: 8,
    font,
    color: rgb(0.7, 0.8, 1),
  });
}
```

**Step 3: Pass `_id` from the call site**

In `app/(protected)/reimbursements/page.tsx`, update `getPdfBlobForAllowance`:

```ts
const getPdfBlobForAllowance = async (allowance: Allowance): Promise<Blob | null> => {
  if (!allowance.signatureStorageId) return null;
  const signatureUrl = await convex.query(api.volunteerAllowance.queries.getSignatureUrl, {
    storageId: allowance.signatureStorageId,
  });
  return generateVolunteerAllowancePDF({ ...allowance, id: allowance._id }, signatureUrl);
};
```

**Step 4: Verify build**

```bash
pnpm build 2>&1 | grep -E "error|Error" | head -10
```
Expected: no errors.

**Step 5: Commit**

```bash
git add app/lib/fileHandlers/generateVolunteerAllowancePDF.ts app/(protected)/reimbursements/page.tsx
git commit -m "added document ref ID to volunteer allowance PDF header"
```

---

## Final Verification

```bash
pnpm vitest run
pnpm build
```

Both should pass cleanly.
