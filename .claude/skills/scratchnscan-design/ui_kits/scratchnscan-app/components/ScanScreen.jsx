// ScanScreen — interactive barcode scanner prototype.
// Tap "Start scanner" → ~1.5s scanning animation → product is "detected"
// (picked from the popular list) → routes to GenerationProgress with the
// product name auto-filled. No typing required.

function ScanScreen({ onGo, onScanComplete }) {
  const [state, setState] = React.useState("idle"); // idle | scanning | found
  const [found, setFound] = React.useState(null);
  const timerRef = React.useRef(null);

  React.useEffect(() => () => clearTimeout(timerRef.current), []);

  const startScan = () => {
    setState("scanning");
    setFound(null);
    timerRef.current = setTimeout(() => {
      // Pick a different popular product each time
      const pick = POPULAR[Math.floor(Math.random() * POPULAR.length)];
      setFound(pick);
      setState("found");
      // Auto-continue after a beat so the user sees what we found
      timerRef.current = setTimeout(() => onScanComplete(pick), 900);
    }, 1500);
  };

  const cancelScan = () => {
    clearTimeout(timerRef.current);
    setState("idle");
    setFound(null);
  };

  const isScanning = state === "scanning";
  const isFound = state === "found";

  return (
    <section id="view-scan" className="screen" aria-label="Scan a package">
      <SectionHead
        title="Scan a package"
        sub="Point the camera at the barcode on the back of the package."
      />

      <div className="scan-card">
        <div className={"scan-preview" + (isScanning ? " is-scanning" : "") + (isFound ? " is-found" : "")} aria-hidden="true">
          <div className="scan-frame">
            {state === "idle" && <span>Tap Start scanner to begin</span>}
            {isScanning && <span>Scanning…</span>}
            {isFound && (
              <span style={{ color: "#0b2f27" }}>
                <strong style={{ display: "block", fontSize: 15, marginBottom: 4 }}>Found it</strong>
                {found}
              </span>
            )}
          </div>
          {(isScanning || state === "idle") && <div className="scan-line" />}
        </div>

        <div className="scan-actions">
          {!isScanning && !isFound && (
            <React.Fragment>
              <button className="btn btn-primary" type="button" onClick={startScan}>
                Start scanner
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => onGo("manual")}>
                Use photos instead
              </button>
            </React.Fragment>
          )}
          {isScanning && (
            <button className="btn btn-ghost" type="button" onClick={cancelScan} style={{ gridColumn: "1 / -1" }}>
              Cancel
            </button>
          )}
          {isFound && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", color: "var(--green)", fontWeight: 700, fontSize: 13 }}>
              Building your homemade version…
            </div>
          )}
        </div>
        <p className="helper">Camera scanner beta. Manual entry is always available.</p>
      </div>

      <SectionHead
        title="What happens after a scan"
        sub="The app reads the package, then generates a homemade alternative."
      />
      <ul className="feature-list" role="list">
        <li className="feature-card">
          <span className="feature-icon" aria-hidden="true"><Icon name="search" size={22} /></span>
          <div>
            <h3>Identify the product</h3>
            <p>Name, brand, category, and ingredient signals become the recipe context.</p>
          </div>
        </li>
        <li className="feature-card">
          <span className="feature-icon" aria-hidden="true"><Icon name="bowl" size={22} /></span>
          <div>
            <h3>Generate the homemade version</h3>
            <p>Ingredients, steps, and smart swaps tuned to your preference.</p>
          </div>
        </li>
      </ul>
    </section>
  );
}

window.ScanScreen = ScanScreen;
