// Shared rendering helpers used by both result.js and details.js.
// Pure DOM helpers — no imports, no state, no network calls.

export function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function confidenceText(ctx) {
  if (ctx.confidenceLabel === "high") return "High confidence";
  if (ctx.confidenceLabel === "medium") return "Medium confidence";
  if (ctx.confidenceLabel === "low") return "Low confidence — please review";
  return "Unknown confidence — add details to improve";
}

export function renderAccordion(section, openByDefault) {
  if (!section) return;
  const title = section.querySelector("h3");
  if (!title) return;
  const label = title.textContent;
  const content = [...section.children].filter((n) => n !== title);
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "accordion-toggle";
  btn.setAttribute("aria-expanded", openByDefault ? "true" : "false");
  btn.textContent = label;
  const body = document.createElement("div");
  body.className = "recipe-accordion-content";
  if (!openByDefault) body.hidden = true;
  content.forEach((n) => body.appendChild(n));
  btn.onclick = () => {
    const next = btn.getAttribute("aria-expanded") !== "true";
    btn.setAttribute("aria-expanded", String(next));
    body.hidden = !next;
  };
  section.innerHTML = "";
  section.append(btn, body);
}

export function renderProductSummaryInto(container, productContext, fallbackTitle = "Homemade target") {
  if (!container) return;
  container.innerHTML = `
    <h3>Product detected</h3>
    <p><strong>${escapeHtml(productContext.productName || fallbackTitle)}</strong></p>
    <p class="details-meta">${[productContext.brand, productContext.category, productContext.flavor].filter(Boolean).map(escapeHtml).join(" · ")}</p>
    <p class="details-meta">${[productContext.source ? `Detected from ${escapeHtml(productContext.source)}` : "", confidenceText(productContext)].filter(Boolean).join(" · ")}</p>
  `;
}

export function renderUnderstoodPanelInto(container, productContext, { showHelper = false } = {}) {
  if (!container) return;
  const rows = [
    productContext.productName ? `<div class="understood-row"><strong>Product:</strong> ${escapeHtml(productContext.productName)}</div>` : "",
    productContext.ingredientsText ? `<div class="understood-row"><strong>Ingredients read:</strong> ${escapeHtml(productContext.ingredientsText)}</div>` : "",
    productContext.claims?.length ? `<div class="understood-row"><strong>Claims read:</strong> ${productContext.claims.map(escapeHtml).join(", ")}</div>` : "",
    `<div class="understood-row"><strong>Source:</strong> ${escapeHtml(productContext.source || "unknown")}</div>`,
    `<div class="understood-row"><strong>Confidence:</strong> ${confidenceText(productContext)}</div>`,
  ].filter(Boolean);
  const helper = showHelper
    ? `<p class="helper">We use these details to make the homemade version more specific. Ingredients matter most because they show what the packaged food is made from.</p>`
    : "";
  container.innerHTML = `<h3>What the app understood</h3>${rows.join("")}${helper}`;
}

export function renderQuickFactsInto(container, recipe, productContext) {
  if (!container) return;
  const steps = recipe?.steps || [];
  const t = (recipe?.prepTimeMinutes || 0) + (recipe?.cookTimeMinutes || 0);
  container.innerHTML = `
    <div class="quick-fact"><span>Method</span><strong>${/(bake|air[- ]?fry)/i.test(steps.join(" ")) ? "Bake / air fry" : "Homemade"}</strong></div>
    <div class="quick-fact"><span>Time</span><strong>${t > 0 ? `${t} min` : "Varies"}</strong></div>
    <div class="quick-fact"><span>Base</span><strong>${escapeHtml(productContext.detectedIngredients?.[0] || productContext.category || "Pantry staples")}</strong></div>
  `;
}
