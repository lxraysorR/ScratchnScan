# Task 02 — Free Generation Meter and Upgrade Gate

You are working in the ScratchnScan repository.

## Primary Task

Add a no-account free usage meter and polished upgrade gate.

## Product Decision

Do **not** create accounts yet.

## Free Tier

Allow:

```text
10 free successful homemade generations per device
```

## Definition of a Successful Free Generation

A “free generation” is counted only when ScratchnScan successfully creates a homemade version from:

- a scanned barcode that leads to a result
- a manually entered product
- a package/photo draft that leads to a result

Do **not** count:

- opening the app
- opening scanner
- camera permission attempts
- cancelled scans
- failed scans
- not-found barcode attempts
- viewing history
- opening details
- editing a saved idea
- deleting/favoriting a saved idea

## Storage

Use IndexedDB or localStorage for the usage meter for now.

Prefer IndexedDB if the app already has a clean `localDb` module.

Use ScratchnScan-specific keys. Do **not** reuse PantryPulse/NutraPlate keys.

Suggested fields:

```js
{
  freeGenerationLimit: 10,
  successfulGenerationCount: 0,
  firstUsedAt: null,
  lastGeneratedAt: null,
  isLocalPremiumUnlocked: false,
  updatedAt: null
}
```

## No Accounts

Do not add:

- login
- signup
- email verification
- Supabase
- Stripe
- RevenueCat

Add only a front-end upgrade placeholder.

## Upgrade Behavior

When the user has remaining free generations, show subtle usage copy, not scary copy.

Example:

```text
7 free creations left
```

When the user reaches the limit:

- Do not allow another new generation.
- Show a polished upgrade screen or modal.
- Do not block history, details, favorite, delete, or existing saved items.

## Upgrade Screen Copy

Title:

```text
Keep creating homemade swaps
```

Body:

```text
You’ve used your 10 free ScratchnScan creations. Upgrade to keep turning packaged foods into homemade recipes.
```

Suggested offer:

```text
ScratchnScan Plus
$4.99/month or $29.99/year
```

These are placeholder display prices only. Do not connect payment yet.

Buttons:

```text
Upgrade coming soon
View saved ideas
Edit existing recipes
```

## Rules

- User can still view saved history after the limit.
- User can still open details after the limit.
- User can still favorite/delete saved ideas after the limit.
- User can still edit a current unsaved form, but cannot generate a new homemade result after the limit.
- If `isLocalPremiumUnlocked` is true for developer testing, bypass the limit.
- Add a dev-safe local toggle only if clearly hidden from customer UI or guarded for development.

## UI Placement

On Home, show light copy such as:

```text
10 free homemade creations included
```

On entry/result flow, show remaining count after generation.

Do not make the app feel cheap, aggressive, or desperate. The paywall should feel premium and calm.

## Implementation Guidance

Create or update a usage service with functions similar to:

```js
getUsageState()
canGenerate()
recordSuccessfulGeneration()
resetUsageForDev()
setLocalPremiumUnlockedForDev()
```

`resetUsageForDev()` and `setLocalPremiumUnlockedForDev()` should only exist if useful and should not be shown in the normal customer UI.

## Integration

Before `Create Homemade Version`:

1. Check `canGenerate()`.
2. If allowed, generate the result.
3. After successful result creation, call `recordSuccessfulGeneration()`.
4. If blocked, show the upgrade screen.

Important:

- Do not count a generation until the result exists.
- If generation throws an error, do not count it.

## Testing

Add lightweight tests if possible:

- initial usage count is zero
- can generate before 10
- after 10 successful generations, next generation is blocked
- failed generation does not increment
- history/details remain accessible after limit

## Validation

Run:

```bash
npm test
npm run qa:smoke
npm run build
```

## Manual Validation

1. Clear browser storage.
2. Generate a homemade version.
3. Confirm free count decreases from 10 to 9.
4. Generate until count reaches 0.
5. Confirm the next generation shows upgrade gate.
6. Confirm saved history still opens.
7. Confirm details still open.
8. Confirm favorite/delete still work.
9. Confirm no account/signup is requested.
10. Confirm no payment is actually charged.

## Deliverables

Report:

1. Files changed.
2. Free scan/generation logic implemented.
3. Why the app does not need accounts yet.
4. Confirmation that the limit is 10 successful homemade generations per device.
5. Confirmation that only successful generations count.
6. IndexedDB/local storage key names.
7. Confirmation that upgrade is placeholder only.
8. Remaining later work:
   - Stripe web checkout
   - RevenueCat mobile subscriptions
   - user accounts/cloud sync
