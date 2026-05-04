# ScratchNScan Implementation Plan

## Phase 0 — Foundation (current)
- Create repo docs, agents, skills, prompts, and directory structure.
- Define contracts and acceptance criteria.

## Phase 1 — Input Layer
- Implement UPC/manual entry interfaces.
- Add UPC lookup adapter with confidence scoring.
- Add label image intake fallback path.

## Phase 2 — Product Understanding Pipeline
- Normalize lookup and OCR signals.
- Generate structured product understanding JSON.

## Phase 3 — Homemade Alternative Engine
- Convert understanding JSON to homemade recipe output.
- Add disclaimers and user-facing formatting.

## Phase 4 — UX Flow + Hardening
- Build minimal mobile-first flow and state handling.
- Add tests, telemetry basics, and release checklist.
