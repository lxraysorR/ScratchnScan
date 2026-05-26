// Homepage "popular packaged foods" chips.
// pickChipNames is a pure helper (dedupe + limit + fallback) so the
// fallback-vs-dynamic behavior is unit-testable; renderPopularChips paints the
// chosen names into the chip row.

export const STARTER_PANTRY_ITEMS = ["Cream Cheese", "Mayo", "Mustard", "Ketchup", "Tomato Sauce"];

export function pickChipNames(items, limit = 5) {
  const seen = new Set();
  const picked = [];
  for (const item of items || []) {
    const name = String(item?.name || "").trim();
    const key = String(item?.normalizedName || name.toLowerCase().replace(/\s+/g, " ").trim());
    if (!name || !key || seen.has(key)) continue;
    seen.add(key);
    picked.push(name);
    if (picked.length >= limit) break;
  }
  return picked.length ? picked : STARTER_PANTRY_ITEMS.slice(0, limit);
}

export function renderPopularChips(
  items = [],
  container = (typeof document !== "undefined" ? document.getElementById("home-samples") : null),
) {
  if (!container) return;
  const finalItems = pickChipNames(items);
  container.innerHTML = "";
  for (const name of finalItems) {
    const btn = container.ownerDocument.createElement("button");
    btn.className = "chip";
    btn.type = "button";
    btn.dataset.sample = name;
    btn.textContent = name;
    container.appendChild(btn);
  }
}
