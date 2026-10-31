# Goodnotes (Web-App für iPad / Apple-Geräte)

Nachbau der Goodnotes-6-Oberfläche als installierbare Web-App (PWA). Alle Daten bleiben lokal auf dem Gerät
(IndexedDB); es gibt kein Konto und keinen Server.

## Entwicklung

```bash
npm install
npm run dev          # Entwicklungsserver
npm run typecheck    # TypeScript (strict)
npm test             # Unit-Tests (Vitest)
npm run build        # Produktions-Build nach dist/
npm run test:e2e     # End-to-End-Test der echten Oberfläche (nach dem Build; braucht Playwright + Chromium)
```

## Deployment

Statische Seite, ein Ordner `dist/`.

- **Vercel:** Projekt importieren, *Root Directory* = `goodnotes-clone`. `vercel.json` setzt Build, SPA-Rewrites,
  Cache-Header (Service Worker ohne Cache, Assets immutable) und Sicherheits-Header.
- **Anderer Host:** `dist/` ausliefern, alle unbekannten Pfade auf `index.html` umleiten, `sw.js` mit `Cache-Control: no-cache`.
- **HTTPS ist Pflicht** (Service Worker, Mikrofon, Kamera, Zwischenablage).

Auf dem iPad: Safari → Teilen → **Zum Home-Bildschirm**. Die App startet dann im Vollbild, offline-fähig.

## Funktionen

| Bereich | Umfang |
|---|---|
| Bibliothek | Notizbücher mit Umschlag + Papier, farbige Ordner (verschachtelt), Favoriten, Suche, Sortierung, Duplizieren, Umschlag ändern, Papierkorb, Backup/Wiederherstellen, PDF-Import |
| Schreiben | Füller / Kugelschreiber / Pinselstift mit Druck, Schärfe, Rundung, Stabilisierung; Textmarker (gerade Linie, liegt unter der Tinte); Washi-Tape; eigene Farben |
| Radierer | Präzision / Standard / Strich, Größen, Filter (Stift, Textmarker, Tape), automatisch abwählen |
| Formen | Freihand zeichnen → Linie, Kreis, Ellipse, Dreieck, Rechteck, Vieleck; Füllung |
| Lasso | Freihand/Rechteck; verschieben, skalieren, drehen (45°-Raster), kopieren/ausschneiden/einfügen, duplizieren, umfärben, Screenshot, Link, als Objekt sichern |
| Text | Alle iOS-Systemschriften, eigene Schriften importieren, Größe, Fett/Kursiv, Ausrichtung, Zeilenabstand, Textfeld-Stil, Textstile, Notizzettel (Farben), Einfügen aus der Zwischenablage, Rechtschreibprüfung |
| Bilder & Objekte | Bild/Kamera, zuschneiden, skalieren; Objekte inkl. „Meine Objekte“ |
| Zubehör | Lineal (mm-Skala, Winkel, Zwei-Finger-Drehung), Zoom-Ansicht mit Vorschub, Zeitmesser, Audioaufnahme (gespeichert, mit Tinte synchron), Laserpointer |
| Seiten | Vorlagen (über 25, inkl. Planer, Musik, Lernkarten), Größen inkl. Whiteboard, hinzufügen/einfügen/duplizieren/drehen/löschen, Lesezeichen, Gliederung, Links, Umsortieren per Ziehen, Mehrfachauswahl |
| PDF | Import, beschriften, Textsuche mit Hervorhebung |
| Lernkarten | Vorlage + Lernmodus mit Wiederholungsplanung |
| Export | PDF, PNG, Notizbuch-Datei; Drucken; Präsentationsmodus |
| Gesten | Pinch-Zoom, 2-Finger-Tipp = Rückgängig, 3-Finger-Tipp = Wiederholen, Handballenerkennung mit Apple Pencil |
| Darstellung | Hell/Dunkel/System, Scrollrichtung, Werkzeugleiste angedockt/schwebend, Deutsch/Englisch |

Nicht enthalten (benötigt Server bzw. KI-Modelle): Handschrifterkennung, Goodnotes AI, Cloud-Sync, Zusammenarbeit.

Siehe `docs/IPAD-CHECKLIST.md` für den Abnahmetest auf echter Hardware.
