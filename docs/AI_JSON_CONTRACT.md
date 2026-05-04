# Scan-Scratch AI JSON Contract

AI responses must be JSON. Do not render raw model prose directly to users.

## Required response shape
```json
{
  "product": {
    "name": "string",
    "foodType": "string",
    "confidence": "high | medium | low",
    "sourceBasis": ["upc", "front_label", "ingredients_label", "user_text"]
  },
  "plainEnglishExplanation": "string",
  "ingredientSignals": [
    {
      "name": "string",
      "reason": "string",
      "category": "sweetener | oil | preservative | stabilizer | flavor | color | flour | dairy | protein | other"
    }
  ],
  "homemadeAlternative": {
    "title": "string",
    "positioning": "string",
    "prepTimeMinutes": 0,
    "cookTimeMinutes": 0,
    "difficulty": "easy | moderate",
    "servings": "string",
    "ingredients": [
      {
        "item": "string",
        "amount": "string",
        "notes": "string"
      }
    ],
    "steps": ["string"],
    "simpleSwaps": [
      {
        "insteadOf": "string",
        "use": "string",
        "why": "string"
      }
    ],
    "whyLessProcessed": ["string"],
    "tasteAndTextureExpectation": "string",
    "storageTips": "string"
  },
  "safetyNotes": ["string"],
  "disclaimer": "string"
}
```

## Validation rules
- `product.name`, `homemadeAlternative.title`, `ingredients`, and `steps` are required.
- Do not claim medical benefits.
- Do not diagnose allergies or disease risk.
- Use cautious language such as "may be simpler" or "uses fewer packaged additives" instead of guaranteed health claims.
- If confidence is low, say what is uncertain and ask for a clearer ingredient label.
- For unsafe or impossible recipes, return a safe explanation and no recipe.

## Default disclaimer
"This is general cooking and ingredient information, not medical advice. Check labels and consult a qualified professional for allergies, medical conditions, or dietary restrictions."

