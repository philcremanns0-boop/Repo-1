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

## Lehren aus Test 1 (Supermarkt, Veo, gemessen mit ffmpeg)
- Objekte, die später benutzt werden, ab Sekunde 0 sichtbar machen, sonst tauchen sie plötzlich auf.
- Kamera festhalten, wenn etwas im Bild bleiben muss (kein Heranfahren, kein Schwenk).
- Ton an Bildereignisse binden ("in dem Moment, in dem ...") statt an Sekunden. Zeitangaben hält das Modell nicht genau ein.
- Blinzeln beschreiben: etwa alle 3 Sekunden, nie länger als eine halbe Sekunde. Ein Satz wie "eyes close for a moment" erzeugt über eine Sekunde Lidschluss.
- Mund festlegen (Lippen geschlossen), sonst wirkt Atmen wie Sprechen.
- Tonwechsel stark formulieren ("cuts to almost complete silence, as if muted"). Ein Pegelsprung von 8 dB wirkt schwach.
- Bei Objektkontinuität Start- und Endbild nutzen, falls das Werkzeug es erlaubt.
- Vergleiche nur mit neuem Chat pro Prompt und mehreren Durchläufen, sonst vermischt sich Reihenfolge mit Qualität.
- Test 2 (Flow): Zustände nicht als Dauerzustand beschreiben. "Hängt um den Hals" und später "hebt sie vom Hals" erzeugt ein zweites Paar. Besser Start- und Endbild und den Satz "danach ist der Hals leer".
- Wunsch "Stille" nie mit "leises Brummen" formulieren, das Modell rendert Dauerrauschen. Stille und Atem in der Nachbearbeitung mit ffmpeg erzeugen (Lärm bis zum Schnittpunkt, 0,12 s Abfall, dann Stille und synthetischer Atem). Schnittpunkt aus Bildern bestimmen.
- Prompt-System: Look kommt aus Start- und Endbild, Bewegung aus dem Prompt. Flow (gratis) für Bilder und Tests, Higgsfield nur für das Endergebnis mit denselben Bildern, Ton aus. Details in `novex/prompts/video-prompt-system.md`.
- Higgsfield-Modelle mit Start- und Endbild und Tonschalter laut Katalog: Kling v3.0, Kling 3.0 Omni (Frames), Seedance 2.0 und Mini, Seedance 1.5 Pro, Gemini Omni Flash 1.1. Preise stehen nicht im Katalog.
- Warum Gegenstände auftauchen: Modelle haben kein Objektgedächtnis, Bewegen heißt zweimal ändern (alter Ort bleibt als Geist), Verneinungen ("neck bare") pflanzen den Begriff eher ein. Gegenmittel: kurze Clips, eine Veränderung pro Clip, Zustände positiv beschreiben, störende Begriffe nicht erwähnen, Gegenstände nicht weit bewegen lassen (Knopfdruck statt Aufsetzen testen), Bilder mit ChatGPT als Bearbeitung ("nur dies ändern") erzeugen. Details in `novex/prompts/video-prompt-system.md`.
- Kosten und Modelle (laut ChatGPT-Preflight 18.10.2026, von mir nicht geprüft): Higgsfield-Läufe sind günstig, etwa Kling v3.0 std 5 s ohne Ton 6,25 Credits, Seedance 2.0 Mini 5 s 5 Credits. Flow: ohne Abo 50 Credits pro Tag, "Return silent videos" liefert stumme Videos. Bildmodelle bei Higgsfield: Soul 2.0 für realistische Menschen, Nano Banana Pro für Bearbeitung mit Referenzbildern, GPT Image 2, Kling O1 Image.
- Werkzeuge: Standbilder alle 0,5 s und Gesichtsstreifen mit ffmpeg, Pegel mit `volumedetect` und `astats` (Datei vorher in einen eigenen Ordner legen).

## Grenzen
Nur eigenes Gesicht oder erfundene Figuren. KI-Inhalte kennzeichnen, wo es Plattformen oder Recht verlangen. Keine erfundenen Kundenstimmen. Credits nur nach Rücksprache ausgeben.
