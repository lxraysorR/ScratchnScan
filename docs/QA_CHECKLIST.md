# MVP QA Checklist

- [ ] Manual Entry: can submit product name and generate result.
- [ ] Fallback recipe generation works without AI key.
- [ ] Save persists generated recipe.
- [ ] History lists saved recipes in expected order.
- [ ] Details opens and renders selected recipe content.
- [ ] Favorite toggles correctly and persists.
- [ ] Delete removes record from history/details.
- [ ] Empty state appears when history is empty.
- [ ] Refresh persistence: saved records remain after browser refresh.
- [ ] Mobile layout smoke test on narrow viewport.

## Responsive Layout QA — Mobile Widths

Test each screen listed below at these viewport widths: **320px, 360px, 375px, 390px, 414px, 480px**.

### Global checks (all widths)
- [ ] No horizontal page scrolling (`document.documentElement.scrollWidth <= window.innerWidth + 1`)
- [ ] No element extends more than 1px beyond the right viewport edge
- [ ] Vertical scrolling inside `.main` works correctly
- [ ] Bottom nav is fully visible with readable labels

### Home screen
- [ ] Hero buttons fit inside the hero card (no overflow)
- [ ] Start cards fit — text wraps, arrow aligns, icon stays fixed
- [ ] Popular chips stay in one horizontal row (scrollable, no wrapping)
- [ ] No horizontal page scrolling

### Scan screen
- [ ] Scanner frame fits inside `.scan-card`
- [ ] At 320–375px: scan buttons stack vertically (1 column)
- [ ] At 390px+: scan buttons may use 2 columns; primary button spans full width
- [ ] "Type product name" button does not push outside the card

### Manual / Create screen
- [ ] At 320–375px: front/back photo tiles stack vertically (1 column)
- [ ] At 390px+: photo tiles display side by side (2 columns)
- [ ] Replace/Remove buttons fit inside each photo slot
- [ ] Product name input, ingredients textarea, and preference input fit within the form card
- [ ] Continue / Generate / Clear buttons fit and stack if needed
- [ ] Friendly error alert buttons do not overflow
- [ ] Progress/creating state card fits

### Result screen
- [ ] Badges wrap cleanly (flex-wrap)
- [ ] Recipe title wraps — does not overflow card
- [ ] At 320–370px: quick facts show in 1 column; at 375px+ show in 3 columns
- [ ] Ingredients and steps stay inside the result card
- [ ] Sticky action bar does not obscure the disclaimer
- [ ] Save/Edit buttons fit; at very narrow widths they stack

### History screen
- [ ] Recipe cards fit at all widths
- [ ] View Recipe button and favorite button fit side by side
- [ ] At ≤340px: history actions stack vertically
- [ ] Long recipe names wrap within the card
- [ ] Delete link is visible and tappable

### Details screen
- [ ] Product summary card fits
- [ ] At 320–375px: metric cards show in 1 column; at 375px+ show in 3 columns
- [ ] At 320–375px: photo row stacks vertically; at 390px+ shows 2 columns
- [ ] Sticky Back / Favorite bar does not overlap nav
- [ ] Delete button is visible below sticky bar

### Browser overflow assertion (pseudo-code for manual verification)
```js
const overflowing = [...document.querySelectorAll('body *')]
  .filter(el => {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    const rect = el.getBoundingClientRect();
    return rect.right > window.innerWidth + 1 || rect.left < -1;
  });
// expect overflowing to be []
```

### Automated regression coverage
`scripts/test_responsive_css_generated.mjs` verifies 26 CSS rules including:
- Global overflow protection on `html` and `body`
- `.btn` responsive safety properties
- Single-column defaults for `.scan-actions`, `.photo-grid`, `.photo-actions`,
  `.form-actions-inline`, `.sticky-action-bar`, `.quick-facts`, `.metric-row`,
  `.details-photo-row`, `.wizard-stepper`
- `.history-actions` using `minmax(0, 1fr)` to prevent overflow
- `.start-card` using `minmax(0, 1fr)` for text column
- `.chip-row` using `flex-wrap: nowrap` with `overflow-x: auto`
- Recipe containers (`.result-card`, `.bullet-list li`) with `overflow-wrap: anywhere`
- `.alert` with `flex-wrap: wrap`
