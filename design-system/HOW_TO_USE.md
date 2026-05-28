# How to use this folder

Drop this whole `design-system/` folder into the root of your
`lxraysorR/ScratchnScan` repo, then commit:

```bash
# from the root of your local ScratchnScan clone
mv ~/Downloads/design-system ./design-system
git add design-system
git commit -m "Add design system: brand foundations, tokens, UI kit"
git push
```

## What's inside

- `README.md` — full design-system documentation (voice, visual foundations, iconography, index)
- `SKILL.md` — Claude Code-compatible skill manifest (drop this folder under `.claude/skills/scratchnscan-design/` if you want Claude Code to auto-load the brand guidelines)
- `colors_and_type.css` — design tokens (CSS custom properties)
- `assets/` — brand mark, wordmark tile, 24×24 icon SVGs
- `preview/` — small HTML cards used to visualize each token in isolation
- `ui_kits/scratchnscan-app/` — interactive React/JSX prototype of the mobile app

## Independence

This folder is **standalone** — it doesn't reference your live `app/` folder
at all. Tokens, assets, and the UI kit are self-contained so you can move,
rename, or split it however you want.

## What it does NOT change

This folder is **additive**. It does not modify `app/`, `docs/`, `src/`,
`scripts/`, or anything else in your existing repo. The UI kit at
`design-system/ui_kits/scratchnscan-app/` is a separate prototype, not a
replacement for the live MVP — it lives alongside.
