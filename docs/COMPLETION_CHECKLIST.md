# MVP Completion Checklist

Status values: **Not Started** | **In Progress** | **Done** | **Blocked**

## 1) App shell
- **Status:** In Progress  
  **Acceptance criteria:** App boots locally, key routes/views render, no runtime crash on first load.  
  **Suggested test:** Run app shell tests and open app in browser.

## 2) Manual product lookup
- **Status:** Not Started  
  **Acceptance criteria:** User can submit manual UPC and receive product data or clear not-found guidance.  
  **Suggested test:** Enter valid/invalid UPC samples and verify response handling.

## 3) Ingredient/label entry
- **Status:** Not Started  
  **Acceptance criteria:** User can paste/type product/ingredient text, submit, and continue flow without UPC dependence.  
  **Suggested test:** Submit multiline label text and verify parsing/forwarding behavior.

## 4) AI homemade alternative generation
- **Status:** Not Started  
  **Acceptance criteria:** App returns structured explanation + recipe object aligned with `docs/AI_JSON_CONTRACT.md`.  
  **Suggested test:** Mock AI response validation tests for valid/invalid payloads.

## 5) IndexedDB saved history
- **Status:** Not Started  
  **Acceptance criteria:** Results can be saved/retrieved locally via storage adapter; no server dependency required.  
  **Suggested test:** Save 2+ items, reload app, confirm persistence and retrieval.

## 6) Recent items page/view
- **Status:** Not Started  
  **Acceptance criteria:** User can view a recent list and reopen prior result summaries.  
  **Suggested test:** Navigate to recent view after saving items and verify ordering/display.

## 7) Mobile responsiveness
- **Status:** Not Started  
  **Acceptance criteria:** Primary flow is usable at narrow widths without clipped controls or unreadable text.  
  **Suggested test:** Browser responsive mode at ~360px width through full flow.

## 8) Error handling
- **Status:** Not Started  
  **Acceptance criteria:** Missing UPC/product/AI failures show clear recoverable messaging and next actions.  
  **Suggested test:** Force not-found and simulated provider errors; verify user guidance.

## 9) QA/testing
- **Status:** In Progress  
  **Acceptance criteria:** Smoke checks run without secrets; core file/script structure validated.  
  **Suggested test:** Run `npm run qa:smoke` and review report output.

## 10) Final demo readiness
- **Status:** Not Started  
  **Acceptance criteria:** End-to-end demo path works with at least one successful manual input flow and local history save.  
  **Suggested test:** Execute scripted demo checklist and capture results in `qa/reports/`.
