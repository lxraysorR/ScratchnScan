import { generateHomemadeAlternative } from "./api.js";
import { saveMvpRecipe, getMvpHistory, getMvpRecipeById, deleteMvpRecipe, toggleMvpFavorite } from "./localDb.js";

function el(id) { return document.getElementById(id); }

export function initResultView(product) {
  const p = product ?? lastLookupResult;
  if (!p) {
    window.location.hash = "#scan";
    return;
  }

  el("result-name").textContent = p.manualLookup?.productTitle || p.productName || "Unknown product";
  el("result-upc").textContent = p.upc ? `UPC: ${p.upc}` : "Manual entry";
  el("result-source").textContent = `Source: ${p.manualLookup?.source || p.source || "unknown"}`;

  el("result-summary").textContent = p.manualLookup?.productSummary || "Packaged product identified.";
  const concerns = p.manualLookup?.concerns?.length
    ? p.manualLookup.concerns.join(" ")
    : "Packaged versions may include extra additives compared with homemade options.";
  el("result-concerns").textContent = concerns;
  el("result-recipe-title").textContent = p.manualLookup?.homemadeAlternativeTitle || "Simple homemade alternative";

  const ingredients = p.manualLookup?.homemadeIngredients || [];
  const ingList = el("result-homemade-ingredients");
  ingList.innerHTML = "";
  for (const item of ingredients) {
    const li = document.createElement("li");
    li.textContent = item;
    ingList.appendChild(li);
  }
}

  const steps = p.manualLookup?.homemadeSteps || [];
  const stepsList = el("result-homemade-steps");
  stepsList.innerHTML = "";
  for (const item of steps) {
    const li = document.createElement("li");
    li.textContent = item;
    stepsList.appendChild(li);
  }

  const note = p.manualLookup?.note;
  el("result-confidence").textContent = `Confidence: ${p.manualLookup?.confidenceLevel || "medium"}`;
  el("result-note").textContent = note || "";
  el("result-note").hidden = !note;

  el("result-scan-another-btn").onclick = () => { window.location.hash = "#scan"; };
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
