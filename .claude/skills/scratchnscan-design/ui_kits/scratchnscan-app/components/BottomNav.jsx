// BottomNav — fixed glass nav with 4 items.

function BottomNav({ active, onNavigate }) {
  const items = [
    { id: "home",    label: "Home",  icon: "home" },
    { id: "scan",    label: "Scan",  icon: "scan" },
    { id: "history", label: "Saved", icon: "star" },
  ];
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {items.map((it) => (
        <button
          key={it.id}
          className={"nav-item" + (active === it.id ? " is-active" : "")}
          type="button"
          onClick={() => onNavigate(it.id)}
        >
          <span className="nav-icon" aria-hidden="true"><Icon name={it.icon} size={22} /></span>
          <span className="nav-label">{it.label}</span>
        </button>
      ))}
    </nav>
  );
}

window.BottomNav = BottomNav;
