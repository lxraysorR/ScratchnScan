// GenerationProgress — staged checklist that runs through 4 steps then resolves.

const STAGES = [
  { title: "Reading package details", detail: "Checking product name, photos, ingredients, and preferences." },
  { title: "Identifying food type",   detail: "Finding the base ingredient, flavor, and homemade method." },
  { title: "Creating real ingredients", detail: "Building a natural pantry ingredient list." },
  { title: "Writing step-by-step instructions", detail: "Making sure the recipe is clear before showing it." },
];

function GenerationProgress({ onDone, stepMs = 700 }) {
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    if (idx >= STAGES.length) { onDone(); return; }
    const t = setTimeout(() => setIdx((i) => i + 1), stepMs);
    return () => clearTimeout(t);
  }, [idx, stepMs, onDone]);

  const current = STAGES[Math.min(idx, STAGES.length - 1)];
  return (
    <section className="screen" aria-label="Generating">
      <SectionHead title="Building your homemade version" sub="A few seconds — we keep it light." />
      <div className="form-card">
        <div className="generation-progress">
          <div className="gp-head">
            <div className="spinner gp-pulse" aria-hidden="true" />
            <div className="gp-head-text">
              <div className="gp-title">{current.title}…</div>
              <div className="gp-detail">{current.detail}</div>
            </div>
          </div>
          <ul className="gp-stages">
            {STAGES.map((s, i) => {
              const state = i < idx ? "is-done" : i === idx ? "is-active" : "";
              return (
                <li key={i} className={"gp-stage " + state}>
                  <span className="gp-mark">{i < idx ? "✓" : i + 1}</span>
                  <span>{s.title}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

window.GenerationProgress = GenerationProgress;
