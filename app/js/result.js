import { generateHomemadeAlternative } from "./api.js";
import { saveMvpRecipe, getMvpHistory, getMvpRecipeById, deleteMvpRecipe, toggleMvpFavorite } from "./localDb.js";

const el = (id) => document.getElementById(id);
let currentDraft = null;
let currentSavedId = null;
let bound = false;

function showError(message) {
  el("manual-error-msg").textContent = message;
  el("manual-error").hidden = false;
}

function clearError() {
  el("manual-error").hidden = true;
}

function readManualForm() {
  return {
    upc: el("manual-upc").value.trim(),
    productName: el("manual-name").value.trim(),
    brand: el("manual-brand").value.trim(),
    category: el("manual-category").value.trim(),
    ingredients: el("manual-ingredients").value.trim(),
    nutritionNotes: el("manual-nutrition").value.trim(),
    userNotes: el("manual-notes").value.trim(),
  };
}

function validateManualInput(input) {
  if (!input.productName) return "Please enter a product name.";
  if (!input.ingredients) return "Please add ingredients so we can create a homemade version.";
  return "";
}

function renderGeneratedResult(record, source) {
  currentDraft = record;
  currentSavedId = record.id || null;
  const generated = record.generatedResult;

  el("result-meta").textContent = source === "fallback" ? "Generated with temporary local fallback." : "Generated with AI recipe service.";
  el("detail-product-name").textContent = record.productName;
  el("detail-brand").textContent = record.brand || "—";
  el("detail-category").textContent = record.category || "—";
  el("detail-upc").textContent = record.upc || "—";
  el("detail-original-ingredients").textContent = record.ingredients;
  el("detail-nutrition-notes").textContent = record.nutritionNotes || "—";
  el("detail-summary").textContent = generated.plainEnglishExplanation || "";
  el("detail-processed").textContent = (generated.homemadeAlternative?.whyLessProcessed || []).join(" ");
  el("detail-title").textContent = generated.homemadeAlternative?.title || "Homemade alternative";
  el("detail-confidence").textContent = `Confidence: ${generated.product?.confidence || "unknown"}`;

  el("detail-homemade-ingredients").innerHTML = (generated.homemadeAlternative?.ingredients || [])
    .map((item) => `<li>${item.amount || ""} ${item.item || ""} ${item.notes ? `(${item.notes})` : ""}</li>`)
    .join("");

  el("detail-steps").innerHTML = (generated.homemadeAlternative?.steps || []).map((step) => `<li>${step}</li>`).join("");

  el("detail-swaps").innerHTML = (generated.homemadeAlternative?.simpleSwaps || [])
    .map((swap) => `<li><strong>${swap.insteadOf}</strong> → ${swap.use}: ${swap.why}</li>`)
    .join("");

  el("detail-storage").textContent = generated.homemadeAlternative?.storageTips || "Store in an airtight container.";
  el("result-card").hidden = false;
}

async function handleGenerate(event) {
  event.preventDefault();
  clearError();
  el("result-card").hidden = true;
  el("save-status").textContent = "";

  const input = readManualForm();
  const validationError = validateManualInput(input);
  if (validationError) {
    showError(validationError);
    return;
  }

  const button = el("generate-btn");
  button.disabled = true;
  button.textContent = "Generating…";

  try {
    const { recipe, source } = await generateHomemadeAlternative(input);
    renderGeneratedResult({ ...input, generatedResult: recipe, favorite: false }, source);
  } catch (err) {
    console.error("Unexpected generation error", err);
    showError("We could not generate a homemade version right now. Please try again.");
  } finally {
    button.disabled = false;
    button.textContent = "Create Homemade Version";
  }
}

async function handleSaveResult() {
  if (!currentDraft) {
    showError("Please generate a homemade version first.");
    return;
  }

  if (currentSavedId) {
    el("save-status").textContent = "Already saved to History.";
    return;
  }

  try {
    const id = await saveMvpRecipe(currentDraft);
    if (!id) {
      el("save-status").textContent = "Could not save right now. Please try again.";
      return;
    }
    currentSavedId = id;
    currentDraft.id = id;
    el("save-status").textContent = "Saved to History.";
  } catch (err) {
    console.error("Save failed", err);
    el("save-status").textContent = "Could not save right now. Please try again.";
  }
}

export function initManualView() {
  if (bound) return;
  bound = true;

  el("manual-form")?.addEventListener("submit", handleGenerate);
  el("save-result-btn")?.addEventListener("click", handleSaveResult);
  el("back-to-history-btn")?.addEventListener("click", () => { window.location.hash = "#history"; });
  el("back-to-manual-btn")?.addEventListener("click", () => {
    el("manual-form").reset();
    el("result-card").hidden = true;
    el("save-status").textContent = "";
    currentDraft = null;
    currentSavedId = null;
  });
}

export async function renderHistoryView() {
  const list = el("history-list");
  const empty = el("history-empty");
  const error = el("history-error");
  list.innerHTML = "";
  error.hidden = true;

  try {
    const rows = await getMvpHistory();
    empty.hidden = rows.length > 0;

    for (const row of rows) {
      const li = document.createElement("li");
      li.className = "history-item";
      li.innerHTML = `
        <div class="history-head">
          <button class="link-btn" data-open="${row.id}">${row.productName || "Untitled product"}</button>
          <button class="btn btn-secondary btn-small" data-favorite="${row.id}">${row.favorite ? "★ Favorite" : "☆ Favorite"}</button>
        </div>
        <p class="history-sub">${row.brand || "No brand"} • ${new Date(row.createdAt).toLocaleString()}</p>
        <p class="history-summary">${row.generatedResult?.plainEnglishExplanation || "No summary available."}</p>
        <button class="btn btn-danger btn-small" data-delete="${row.id}">Delete</button>
      `;
      list.appendChild(li);
    }

    list.onclick = async (event) => {
      const target = event.target;
      const openId = target.dataset.open;
      const favoriteId = target.dataset.favorite;
      const deleteId = target.dataset.delete;

      if (openId) {
        window.location.hash = `#manual/${openId}`;
        return;
      }

      if (favoriteId) {
        const item = await getMvpRecipeById(favoriteId);
        if (!item) return;
        await toggleMvpFavorite(favoriteId, !item.favorite);
        await renderHistoryView();
        return;
      }

      if (deleteId) {
        const ok = await deleteMvpRecipe(deleteId);
        if (!ok) {
          error.hidden = false;
          error.textContent = "Could not delete this saved item. Please try again.";
          return;
        }
        await renderHistoryView();
      }
    };
  } catch (err) {
    console.error("History load failed", err);
    error.hidden = false;
    error.textContent = "We could not load history right now.";
  }
}

export async function openHistoryItem(id) {
  initManualView();
  const item = await getMvpRecipeById(id);
  if (!item) {
    showError("That saved item no longer exists.");
    return;
  }

  el("manual-upc").value = item.upc || "";
  el("manual-name").value = item.productName || "";
  el("manual-brand").value = item.brand || "";
  el("manual-category").value = item.category || "";
  el("manual-ingredients").value = item.ingredients || "";
  el("manual-nutrition").value = item.nutritionNotes || "";
  el("manual-notes").value = item.userNotes || "";

  renderGeneratedResult(item, "saved");
}
