// Section heading used everywhere.
function SectionHead({ title, sub }) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      {sub && <p>{sub}</p>}
    </div>
  );
}

// Pill / chip for popular starters.
function Chip({ label, onClick }) {
  return (
    <button className="chip" type="button" onClick={onClick}>{label}</button>
  );
}

// Result badge — tinted pill.
function Badge({ children, tone }) {
  const cls = "badge" + (tone ? " " + tone : "");
  return <span className={cls}>{children}</span>;
}

window.SectionHead = SectionHead;
window.Chip = Chip;
window.Badge = Badge;
