// UpgradeScreen — friendly paywall after 10 free creations.

function UpgradeScreen({ onGo }) {
  return (
    <section id="view-upgrade" className="screen" aria-label="Upgrade ScratchnScan">
      <article className="upgrade-card">
        <span className="eyebrow">ScratchnScan Plus</span>
        <h2 className="upgrade-title">Keep creating homemade swaps</h2>
        <p className="upgrade-body">
          You’ve used your 10 free ScratchnScan creations. Upgrade to keep turning
          packaged foods into homemade recipes.
        </p>
        <div className="upgrade-offer">
          <div className="upgrade-offer-row">
            <strong>$4.99</strong><span>/ month</span>
          </div>
          <div className="upgrade-offer-row subtle">
            <strong>$29.99</strong><span>/ year</span>
          </div>
          <p className="helper upgrade-offer-note">Placeholder pricing. No payment is collected today.</p>
        </div>
        <div className="form-actions">
          <button className="btn btn-gold" type="button">Upgrade coming soon</button>
          <button className="btn btn-ghost" type="button" onClick={() => onGo("history")}>View saved ideas</button>
          <button className="btn btn-ghost" type="button" onClick={() => onGo("manual")}>Edit existing recipes</button>
        </div>
        <p className="disclaimer">No account or signup required. Your 10 free creations live on this device.</p>
      </article>
    </section>
  );
}

window.UpgradeScreen = UpgradeScreen;
