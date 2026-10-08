# Pad Sampler – Plan

Ziel: MPC-artiger 4×4-Sampler als installierbare Web-App (PWA) für Handy und iPad, gratis, Vercel-ready.

## Recherche-Ergebnisse (kurz)
- Referenzgerät im Video: 4×4 Pads mit blauer Beleuchtung, aktives Pad leuchtet gelb, LCD mit Waveform, Fader/Knöpfe. → UI-Vorbild.
- Kanye-Stil: "Chipmunk Soul" = Soul-Vocal-Samples höher/schneller abspielen (Pitch+Speed gekoppelt). → Pitch-Regler über `playbackRate`, Quick-Buttons für Chipmunk. Song "chopen" in 16 Slices.
- Rechtliches: Original-Songs/Stems sind urheberrechtlich geschützt (Bound-2-Klage 2015). → Nicht mitliefern. User importiert eigene Dateien (lokal, IndexedDB). Mitgeliefert: generiertes Starter-Kit + Library-Manifest für lizenzfreie Packs.
- "Kanye rappt"-Feature: KI-Stimmklon einer realen Person ohne Einverständnis wird NICHT gebaut. Ersatz: **Vocal-Layer** (eigene Acapella, BPM-synchron, startet mit Start, abschaltbar, Nudge/Tempo-Match).
- Latenz (iOS/Safari): AudioContext in erster Geste resumen, `audioSession.type="playback"` (Ringer-Schalter), Samples vorab dekodieren, `pointerdown` statt `click`, `latencyHint:"interactive"`, kleiner Audiograph, Resume bei `visibilitychange`.

## Architektur (kein Build-Step, 0 Dependencies → token- und ladeeffizient)
- `js/engine.js` – AudioContext, Voices, Pad-Trigger, Sequencer/Looper (Lookahead-Scheduler), Metronom, Vocal-Layer.
- `js/store.js` – IndexedDB (Audio-Blobs, Projekte), Export/Import.
- `js/sounds.js` – prozedurales Starter-Kit (Offline-Render), Transienten-Chop.
- `js/ui.js` – Pad-Grid, LCD-Waveform, Editor-Sheet, Library, Recorder.
- `sw.js` + `manifest.webmanifest` – Offline/Installierbar.

## Features
1. 16 Pads × 4 Bänke (A–D), Multi-Touch, Tastatur-Shortcuts.
2. Pro Pad: Sound, Start/Ende-Trim, Pitch, Lautstärke, Modus (One-Shot/Hold/Loop), Farbe, Name.
3. Sounds: Import (Dateien), Mikrofon-Aufnahme, Library/Starter-Kit.
4. Song-Chop: Datei → 16 Slices (Gleichmäßig oder Transienten).
5. Transport: BPM, Start/Stop, Metronom, Aufnahme/Overdub quantisiert (1/16), Loop-Länge 1/2/4 Takte.
6. Vocal-Layer: Acapella laden, startet mit Start, Tempo-Match, Nudge, Mute.
7. Projekte speichern/laden (IndexedDB), Export/Import-Datei.

## Schritte
1. Gerüst + PWA-Dateien → 2. Engine → 3. Store → 4. Sounds/Chop → 5. UI → 6. Tests (Playwright, iPhone + iPad Viewport) → 7. Commit/Push, Vercel-Hinweis.
