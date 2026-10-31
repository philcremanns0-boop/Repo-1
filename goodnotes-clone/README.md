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
