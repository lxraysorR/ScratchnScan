// StartCard — one of the home-flow choice rows.

function StartCard({ icon, title, desc, accent, onClick }) {
  return (
    <button
      className={"start-card" + (accent ? " accent" : "")}
      type="button"
      onClick={onClick}
    >
      <span className="start-icon" aria-hidden="true"><Icon name={icon} size={22} /></span>
      <span className="start-text">
        <span className="start-card-title">{title}</span>
        <span className="start-card-desc">{desc}</span>
      </span>
      <span className="start-arrow" aria-hidden="true">›</span>
    </button>
  );
}

window.StartCard = StartCard;
