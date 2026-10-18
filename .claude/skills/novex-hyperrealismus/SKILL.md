---
name: novex-hyperrealismus
description: Prompts und Prüfmethode für hyperrealistische KI-Bilder und -Videos von Menschen (Higgsfield, Gemini Veo, Nano Banana, GPT Image). Nutzen, wenn Phil realistische Personen, UGC-Szenen oder Vergleichstests von Videomodellen will.
---

# Hyperrealismus

Hintergrund und Quellen: `novex/research/01-hyperrealismus.md`. Fertige Prompts: `novex/prompts/higgsfield-hyperrealismus.md`, Beispielschleife: `novex/prompts/video-supermarkt-ruhe.md`.

## Prompt-Formel
Person (Alter, Typ) · Kleidung · Handlung · Ort · Kamera mit Objektiv und Blende · Licht · Hauttextur und Imperfektionen · Ausschluss.
- Keine Floskeln ("8k", "masterpiece", "ultra realistic"). Sichtbare, konkrete Begriffe.
- Haut ausdrücklich: Poren, ungleichmäßiger Ton, leichte Asymmetrie, abstehende Haare.
- Handy-Look statt Kino: leichter Schwenk, Handkamera, kleine Unschärfe.
- Markennamen durch Objektbeschreibung ersetzen. Schilder und Text im Bild vermeiden ("signage out of focus, no readable text").

## Video (Veo-Stil)
Kurze Clips (4 bis 8 Sekunden). Zeitleiste in Abschnitten, Ton pro Abschnitt in der Szene beschreiben (nicht als Liste am Ende). Heikle Handgriffe (Aufsetzen, Ohr) entschärfen, Sprache vermeiden, mehrere Durchläufe.

## Schleife
Version schreiben, gegen die Fehlerliste prüfen (Floskeln, Zeitleiste, Ton, Kamera, Haut, Text im Bild, riskante Handgriffe), verbessern, nach dem ersten Ergebnis mit Standbildern und Tonbeschreibung diagnostizieren (Tabelle in `video-supermarkt-ruhe.md`).

## Grenzen
Nur eigenes Gesicht oder erfundene Figuren. KI-Inhalte kennzeichnen, wo es Plattformen oder Recht verlangen. Keine erfundenen Kundenstimmen. Credits nur nach Rücksprache ausgeben.
