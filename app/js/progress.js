// Reusable staged-progress component for the "Generate Homemade Version" flow.
// Renders a small warm-card checklist with a pulse/spinner and an advancing
// active stage, and owns its own timer so callers only have to start()/stop().
// Kept DOM-only (no network/state imports) so it is easy to unit test.

export const GENERATION_STAGES = [
  {
    title: "Reading product details…",
    detail: "Checking product name, photos, ingredients, and preferences.",
  },
  {
    title: "Identifying food type…",
    detail: "Finding the base ingredient, flavor, and best homemade method.",
  },
  {
    title: "Creating real ingredients…",
    detail: "Replacing placeholders with actual pantry ingredients.",
  },
  {
    title: "Writing step-by-step instructions…",
    detail: "Making the recipe clear before showing it.",
  },
  {
    title: "Finalizing your homemade version…",
    detail: "Preparing the result for review and saving.",
  },
];

// Returns a controller with start()/advance()/stop(). All methods are safe to
// call even when `container` is missing, so callers never have to null-check.
export function createGenerationProgress(container, options = {}) {
  const stages = options.stages || GENERATION_STAGES;
  const intervalMs = options.intervalMs || 2000;
  if (!container) {
    return { start() {}, advance() {}, stop() {} };
  }

  let timer = null;
  let index = 0;

  container.innerHTML = "";
  container.classList.add("generation-progress");

  const head = document.createElement("div");
  head.className = "gp-head";
  const pulse = document.createElement("span");
  pulse.className = "gp-pulse spinner";
  pulse.setAttribute("aria-hidden", "true");
  const headText = document.createElement("div");
  headText.className = "gp-head-text";
  const title = document.createElement("strong");
  title.className = "gp-title";
  const detail = document.createElement("span");
  detail.className = "gp-detail";
  headText.append(title, detail);
  head.append(pulse, headText);

  const list = document.createElement("ol");
  list.className = "gp-stages";
  const items = stages.map((stage, i) => {
    const li = document.createElement("li");
    li.className = "gp-stage";
    const mark = document.createElement("span");
    mark.className = "gp-mark";
    mark.textContent = String(i + 1);
    const label = document.createElement("span");
    label.className = "gp-stage-label";
    label.textContent = stage.title.replace(/…$/, "");
    li.append(mark, label);
    list.appendChild(li);
    return { li, mark };
  });
  const note = document.createElement("p");
  note.className = "gp-note";
  note.textContent = "This usually takes a few seconds. Your details stay here if we need you to review anything.";
  container.append(head, list, note);

  function render() {
    const stage = stages[index] || stages[stages.length - 1];
    title.textContent = stage.title;
    detail.textContent = stage.detail;
    items.forEach(({ li, mark }, i) => {
      const done = i < index;
      li.classList.toggle("is-done", done);
      li.classList.toggle("is-active", i === index);
      mark.textContent = done ? "✓" : String(i + 1);
    });
  }

  function advance() {
    if (index < stages.length - 1) {
      index += 1;
      render();
    }
  }

  return {
    start() {
      index = 0;
      render();
      if (timer) clearInterval(timer);
      // Hold on the final stage until generation actually finishes, rather than
      // looping, so the checklist reads as steady forward progress.
      timer = setInterval(advance, intervalMs);
    },
    advance,
    stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    },
  };
}
