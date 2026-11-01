# Plan

Stand: 2026-11-01. Ziel: erste Einnahmen so schnell wie rechtlich sauber möglich, danach skalieren, was Zahlen zeigt.

## Wartet auf Freigabe (nur Mensch)

- [ ] Steuer/Gewerbe klären, Kleinunternehmerregelung prüfen (Grenzen ab 2025: 25.000 EUR Vorjahr, 100.000 EUR laufend)
- [ ] Impressumsdaten liefern (Name, ladungsfähige Anschrift, E-Mail)
- [ ] Konten: Digistore24, Etsy, Fiverr, Malt
- [ ] Pakete aus `out/` veröffentlichen

## Experimente (parallel, je 14 Tage, dann entscheiden)

Regel: Ein Experiment wird beendet, wenn es nach 14 Tagen null Signale hat (Aufrufe, Klicks, Anfragen, Verkäufe). Es wird verdoppelt, wenn es Anfragen oder Verkäufe hat.

| ID | Experiment | Kanal (erlaubt) | Erstes Signal |
|---|---|---|---|
| E1 | Produktisierter Service: Angebots-Nachfass-Automation (n8n + Claude), Fixpreis plus Monatsabo | Fiverr, Malt, Upwork, eigene Landingpage mit SEO | Anfrage |
| E2 | E-Rechnung: Pflicht zum Ausstellen ab 1.1.2027 (Vorjahresumsatz über 800.000 EUR), ab 1.1.2028 für alle. Ratgeber, Checkliste als Lead-Magnet, Umstellungs-Service | SEO-Seiten, Digistore24 | Checklisten-Downloads |
| E3 | Digitale iPad-Planer (GoodNotes-PDF) in Nischen, per Code erzeugt | Etsy, Digistore24 | Aufrufe, Favoriten |

## Aufgaben (der Loop arbeitet von oben nach unten)

Format: `- [ ] ID | Rolle | Aufgabe | Ergebnisdatei`

- [ ] T01 | researcher | Primärquellen lesen: Etsy Creativity Standards, Etsy API Terms, Digistore24-Verkäuferbedingungen, Fiverr-Regeln zu KI-Leistungen. Ergebnis in `memory/regeln-plattformen.md` | memory/regeln-plattformen.md
- [ ] T02 | researcher | Wortlaut UWG § 7 und § 20 auf gesetze-im-internet.de prüfen, in 10 Zeilen zusammenfassen | memory/uwg.md
- [ ] T03 | builder | E1: Fiverr-/Malt-Gig-Texte (Deutsch), Preisstaffel, 3 Beispiel-Workflows als n8n-JSON, FAQ | out/e1/
- [ ] T04 | builder | E1: einseitige Landingpage (statisch, ohne Tracker) mit Platzhalter-Impressum, Datenschutz-Gerüst | out/e1/landing/
- [ ] T05 | builder | E2: Ratgeber "E-Rechnung 2027/2028: Was Selbständige und KMU jetzt tun müssen" (Fakten nur mit Quelle) | out/e2/ratgeber.md
- [ ] T06 | builder | E2: Checkliste als PDF (per Code erzeugt) plus Landingpage | out/e2/
- [ ] T07 | builder | E3: Generator für iPad-Planer-PDFs (Wochenplaner, Habit-Tracker, Studienplan), 5 Varianten, Vorschaubilder, Etsy-Listing-Texte mit KI-Kennzeichnung | out/e3/
- [ ] T08 | verifier | Alle Pakete prüfen: Fakten gegen Quellen, keine erfundenen Zahlen, keine Emojis, Rechtstexte als Platzhalter gekennzeichnet | log.md
- [ ] T09 | router | Auswertung `metrics.csv`, Experimente nach Regel oben bewerten, Plan anpassen | plan.md
- [ ] T10 | researcher | Weitere Nischen für E1 und E3 mit belegter Nachfrage suchen (Suchvolumen, Etsy-Wettbewerb), Ranking | memory/nischen.md

## Nicht tun

- Keine kalten E-Mails, keine automatisierten Instagram-DMs, kein Mass-Follow.
- Nichts veröffentlichen, versenden, bezahlen oder Konten anlegen ohne Freigabe.
- Keine Einnahmezahlen behaupten, die nicht in `metrics.csv` stehen.
