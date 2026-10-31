# Notizen – iPad-style notebook UI (React · Vite · Tailwind · lucide-react)

Unofficial UI recreation of a tablet note-taking app. Everything is stored locally in the browser (`localStorage`); there is no account or server.

```
npm install
npm run dev      # development
npm run build    # type-check + production build
```

- **Library**: notebooks with cover + paper template picker, trash, backup/restore (JSON).
- **Editor**: tabs, toolbar (lasso, pen types, eraser, text, objects, images, shapes, sticky notes, laser), floating option bar, popovers, customisable toolbar, sidebar (pages / outlines / audio), multi-page notebooks, PDF export/print.
- **Themes**: light / dark / system via the settings menu (library gear, or *More → Settings* in the editor), plus scroll direction and language (DE/EN).
- Not available in the web version: collaboration, handwriting/equation recognition, AI summaries, Apple-Pencil gestures.

## Design tokens, type & motion
- **Typeface:** `Roobert` is used when installed locally (it is a commercial font and is not bundled); otherwise the bundled Inter Variable, tuned with slightly tighter tracking. `Goodnotes Hand` likewise loads locally, with Caveat as the bundled fallback.
- **Palette:** `--gn-navy`, `--gn-teal-1…3`, `--gn-ink`, `--gn-eraser`, `--gn-matcha`, `--gn-sky`, `--gn-lavender`, `--gn-candy` in `src/index.css` (Tailwind: `gn-*`). Values are sampled from reference screenshots; no official Goodnotes hex values were publicly available.
- **Motion:** Framer Motion springs for popovers (scale from the anchor icon), sheets, nested menu push/pop, sliding active-tool highlight and page slide/fade along the scroll axis.
- **Toolbar:** Settings → Werkzeugleiste → Angedockt (as in the reference) or Schwebend (floating pill).
