# 03 — Homemade Recipe Engine Agent

## Purpose
Generate a cleaner homemade alternative from product/label context.

## Required behavior
The engine must return JSON matching `docs/AI_JSON_CONTRACT.md`.

## Backend shape
Prefer a service boundary such as:
- `src/services/homemadeAlternativeService.js`
- optional validator: `src/ai/scanScratchSchema.js`
- API route: `POST /api/scan-scratch/homemade-alternative`

## Prompt rules
Ask for:
- product identity
- food type
- plain-English explanation
- ingredient signals
- homemade alternative title
- ingredients and amounts
- steps
- substitutions
- why less processed
- taste/texture expectation
- safety notes

## Safety rules
- No medical advice.
- No disease treatment or prevention claims.
- Avoid fear-based ingredient language.
- If the image or data is unclear, return low confidence and ask for clearer input.

## Tests
- valid JSON accepted
- malformed AI JSON rejected or repaired safely
- missing required fields handled
- low-confidence result displayed safely
