// Topbar — sticky cream-fade header with brand lockup + more menu.

function Topbar({ onMore, onHome }) {
  return (
    <header className="topbar">
      <a
        href="#home"
        className="brand"
        aria-label="ScratchnScan home"
        onClick={(e) => { e.preventDefault(); onHome && onHome(); }}
      >
        <span className="brand-mark" aria-hidden="true">
          <BrandMark size={28} />
        </span>
        <span className="brand-text">
          <span className="brand-name">ScratchnScan</span>
          <span className="brand-tagline">Scan it. Scratch-make it.</span>
        </span>
      </a>
      <button className="icon-btn" type="button" aria-label="More options" onClick={onMore}>
        <Icon name="dots" size={20} />
      </button>
    </header>
  );
}

window.Topbar = Topbar;
