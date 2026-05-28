// HistoryScreen — saved recipe cards or empty state.

function HistoryScreen({ saved, onOpen, onGo, onToggleFav }) {
  if (!saved || saved.length === 0) {
    return (
      <section id="view-history" className="screen" aria-label="Saved ideas">
        <SectionHead title="Saved ideas" sub="Your local recipe playbook for cleaner homemade swaps." />
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true"><Icon name="emptyBowl" size={28} /></div>
          <h3>No saved recipes yet</h3>
          <p>Create your first homemade version.</p>
          <button className="btn btn-primary" type="button" onClick={() => onGo("manual")}>
            Create first recipe
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="view-history" className="screen" aria-label="Saved ideas">
      <SectionHead title="Saved ideas" sub="Your local recipe playbook for cleaner homemade swaps." />
      <ul className="history-list" role="list">
        {saved.map((rec) => (
          <li className="history-card" key={rec.id}>
            <div className="history-top">
              <span className="food-thumb" aria-hidden="true"><Icon name="bowl" size={22} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3>{rec.name}</h3>
                <p>{rec.original}</p>
                <div className="history-meta-row">
                  {rec.badges.slice(0, 2).map(([t, tone], i) => <Badge key={i} tone={tone}>{t}</Badge>)}
                </div>
              </div>
            </div>
            <div className="history-actions">
              <button className="btn btn-ghost btn-small" type="button" onClick={() => onOpen(rec)}>
                Open recipe
              </button>
              <button
                className={"fav-btn" + (rec.fav ? " is-on" : "")}
                type="button"
                aria-label="Favorite"
                onClick={() => onToggleFav(rec.id)}
              >
                <Icon name="star" size={18} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

window.HistoryScreen = HistoryScreen;
