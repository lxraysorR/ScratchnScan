function createLabelTip({ title = "Label tip", body, defaultOpen = false }, doc = document) {
  const wrapper = doc.createElement("section");
  wrapper.className = "label-tip";

  const button = doc.createElement("button");
  button.type = "button";
  button.className = "label-tip-toggle";
  button.setAttribute("aria-expanded", defaultOpen ? "true" : "false");

  const header = doc.createElement("span");
  header.className = "label-tip-header";

  const icon = doc.createElement("span");
  icon.className = "label-tip-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "i";

  const heading = doc.createElement("strong");
  heading.textContent = title;

  const chevron = doc.createElement("span");
  chevron.className = "label-tip-chevron";
  chevron.setAttribute("aria-hidden", "true");
  chevron.textContent = "▾";

  header.append(icon, heading);
  button.append(header, chevron);

  const bodyEl = doc.createElement("div");
  bodyEl.className = "label-tip-body";
  bodyEl.hidden = !defaultOpen;
  bodyEl.innerHTML = body;

  button.addEventListener("click", () => {
    const expanded = button.getAttribute("aria-expanded") === "true";
    const next = !expanded;
    button.setAttribute("aria-expanded", String(next));
    bodyEl.hidden = !next;
  });

  wrapper.append(button, bodyEl);
  return wrapper;
}

export function renderLabelLiteracyTips(doc = document) {
  const mounts = [
    {
      id: "home-label-tip-slot",
      title: "Label tip",
      body: "<p>Front photo usually helps us read the product name, brand, flavor, and package claims. Back label usually helps us understand ingredients, nutrition facts, allergens, serving size, and label claims.</p>",
      defaultOpen: false,
    },
    {
      id: "manual-photo-label-tip-slot",
      title: "Why this matters",
      body: "<p>Food labels usually have two helpful parts. The front tells us what the product is trying to sell you. The back tells us what is actually inside.</p>",
      defaultOpen: false,
    },
    {
      id: "manual-ingredient-label-tip-slot",
      title: "Label tip",
      body: "<p>For the best homemade version, add the ingredient list when you can. It can help us match texture, flavor, and pantry-friendly swaps more closely.</p>",
      defaultOpen: false,
    },
    {
      id: "result-label-tip-slot",
      title: "Quick label lesson",
      body: "<p>We use label details to make the homemade version more specific. Ingredients matter most because they show what the food is made from. Product name helps us choose recipe style, and nutrition facts can help guide oil, salt, sugar, and serving-size decisions. Front-label claims like \"gluten free\" or \"non-GMO\" can be useful, but they should not replace reading the ingredient list.</p><p class=\"label-tip-footnote\">General food information only.</p>",
      defaultOpen: true,
    },
  ];

  for (const config of mounts) {
    const slot = doc.getElementById(config.id);
    if (!slot) continue;
    slot.innerHTML = "";
    slot.appendChild(createLabelTip(config, doc));
  }
}

export { createLabelTip };
