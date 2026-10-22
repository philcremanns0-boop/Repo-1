# Regeln für dieses Projekt

- **Keine Emojis – nirgends** (Oberfläche, Texte, Schilder, README, Commit-Beispiele in der App). Auf iPhone, iPad, Android und Desktop immer
  **SVG-Icons** verwenden. Neue Icons kommen nach `src/icons.js` und werden im HTML per `data-icon="name"` eingesetzt.
  Auch Zeichen, die Browser als Emoji darstellen können (Smiley-, Herz- oder Haken-Zeichen), vermeiden.
- Typografische Zeichen (· – „ “ ° ≈) sind in Ordnung.
- Texte immer dreisprachig (`en`, `de`, `es`/Chile) in `src/i18n.js` bzw. `src/config.js`.
- Kein Build-Schritt für Medien: Fotos/Video/Musik liegen fertig komprimiert unter `src/photos`, `src/media`.
