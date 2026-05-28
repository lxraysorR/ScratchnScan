// Hero — green gradient card with eyebrow, title, sub, two CTAs, usage strip.

function Hero({ usageLine, onPrimary, onSecondary }) {
  return (
    <div className="hero">
      <span className="eyebrow">Homemade alternatives in seconds</span>
      <h1 className="hero-title">Pick how you want to start.</h1>
      <p className="hero-sub">
        Scan a barcode, upload the front and back of a package, or type the product
        name and ingredients. ScratchnScan turns it into a cleaner homemade version
        with real ingredients and clear steps.
      </p>
      <div className="hero-actions">
        <button className="btn btn-primary" type="button" onClick={onPrimary}>
          Create Homemade Version
        </button>
        <button className="btn btn-ghost-light" type="button" onClick={onSecondary}>
          View Saved Recipes
        </button>
      </div>
      <p className="hero-usage">{usageLine || "10 free homemade creations included on this device."}</p>
    </div>
  );
}

window.Hero = Hero;
