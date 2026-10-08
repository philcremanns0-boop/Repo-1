# Pad Sampler

MPC-artiger 4×4-Sampler als installierbare Web-App (PWA) für Handy und iPad. Kein Build-Schritt, keine Abhängigkeiten.

## Features
- 16 Pads × 4 Bänke, Multi-Touch, Tastatur (`1234 / qwer / asdf / zxcv`, Leertaste = Start)
- Pro Pad: Sound, Start/Ende, Pitch (Chipmunk-Presets), Lautstärke, One-Shot/Halten/Loop, Choke-Gruppen, Farbe, Name
- Eigene Dateien importieren, per Mikrofon aufnehmen, Song in 16 Slices choppen (Transienten oder gleichmäßig)
- Looper: BPM, Tap-Tempo, Metronom, quantisierte Aufnahme/Overdub (1/16), 1/2/4 Takte
- Vocal-Layer: eigene Acapella läuft synchron mit START, mit Tempo-Match, Nudge, Mute
- Projekte lokal speichern, Export/Import als Datei (inkl. Sounds)
- Offline-fähig (Service Worker)

## Rechtliches
Es werden **keine** urheberrechtlich geschützten Songs mitgeliefert. Das Starter-Kit ist synthetisch erzeugt. Eigene Dateien bleiben ausschließlich lokal im Browser (IndexedDB). Eine KI-Nachbildung der Stimme realer Personen ist bewusst nicht enthalten.

## Lokal starten
`python3 -m http.server 8000` → http://localhost:8000 (Mikrofon/PWA brauchen HTTPS oder localhost)

## Deployment (Vercel)
Repo bei Vercel importieren – Framework „Other“, kein Build-Command, Output-Verzeichnis `.`. `vercel.json` ist enthalten.
Auf dem iPad: Safari → Teilen → „Zum Home-Bildschirm“ für Vollbild.

## Latenz
`AudioContext({latencyHint:'interactive'})`, vordekodierte Buffer, `pointerdown`, Lookahead-Scheduler (25 ms / 120 ms), `audioSession.type='playback'` (iOS-Stumm-Schalter).

Struktur & Plan: `docs/PLAN.md`
