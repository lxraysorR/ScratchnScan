// ResultScreen — homemade recipe view with badges, quick facts, ingredients, steps, tips.

function ResultScreen({ recipe, onSave, onGo, usageLine }) {
  return (
    <section id="view-result" className="screen" aria-label="Generated homemade recipe">
      <article className="result-card result-shell">
        <div className="badge-row">
          {recipe.badges.map(([t, tone], i) => (
            <Badge key={i} tone={tone}>{t}</Badge>
          ))}
        </div>
        <h2 className="result-title">{recipe.name}</h2>
        <p className="result-original">{recipe.original}</p>
        <p className="result-summary">{recipe.summary}</p>

        <div className="quick-facts">
          {recipe.quickFacts.map(([label, val], i) => (
            <div className="quick-fact" key={i}>
              <span>{label}</span>
              <strong>{val}</strong>
            </div>
          ))}
        </div>

        {recipe.why && recipe.why.length > 0 && (
          <section className="recipe-block">
            <h3>Why this is cleaner</h3>
            <ul className="bullet-list">
              {recipe.why.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </section>
        )}

        <section className="recipe-block">
          <h3>Ingredients</h3>
          <ul className="bullet-list">
            {recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
          </ul>
        </section>

        <section className="recipe-block">
          <h3>Steps</h3>
          <ol className="step-list">
            {recipe.steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </section>

        {recipe.tips && recipe.tips.length > 0 && (
          <section className="recipe-block">
            <h3>Smart swaps &amp; tips</h3>
            <ul className="bullet-list">
              {recipe.tips.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </section>
        )}

        <p className="disclaimer">General food information only. Not medical or dietary advice.</p>
      </article>

      {usageLine ? <p className="usage-strip" aria-live="polite">{usageLine}</p> : null}

      <div className="sticky-action-bar">
        <button className="btn btn-ghost" type="button" onClick={() => onGo("manual")}>Edit details</button>
        <button className="btn btn-primary" type="button" onClick={onSave}>Save Recipe</button>
      </div>
      <div className="form-actions secondary-actions">
        <button className="btn btn-ghost" type="button" onClick={() => onGo("manual")}>Make Another</button>
        <button className="btn btn-ghost" type="button" onClick={() => onGo("history")}>View History</button>
      </div>
    </section>
  );
}

window.ResultScreen = ResultScreen;
