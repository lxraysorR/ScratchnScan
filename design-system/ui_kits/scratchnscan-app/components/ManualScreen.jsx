// ManualScreen — simplified: take a front + back package photo, then generate.
// (The live app exposes tabbed input, but for this kit's flow the user wants
// a single clear path: photos in → recipe out.)

function ManualScreen({ form, setForm, onGenerate, onGo, onPickPopular, usageLine }) {
  const [photos, setPhotos] = React.useState({ front: null, back: null });
  const [detected, setDetected] = React.useState("");
  const [editingDetected, setEditingDetected] = React.useState(false);
  const autoFiredRef = React.useRef(false);

  // Faked photo "detection": once a photo is uploaded, the prototype acts as
  // if it read the package and identifies the product. The user can tap to
  // correct it before generation runs.
  const FAKE_DETECTION = "Pink salt potato chips";

  // Sync the detected name into form.name so generate() and recipeFor()
  // resolve to the right recipe (not a stale name from a previous session).
  React.useEffect(() => {
    if ((photos.front || photos.back) && !detected) {
      setDetected(FAKE_DETECTION);
    }
    if (!photos.front && !photos.back) {
      setDetected("");
    }
  }, [photos.front, photos.back, detected]);

  React.useEffect(() => {
    if (detected) setForm((f) => ({ ...f, name: detected }));
  }, [detected, setForm]);

  // Auto-generate once BOTH front and back photos are present.
  React.useEffect(() => {
    if (photos.front && photos.back && !autoFiredRef.current) {
      autoFiredRef.current = true;
      const t = setTimeout(() => {
        onGenerate();
      }, 900);
      return () => clearTimeout(t);
    }
  }, [photos.front, photos.back, onGenerate]);

  const handleFile = (slot) => (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotos((p) => ({ ...p, [slot]: url }));
  };

  const clearPhoto = (slot) => () => {
    autoFiredRef.current = false; // re-arm auto-fire if a photo is replaced
    setPhotos((p) => ({ ...p, [slot]: null }));
  };

  return (
    <section id="view-manual" className="screen" aria-label="Package entry">
      <button
        type="button"
        className="back-link"
        onClick={() => onGo("home")}
        aria-label="Back to home"
      >
        <span aria-hidden="true">‹</span> Back to home
      </button>

      <SectionHead
        title="Snap the package"
        sub="Add a front and back photo. We'll turn it into a cleaner homemade version with real ingredients."
      />

      {usageLine ? <p className="usage-strip" aria-live="polite">{usageLine}</p> : null}

      <form className="form-card manual-flow" onSubmit={(e)=>{e.preventDefault(); onGenerate();}} noValidate>
        <div className="photo-grid">
          {[
            ["front", "Add front photo", "Brand, product name, flavor"],
            ["back",  "Add back photo",  "Ingredients, nutrition, barcode"],
          ].map(([slot, t, d]) => (
            <div key={slot} className="photo-slot">
              <label className={"photo-tile" + (photos[slot] ? " has-photo" : "")} aria-label={`Add ${slot} photo`}>
                {photos[slot] ? (
                  <img className="photo-thumb" src={photos[slot]} alt="" />
                ) : (
                  <React.Fragment>
                    <span className="photo-icon" aria-hidden="true"><Icon name="image" size={22} /></span>
                    <strong>{t}</strong>
                    <em>{d}</em>
                  </React.Fragment>
                )}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: "none" }}
                  onChange={handleFile(slot)}
                />
              </label>
              {photos[slot] && (
                <div className="photo-actions">
                  <label className="photo-action-btn" style={{ textAlign: "center", cursor: "pointer" }}>
                    Replace
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      style={{ display: "none" }}
                      onChange={handleFile(slot)}
                    />
                  </label>
                  <button type="button" className="photo-action-btn is-danger" onClick={clearPhoto(slot)}>Remove</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {(photos.front || photos.back) && (
          <div className="detected-row" role="group" aria-label="Detected product">
            <span className="detected-label">Detected</span>
            {editingDetected ? (
              <input
                className="input detected-input"
                autoFocus
                value={detected}
                onChange={(e) => setDetected(e.target.value)}
                onBlur={() => setEditingDetected(false)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setEditingDetected(false); } }}
              />
            ) : (
              <button
                type="button"
                className="detected-value"
                onClick={() => setEditingDetected(true)}
                title="Tap to correct"
              >
                {detected || "Reading…"}
                <span className="detected-edit" aria-hidden="true">✎</span>
              </button>
            )}
          </div>
        )}

        <p className="helper" aria-live="polite" style={{ textAlign: "center", margin: 0 }}>
          {photos.front && photos.back
            ? "Both photos added — building your homemade version…"
            : photos.front || photos.back
              ? "Add the other photo to continue."
              : "Add a front and a back photo. We'll do the rest."}
        </p>

        <div className="form-actions" style={{ display: photos.front && photos.back ? "none" : "grid" }}>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={!photos.front || !photos.back}
            style={{ opacity: photos.front && photos.back ? 1 : 0.55 }}
          >
            Generate Homemade Version
          </button>
        </div>
      </form>

      <div>
        <SectionHead title="Or pick a popular starter" sub="Tap any to skip the photo step." />
        <div className="chip-row" aria-label="Popular packaged foods">
          {POPULAR.map((name) => (
            <Chip key={name} label={name} onClick={() => onPickPopular(name)} />
          ))}
        </div>
      </div>
    </section>
  );
}

window.ManualScreen = ManualScreen;
