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
- **Tokens** live in `tailwind.config.js` (`gn.*`) and are mirrored as CSS variables in `src/index.css`.
  - Sampled from the official app logo: Teal I `#02BDE4`, Ink I `#0F1010`, Eraser I `#F7F7F7`.
  - Navy `#0A192F`: value from the design brief.
  - Teal II/III, Ink II/III, Eraser II, Matcha, Sky, Kale, Merlot, Lavender, Candy Floss: derived placeholders — the official Brandpad swatches (brandpad.io/goodnotes-guidelines) were not readable from the build environment. Swap the hex values in one place when you have them.
  - `gn.ui.*`: values measured from the reference iPad screenshots (toolbar navy, selection blue …).
- **Type:** Roobert (local, commercial) → Inter (Google Fonts) → bundled Inter Variable → Noto Sans. Body uses −0.02em tracking, 1.2 line-height and grayscale antialiasing (`.gn-text`, `.gn-title`).
- **Motion:** one spring (`stiffness 400, damping 30`, `src/components/motion.ts`) for popovers (scale from the tapped icon), sheets, nested menu push/pop and sliding selection tiles; page slide/fade follows the scroll axis.
- **Toolbar:** Settings → Werkzeugleiste → Angedockt (reference layout) or Schwebend (frosted pill: rounded-full, px-4 py-2, backdrop-blur-xl, bg-white/80, layered shadow).
- **Icons:** all inline SVG (`src/components/icons.tsx`, `src/components/glyphs.tsx`); no icon library.
