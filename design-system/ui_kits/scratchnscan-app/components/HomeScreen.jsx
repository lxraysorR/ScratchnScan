// HomeScreen — hero + start cards + popular chips.

const POPULAR = [
  "Doritos Cool Ranch",
  "Oreos",
  "Kraft Mac and Cheese",
  "Pop-Tarts",
  "Honey Nut Cheerios",
];

function HomeScreen({ usageLine, onGo, onPickPopular }) {
  return (
    <section id="view-home" className="screen" aria-label="Home">
      <Hero
        usageLine={usageLine}
        onPrimary={() => onGo("manual")}
        onSecondary={() => onGo("history")}
      />

      <SectionHead
        title="Start with one clear path"
        sub="Separate scanner, photos, and manual details so it never feels like one crowded form."
      />

      <nav className="start-grid" aria-label="Ways to start">
        <StartCard
          icon="scan"
          title="Scan Barcode"
          desc="Use the camera to identify a packaged food."
          onClick={() => onGo("scan")}
        />
        <StartCard
          icon="image"
          title="Upload Package Photos"
          desc="Add front package and back label photos."
          onClick={() => onGo("manual", { tab: "photos" })}
        />
        <StartCard
          icon="pencil"
          title="Type Product Details"
          desc="Enter product name, ingredients, and preferences."
          onClick={() => onGo("manual", { tab: "typed" })}
        />
        <StartCard
          icon="spark"
          title="Popular Right Now"
          desc="Start from a trending packaged food."
          accent
          onClick={() => onGo("manual", { tab: "typed" })}
        />
      </nav>

      <SectionHead
        title="Popular right now"
        sub="Based on recent successful lookups and homemade generations."
      />
      <div className="chip-row" aria-label="Popular packaged foods">
        {POPULAR.map((name) => (
          <Chip key={name} label={name} onClick={() => onPickPopular(name)} />
        ))}
      </div>
    </section>
  );
}

window.HomeScreen = HomeScreen;
window.POPULAR = POPULAR;
