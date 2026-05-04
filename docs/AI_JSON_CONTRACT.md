# AI JSON Contract (Draft v0)

```json
{
  "product_name": "string",
  "product_type": "string",
  "confidence": 0.0,
  "detected_signals": ["string"],
  "plain_english_summary": "string",
  "homemade_alternative": {
    "name": "string",
    "ingredients": ["string"],
    "steps": ["string"],
    "taste_texture_expectations": "string",
    "storage_tips": "string"
  },
  "safety_disclaimer": "This is general food information, not medical advice."
}
```

## Notes
- `confidence` is 0.0 to 1.0.
- Missing fields should be explicit nulls in implementation phase if unavailable.
- Keep disclaimer wording materially equivalent.
