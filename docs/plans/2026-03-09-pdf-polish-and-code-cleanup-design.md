# PDF Polish & Code Cleanup Design

**Date:** 2026-03-09
**Branch:** feat/reimbursement-improvements

## Scope

Five targeted improvements to clean up code quality and polish PDF output.

## Tasks

### 1. Remove dead chat code
- Delete `app/components/AI/ChatTrigger.tsx`
- Delete `app/components/AI/ChatOverlay.tsx`
- Remove the commented-out import in `app/(protected)/layout.tsx`

### 2. Minimal PDF polish
Files: `app/lib/fileHandlers/generateReimbursementPDF.ts`, `app/lib/fileHandlers/generateVolunteerAllowancePDF.ts`

Changes:
- Add document ID in top-right corner: `Ref: <last 8 chars of _id>`
- Add thin horizontal rule under the title
- Consistent section spacing throughout
- Slightly larger org name in header

### 3. Fix hardcoded 960 constant
- `app/(public)/ehrenamtspauschale/[id]/page.tsx` — replace all raw `960` references with `MAX_VOLUNTEER_ALLOWANCE_EUR` imported from `convex/volunteerAllowance/constants.ts`
- `app/components/Reimbursements/VolunteerAllowanceFormUI.tsx` — remove local `const MAX_AMOUNT = 960`, import the shared constant

### 4. Fix receipt type duplication
File: `convex/reimbursements/validators.ts`

Extract shared fields from `receiptValidator` and `travelReceiptValidator` into a `baseReceiptFields` object and compose both validators from it.

### 5. Add ID to all PDFs (covered by task 2)
Both PDF generators receive the document `_id` and render `Ref: <last 8 chars>` top-right on page 1. Update all call sites to pass the ID.

## Non-goals
- Logo upload or org color customization
- PDF template system
- Any new features beyond the above
