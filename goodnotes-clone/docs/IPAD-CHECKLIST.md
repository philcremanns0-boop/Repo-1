# Abnahmetest auf dem iPad (Safari)

Automatisch getestet ist alles in Chromium (`npm run test:e2e`, 26 Prüfungen). Folgendes kann nur echte Apple-Hardware prüfen:

1. **Installation**: Safari → Teilen → Zum Home-Bildschirm → App startet im Vollbild, Statusleiste überdeckt nichts.
2. **Offline**: Flugmodus an, App öffnen → Bibliothek und Notizbücher laden.
3. **Apple Pencil**: Druck verändert die Strichbreite (Füller/Pinsel); Handballen auf dem Display zeichnet nicht, sobald der Stift einmal benutzt wurde; Finger scrollt dann.
4. **Gesten**: Zwei-Finger-Pinch zoomt um die Fingermitte; Zwei-Finger-Tipp macht rückgängig; Drei-Finger-Tipp wiederholt.
5. **Lineal**: mit zwei Fingern drehen; mit dem Pencil an der Kante entlang zeichnen → gerade Linie.
6. **Schriften**: Text in Chalkboard SE, Marker Felt, Snell Roundhand anlegen → echte Systemschrift sichtbar.
7. **Mikrofon**: Zubehör → Aufnehmen → Erlaubnis-Dialog → Aufnahme erscheint in Seitenleiste → Audio, nach App-Neustart noch vorhanden.
8. **Kamera**: Bilder → Foto aufnehmen.
9. **Zwischenablage**: Text in Notizen kopieren → Lasso-Tipp → Einfügen.
10. **PDF**: Datei aus der Dateien-App importieren (mehrseitig), beschriften, als PDF exportieren und in der Dateien-App öffnen.
11. **Speicher**: Einige Fotos einfügen → nach Neustart vorhanden (IndexedDB, kein 5-MB-Limit).
12. **Dunkelmodus**: Systemeinstellung umschalten → App folgt (Einstellung „System“).
13. **Hochformat** iPad mini: Werkzeugleiste zeigt »-Menü für nicht passende Werkzeuge.
