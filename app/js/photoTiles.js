// Pure DOM helper: reflect a selected (or cleared) package photo into its tile.
// Extracted from scan.js so the preview/replace/remove behavior is testable in
// isolation without booting the whole app module graph.

export function applyThumbToTile(which, dataUrl, root = (typeof document !== "undefined" ? document : null)) {
  if (!root) return;
  const slot = root.querySelector(`.photo-slot[data-photo="${which}"]`);
  if (!slot) return;
  const tile = slot.querySelector(".photo-tile");
  const img = slot.querySelector(".photo-thumb");
  const actions = slot.querySelector(`[data-photo-actions="${which}"]`);
  if (dataUrl) {
    if (img) {
      img.src = dataUrl;
      img.alt = which === "front" ? "Front package preview" : "Back label preview";
      img.hidden = false;
    }
    tile?.classList.add("has-photo");
    tile?.setAttribute("aria-label", which === "front" ? "Replace front package photo" : "Replace back label photo");
    if (actions) actions.hidden = false;
  } else {
    if (img) {
      img.removeAttribute("src");
      img.alt = "";
      img.hidden = true;
    }
    tile?.classList.remove("has-photo");
    tile?.setAttribute("aria-label", which === "front" ? "Add front package photo" : "Add back label photo");
    if (actions) actions.hidden = true;
  }
}
