# Scan-Scratch MVP Scope

## One-sentence MVP
Scan-Scratch scans a UPC or reads a package label and creates a simple homemade version of the packaged food using everyday ingredients.

## Must-have demo flow
1. User opens app.
2. User scans UPC or enters barcode manually.
3. App identifies packaged product when provider data exists.
4. If UPC data is missing or incomplete, user can upload front label and ingredients/back-label photos.
5. App extracts or interprets product name, food type, and ingredient signals.
6. App explains the packaged product in plain English.
7. App generates a cleaner homemade alternative with:
   - recipe title
   - everyday ingredients
   - simple steps
   - swaps/substitutions
   - why it is less processed
   - what it will and will not taste like compared with the package
8. User can scan another item or save/share/copy the result later.

## MVP features
- UPC scan/manual entry
- basic provider lookup using inherited PantryPulse pipeline
- product not found state
- photo upload for front and ingredient/back label
- thumbnail previews after image selection
- AI product explanation
- AI homemade alternative generation
- simple result page
- simple local history, optional for demo
- mobile-responsive layout

## Explicitly out of scope for first version
- paid subscriptions
- household consensus
- additive intelligence as a separate premium module
- full pantry inventory
- meal planning calendar
- Instacart checkout
- complex user profiles
- complex store submission work
- large database migrations unless required for the demo

## Demo success criteria
- The app can demo at least 5 packaged foods.
- At least 2 demos should work through UPC lookup.
- At least 2 demos should work through label-photo fallback.
- At least 1 demo should show product-not-found recovery.
- AI output must be structured, readable, and safe.
- A user should understand the flow without instructions.

