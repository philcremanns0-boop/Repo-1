# Agenten und RAG-Regeln

Gemeinsam für alle Rollen:

- Sprache Deutsch, keine Emojis (siehe CLAUDE.md im Repo-Root).
- Wissen kommt aus `money-loop/memory/`. Zuerst dort nachsehen, dann erst im Web suchen. Neue Fakten mit Quelle und Datum zurück in `memory/` schreiben.
- Keine Zahl ohne Quelle. Unbelegtes als "(E)" kennzeichnen.
- Keine Aktion außerhalb des Repos: nichts senden, veröffentlichen, bezahlen, keine Konten anlegen.
- Übergabe zwischen Rollen nur als kurze Zusammenfassung (maximal 15 Zeilen) plus Dateipfad.
- Pro Lauf höchstens 3 Aufgaben, damit der Kontext klein bleibt.

## Aufteilung: warum einzelne Rollen statt Paare

Jede Rolle hat ein eigenes Kontextfenster und andere Werkzeuge. Verbunden wird nur, was viel Kontext teilt (Bauen und Testen im selben Lauf, Hauptagent). Der Prüf-Agent bleibt immer getrennt, damit er nicht vom Bauenden beeinflusst ist. Suche und Scans laufen auf dem kleinsten Modell (Haiku), Bauen und Prüfen auf dem stärksten.

## router (Hauptagent)

Liest `plan.md`, wählt die nächsten offenen Aufgaben, vergibt sie an Rollen, schreibt `log.md`, aktualisiert `plan.md`. Schreibt für jede Aufgabe den Prompt der Rolle selbst: Ziel, Eingabedateien, Ausgabedatei, Abnahmekriterium.

## researcher

Nur lesen und suchen. Ergebnis: Datei in `memory/` mit Tabelle, Quelle je Zeile, Lücken am Ende. Behauptungen aus Verkaufsblogs als solche markieren.

## builder

Baut Dateien nach `out/`. Rechtstexte (Impressum, Datenschutz) nur als Platzhalter mit Kennzeichnung "VOR VEROEFFENTLICHUNG PRUEFEN". Keine erfundenen Referenzen, Kundenstimmen oder Zahlen. UI-Symbole als SVG.

## designer / bild

Bilder und Layouts per Code (SVG, HTML, PDF). Higgsfield nur, wenn eine Freigabe in `plan.md` steht, weil es Credits kostet.

## verifier

Eigener Lauf mit nur lesenden Werkzeugen. Prüft jede Ausgabe gegen: Quellenpflicht, keine Emojis, keine Rechtsverstöße (Kaltakquise, Heilversprechen, Abmahnrisiken), Abnahmekriterium. Ergebnis "bestanden" oder "nicht bestanden" mit Liste. Bei "nicht bestanden" geht die Aufgabe zurück in `plan.md`.

## analyst

Wertet `metrics.csv` aus, wendet die 14-Tage-Regel aus `plan.md` an, empfiehlt Verdoppeln oder Beenden.
