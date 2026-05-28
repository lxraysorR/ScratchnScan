// App.jsx — top-level state & view routing for the ScratchnScan UI kit prototype.

function useToast() {
  const [msg, setMsg] = React.useState(null);
  const tRef = React.useRef(null);
  const show = (text) => {
    setMsg(text);
    if (tRef.current) clearTimeout(tRef.current);
    tRef.current = setTimeout(() => setMsg(null), 2200);
  };
  const node = msg ? <div className="toast is-show" role="status" aria-live="polite">{msg}</div> : null;
  return [show, node];
}

function App() {
  const [view, setView] = React.useState("home");
  const [manualTab, setManualTab] = React.useState("typed");
  const [form, setForm] = React.useState({ name: "", preference: "", ingredients: "" });
  const [usageCount, setUsageCount] = React.useState(0);   // successful creations
  const [saved, setSaved] = React.useState([]);
  const [currentRecipe, setCurrentRecipe] = React.useState(null);
  const [showToast, toastNode] = useToast();

  const remaining = Math.max(0, 10 - usageCount);
  const usageLine = remaining === 10
    ? "10 free homemade creations included on this device."
    : remaining === 0
      ? "You've used all 10 free creations. Upgrade to keep creating."
      : `${remaining} free creation${remaining === 1 ? "" : "s"} left on this device.`;

  const go = (next, opts = {}) => {
    if (opts.tab) setManualTab(opts.tab);
    setView(next);
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  };

  const pickPopular = (name) => {
    setForm({ name, preference: "less processed", ingredients: "" });
    setManualTab("typed");
    setView("manual");
    showToast(`Prefilled: ${name}`);
  };

  const generate = () => {
    if (remaining === 0) {
      go("upgrade");
      return;
    }
    // Photos-only flow: if no name was set (e.g. user uploaded a photo without
    // typing), use a friendly placeholder so the deterministic recipe library
    // can still resolve to the default homemade recipe.
    if (!form.name.trim()) {
      setForm((f) => ({ ...f, name: "Packaged food" }));
    }
    setView("progress");
  };

  const finishGenerate = React.useCallback(() => {
    const recipe = recipeFor(form.name);
    // If the user came via photos and we set the placeholder "Packaged food",
    // show a friendlier "Captured from your package photos" subtitle instead.
    const isPlaceholder = form.name === "Packaged food";
    const original = isPlaceholder ? "Captured from your package photos" : form.name;
    setCurrentRecipe({ ...recipe, original });
    setUsageCount((n) => n + 1);
    setView("result");
  }, [form.name]);

  const saveRecipe = () => {
    if (!currentRecipe) return;
    const id = "r" + Date.now();
    setSaved((s) => [{ id, fav: false, ...currentRecipe }, ...s]);
    showToast("Saved to your ideas");
    go("history");
  };

  const openRecipe = (rec) => {
    setCurrentRecipe(rec);
    go("result");
  };

  const toggleFav = (id) => {
    setSaved((s) => s.map((r) => r.id === id ? { ...r, fav: !r.fav } : r));
  };

  const onMore = () => go("upgrade");

  const handleScanComplete = (productName) => {
    if (remaining === 0) {
      go("upgrade");
      return;
    }
    setForm((f) => ({ ...f, name: productName }));
    setView("progress");
  };

  let body = null;
  if (view === "home") {
    body = (
      <HomeScreen
        usageLine={usageLine}
        onGo={go}
        onPickPopular={pickPopular}
      />
    );
  } else if (view === "scan") {
    body = <ScanScreen onGo={go} onScanComplete={handleScanComplete} />;
  } else if (view === "manual") {
    body = (
      <ManualScreen
        initialTab={manualTab}
        form={form}
        setForm={setForm}
        onGenerate={generate}
        onGo={go}
        onPickPopular={pickPopular}
        usageLine={usageLine}
      />
    );
  } else if (view === "progress") {
    body = <GenerationProgress onDone={finishGenerate} />;
  } else if (view === "result") {
    body = currentRecipe
      ? <ResultScreen recipe={currentRecipe} onSave={saveRecipe} onGo={go} usageLine={usageLine} />
      : null;
  } else if (view === "history") {
    body = <HistoryScreen saved={saved} onOpen={openRecipe} onGo={go} onToggleFav={toggleFav} />;
  } else if (view === "upgrade") {
    body = <UpgradeScreen onGo={go} />;
  }

  // Map current view to nav tab. Manual / progress / result share the "scan"
  // entry point in the bottom nav since the simplified manual flow IS the photo
  // capture step that follows a scan.
  const navActive =
    view === "progress" || view === "result" || view === "manual" ? "scan" : view;

  return (
    <div className="app">
      <Topbar onMore={onMore} onHome={() => go("home")} />
      <main id="main-content" className="main">{body}</main>
      <BottomNav active={navActive} onNavigate={(id) => go(id)} />
      {toastNode}
    </div>
  );
}

window.App = App;
