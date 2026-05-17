import { validateAndNormalizeUpc } from "./upc.js";
import { lookupUpc, normalizeProduct, generateScratchRecipe } from "./api.js";
import {
  initDatabase,
  normalizeBarcode,
  saveScanHistory,
  getScanHistory,
  saveProductCache,
  getProductByBarcode,
  saveHomemadeRecipe,
  logAppEvent,
} from "./localDb.js";

export let lastLookupResult = null;
let viewInitialized = false;
let requestInFlight = false;

function el(id) { return document.getElementById(id); }
function setHidden(element, hidden) { if (element) element.hidden = hidden; }

function clearStates() {
  setHidden(el("scan-loading"), true);
  setHidden(el("scan-error"), true);
  setHidden(el("scan-empty"), true);
}

async function isScannerAvailable() {
  if (!navigator.mediaDevices?.getUserMedia || !window.BarcodeDetector) return false;
  try {
    const formats = await BarcodeDetector.getSupportedFormats();
    return formats.some((f) => ["ean_13", "ean_8", "upc_a", "upc_e"].includes(f));
  } catch { return false; }
}

export async function initScanView() {
  await initDatabase();
  if (!viewInitialized) {
    const scannerSupported = await isScannerAvailable();
    setHidden(el("scan-camera-section"), !scannerSupported);

    el("manual-lookup-form")?.addEventListener("submit", handleManualSubmit);
    el("manual-clear-btn")?.addEventListener("click", handleClear);
    ["upc-input", "product-name-input", "ingredients-input"].forEach((id) => {
      el(id)?.addEventListener("input", clearStates);
    });
    viewInitialized = true;
  }
  await renderHistory();
}

function readManualInputs() {
  return {
    upc: (el("upc-input")?.value ?? "").trim(),
    productName: (el("product-name-input")?.value ?? "").trim(),
    labelText: (el("ingredients-input")?.value ?? "").trim(),
  };
}

function validateManualInputs(input) {
  if (!input.upc && !input.productName && !input.labelText) {
    return { ok: false, error: "Enter a UPC, product name, or label text to continue." };
  }
  if (input.upc) {
    const upcValidation = validateAndNormalizeUpc(input.upc);
    if (!upcValidation.ok) return { ok: false, error: upcValidation.error };
    return { ok: true, normalizedUpc: upcValidation.upc, upcNumeric: /^\d+$/.test(upcValidation.upc) };
  }
  return { ok: true, normalizedUpc: "", upcNumeric: false };
}

function buildLocalFallbackResult({ upc, productName, labelText }, message) {
  const title = productName || inferTitleFromText(labelText) || (upc ? `Packaged item (${upc})` : "Packaged food item");
  const ingredients = inferIngredients(labelText);
  return {
    upc: upc || "manual-entry",
    productName: title,
    brand: null,
    source: "local-fallback",
    found: true,
    manualLookup: {
      productTitle: title,
      productSummary: `${title} appears to be a packaged food. We can still build a cleaner homemade version from the details you entered.`,
      concerns: ["Packaged versions often include additives, extra sweeteners, or stabilizers."],
      homemadeAlternativeTitle: `Simple homemade ${title}`,
      homemadeIngredients: ingredients,
      homemadeSteps: [
        "Mix the base ingredients until evenly combined.",
        "Cook or chill depending on the food type until texture is right.",
        "Taste and adjust salt, sweetness, or seasoning before serving."
      ],
      confidenceLevel: labelText || productName ? "medium" : "low",
      source: "local-fallback",
      note: message || null,
    }
  };
}

function inferTitleFromText(text) {
  if (!text) return "";
  const head = text.split(/[\n,.]/).map((s) => s.trim()).find(Boolean);
  return head ? head.slice(0, 50) : "";
}

function inferIngredients(text) {
  const cleaned = (text || "").replace(/ingredients:?/i, "");
  const items = cleaned.split(/[\n,]/).map((s) => s.trim()).filter(Boolean).slice(0, 6);
  if (items.length) return items;
  return ["Flour or oats", "Simple fat (olive oil or butter)", "Salt", "Water or milk", "Optional seasoning"];
}

async function handleManualSubmit(e) {
  e.preventDefault();

  // Hard guard: ignore if a request is already in flight.
  if (requestInFlight) return;
  requestInFlight = true;

  clearStates();

  const input = readManualInputs();
  const check = validateManualInputs(input);
  if (!check.ok) return showError(check.error);

  const submitBtn = el("scan-submit-btn");
  setHidden(el("scan-loading"), false);
  if (submitBtn) submitBtn.disabled = true;

  const req = {
    upc: check.normalizedUpc || null,
    upcNumeric: check.upcNumeric,
    productName: input.productName || null,
    ingredientsText: input.labelText || null,
  };

  try {
    let result = null;
    if (req.upc) {
      const cached = await getProductByBarcode(normalizeBarcode(req.upc));
      if (cached?.productName) {
        result = { ...cached, upc: req.upc, found: true, source: cached.source || "cache" };
      } else {
        const body = await lookupUpc(req.upc);
        const product = normalizeProduct(body, req.upc);
        if (!product.found) {
          showError("We could not identify this product yet, but you can still paste ingredients or label text.");
          result = buildLocalFallbackResult(input);
        } else {
          result = product;
          await saveProductCache({ ...product, barcode: req.upc, normalizedBarcode: normalizeBarcode(req.upc), raw: body?.product ?? null });
        }
      }
    } else {
      result = buildLocalFallbackResult(input);
    }

    if (!result.manualLookup) {
      try {
        const ai = await generateScratchRecipe({
          productName: req.productName || result.productName || "Packaged food",
          brand: result.brand || "",
          ingredients: req.ingredientsText || result.ingredients || "",
          nutrition: null,
        });
        result.manualLookup = {
          productTitle: ai?.recipe?.product?.name || result.productName || "Packaged food",
          productSummary: ai?.recipe?.plainEnglishExplanation || "This appears to be a packaged food product.",
          concerns: (ai?.recipe?.ingredientSignals || []).map((x) => `${x.name}: ${x.reason}`).slice(0, 4),
          homemadeAlternativeTitle: ai?.recipe?.homemadeAlternative?.title || "Simple homemade version",
          homemadeIngredients: (ai?.recipe?.homemadeAlternative?.ingredients || []).map((x) => x.item || x),
          homemadeSteps: ai?.recipe?.homemadeAlternative?.steps || [],
          confidenceLevel: ai?.recipe?.product?.confidence || "medium",
          source: "ai-service",
        };
      } catch {
        result = buildLocalFallbackResult(input, "AI service is not configured, showing a local starter version.");
      }
    }

    await saveScanHistory({ barcode: result.upc, normalizedBarcode: normalizeBarcode(result.upc), source: result.source, status: "found", productName: result.productName, brand: result.brand });
    await saveHomemadeRecipe({ barcode: result.upc, normalizedBarcode: normalizeBarcode(result.upc), productName: result.productName, title: result.manualLookup.homemadeAlternativeTitle, ingredients: result.manualLookup.homemadeIngredients, steps: result.manualLookup.homemadeSteps });
    await logAppEvent({ eventType: "manual_lookup_submitted", barcode: normalizeBarcode(result.upc), details: req });

    lastLookupResult = result;
    window.location.hash = "#result";
  } catch (err) {
    showError(err?.message || "Lookup failed. Please try again.");
  } finally {
    requestInFlight = false;
    setHidden(el("scan-loading"), true);
    if (submitBtn) submitBtn.disabled = false;
    await renderHistory();
  }
}

function handleClear() {
  el("manual-lookup-form")?.reset();
  clearStates();
  setHidden(el("scan-empty"), false);
}

function showError(message) {
  el("scan-error-msg").textContent = message;
  setHidden(el("scan-error"), false);
}

async function renderHistory() {
  const listEl = el("scan-history-list");
  const emptyEl = el("scan-history-empty");
  if (!listEl) return;
  const records = await getScanHistory(10);
  listEl.innerHTML = "";
  if (!records.length) {
    setHidden(emptyEl, false);
    return;
  }
  setHidden(emptyEl, true);
  for (const r of records) {
    const li = document.createElement("li");
    li.className = "history-item";
    li.innerHTML = `<div class="history-top"><span class="history-name">${r.productName ?? "(no product name)"}</span><span class="history-status history-status-${r.status}">${r.status}</span></div><div class="history-meta"><code>${r.barcode ?? ""}</code></div>`;
    listEl.appendChild(li);
  }
}
