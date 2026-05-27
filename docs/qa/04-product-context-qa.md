# Claude QA Prompt — ProductContext Normalization

## Role
You are QA reviewing Scratch-N-Scan.

## Scope
Verify ProductContext structure creation, field normalization, compatibility, and render safety.

## Do-not-change instructions
- QA-only review; do not refactor ProductContext in this pass.
- **Do not add new features during QA. If you find an issue, report it and write a separate Codex fix prompt.**

## Commands to run
- `npm test`
- ProductContext-specific tests if present.
- Optional static search for ProductContext creation paths.

## Checklist
- [ ] ProductContext module exists if implementation has started.
- [ ] Manual entry creates normalized context.
- [ ] Photo upload path creates normalized context.
- [ ] Popular starter path creates normalized context.
- [ ] Scanner/barcode path creates or prepares normalized context.
- [ ] `worker product.foodType` maps to category.
- [ ] confidence high/medium/low maps to numeric + label values.
- [ ] `sourceBasis` is preserved across transforms/storage.
- [ ] Preserves when available: detectedIngredients, claims, brand, flavor, packageText, ingredientsText, nutritionFacts.
- [ ] Legacy saved records without ProductContext still render safely.

## Report format
Use `docs/qa/REPORT_TEMPLATE.md` with explicit **Context Field Matrix** for required fields.

## Acceptance criteria
PASS only if normalized context is consistent across major entry paths and legacy compatibility remains intact.
