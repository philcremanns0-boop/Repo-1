# Verifier-Bericht (Stand 2026-11-01)

Geprüft: alle Dateien unter money-loop/out/ (e1, e2, e3) gegen CLAUDE.md und agents/regeln.md. Nur lesend; es wurde nichts in out/ verändert außer diesem Bericht.

## Übergreifende Prüfungen

- Emoji-Scan (python3 -I, Blöcke U+1F300-1FAFF, U+2600-27BF, U+FE0F, U+1F1E6-1F1FF): 0 Treffer in allen Textdateien (md, html, json, py) und im extrahierten Text aller drei PDFs.
- Kaltakquise, Heilsversprechen, Einnahmegarantien: keine Empfehlungen gefunden. gig-fiverr.md:54-56 und gig-malt.md:52-54 schließen Kaltakquise und Garantien ausdrücklich aus. Keine erfundenen Kundenstimmen oder Referenzen gefunden.

## Paket E1 (Angebots-Nachfass): BESTANDEN, mit Mängeln

Technik:
- workflow-nachfass.json lädt als JSON. 7 Nodes. Alle 5 connection-Namen existieren als Node und alle Ziele ebenfalls. Der Node "Hinweis" (Notiz) ist absichtlich unverbunden.
- Credentials: nur id "PLATZHALTER" (Zeilen 31, 98, 117, 143), Sheet-ID PLATZHALTER_SHEET_ID (21, 123). Kein Klartext-Schlüssel, kein Token. active=false (168). Nur Gmail-Entwurf, kein Versand.
- Nicht ausgeführt: IF-Datumsvergleich und `$('...').item`-Zuordnung bleiben ungetestet (README.md:3, 17 sagt das offen).

Mängel:
1. gig-fiverr.md:49 und gig-malt.md:47 empfehlen "keine Preise oder Adressen übergeben", der Workflow übergibt aber `summe` an die API (workflow-nachfass.json:89). Widerspruch zwischen Angebotstext und Lieferung.
2. gig-fiverr.md:30-31 und gig-malt.md:28-29 (Zweite Erinnerung nach 7 Tagen, automatische Statusmeldung) sind im gelieferten Workflow nicht enthalten. Es wird etwas versprochen, das nicht gebaut ist.
3. gig-fiverr.md:15 und gig-malt.md:13: "Viele Handwerksbetriebe schreiben Angebote und hören danach nichts mehr" ohne Quelle oder (E).
4. gig-fiverr.md:48 und gig-malt.md:46: "Der Workflow sendet nur an Empfänger ..." ist ungenau, es wird nur ein Entwurf erzeugt.
5. gig-fiverr.md:47 und gig-malt.md:45: Aussage zur Rolle als Auftragsverarbeiter ist Rechtsaussage. Sie hat den Hinweis "kein Rechtsrat" und "VOR VEROEFFENTLICHUNG PRUEFEN", ist aber nicht anwaltlich geprüft.
6. gig-fiverr.md:11 und gig-malt.md:9: Gebührenangaben (20 Prozent, ab 10 Prozent) verweisen auf memory/recherche.md. Die Datei wurde in diesem Lauf nicht gegengeprüft.

Was der Mensch vor Veröffentlichung tun muss:
- Workflow in echter n8n-Instanz mit Testdaten und eigener Mailadresse prüfen. Credentials und Sheet-ID selbst anlegen.
- Modellname claude-sonnet-5-5 gegen die Anthropic-Doku prüfen.
- AVV (Anthropic, Google, n8n, eigene Rolle) und Datenschutz juristisch prüfen lassen. Impressum und Freiberuflerstatus für Malt/Fiverr klären.
- Preise und Lieferzeiten (alle (E)) gegen den Markt prüfen. Paketumfang an den tatsächlichen Workflow angleichen (Mangel 1 und 2).

## Paket E2 (E-Rechnung Ratgeber): BESTANDEN, mit Mängeln

- landing.html: kein script-Tag. Keine externen Ressourcen (kein src, link, @import, url()). Es gibt nur 3 Quellenlinks als a-href (Zeile 41) und einen lokalen Download-Link (Zeile 48). Das sind Navigationslinks, keine geladenen Ressourcen. Icons sind inline SVG. Der Text in Zeile 63 ("lädt keine externen Skripte, setzt keine Tracker") stimmt.
- Impressum und Datenschutz sind nur Platzhalter und mit "VOR VEROEFFENTLICHUNG PRUEFEN" gekennzeichnet (landing.html:55-63). Das ist regelkonform, aber nicht veröffentlichungsfähig.
- Haftungshinweis "keine Rechts-/Steuerberatung" ist in Ratgeber (Zeile 3, 77), Checkliste (Zeile 3) und Landingpage (Zeile 29, 51) vorhanden.

Mängel:
1. Alle Fristen und die 800.000-Euro-Grenze stützen sich auf Sekundärquellen. Primärquellen waren nicht abrufbar (ratgeber.md:5, 68, landing.html:41). Das ist offen gekennzeichnet, aber nicht verifiziert.
2. ratgeber.md:39 (ZUGFeRD-Profile "nach meinem Kenntnisstand") und ratgeber.md:73 (Kleinunternehmer) sind unbelegt. Beide sind in ratgeber.md:66-75 als offen markiert, aber nicht mit "(E)" gekennzeichnet.
3. landing.html:45: "Kleinbetragsrechnungen bis 250 Euro brutto sind ausgenommen" steht ohne Quelle und ohne Vorbehalt. Im Ratgeber (Zeile 49) stammt es nur aus einer Kanzleiseite (sekundär).
4. ratgeber.md:9: Satz sprachlich fehlerhaft ("müssen ... E-Rechnungen schon seit dem 1. Januar 2025 können").
5. ratgeber.md:69: BMF-Schreiben mit widersprüchlichen Daten, aktuelle Fassung unklar. Das kann die Fristen ändern.
6. checkliste.md:6: "2027 oder 2028" ist verkürzt. Der Bezug zum Ratgeber bleibt nötig.

Was der Mensch vor Veröffentlichung tun muss:
- Fristen, Schwellenwert, § 14 UStG, § 33 UStDV und BMF-Schreiben gegen die Originaltexte prüfen und die aktuelle BMF-Fassung klären.
- Impressum (§ 5 DDG) und Datenschutzerklärung mit echten Angaben ausfüllen und rechtlich prüfen lassen.
- Download-Weg für checkliste.md festlegen (landing.html:48). Ratgeber ggf. von Steuerberatung gegenlesen lassen.

## Paket E3 (Etsy-Planer): BESTANDEN, mit Mängeln

PDFs mit pypdf geöffnet:
- wochenplaner-2027.pdf: 66 Seiten
- studienplan-semester.pdf: 21 Seiten
- habit-tracker-2027.pdf: 15 Seiten
Die Seitenzahlen stimmen mit den Listings überein (wochenplaner-2027/listing-etsy.md:15, studienplan-semester/listing-etsy.md:15, habit-tracker-2027/listing-etsy.md:15). Kein Emoji im PDF-Text. Metadaten: Autor "Software-generiert (Python, reportlab)".
Nicht geprüft: ob die Tabs und Links in GoodNotes tatsächlich funktionieren. Das konnte ich nur lesend nicht testen.

Mängel:
1. Alle drei Listings, Zeile 37: "vor Veröffentlichung von Hand geprüft" ist eine Behauptung, für die es keinen Beleg gibt. Sie gilt nur, wenn der Mensch wirklich prüft.
2. studienplan-semester/listing-etsy.md:44 und habit-tracker-2027/listing-etsy.md:44: Importtext wurde vom Wochenplaner übernommen ("Monate und Wochen sind ebenfalls antippbar"). Beim Habit-Tracker gibt es keine Wochen. Text anpassen.
3. Listing-Gebühr 0,20 USD (jeweils Zeile 54) ist Sekundärquelle. Preise (6,90 / 7,90 / 4,90 EUR, Aktionspreis, Bundle 9,90) sind (E) und gekennzeichnet.
4. Lizenzhinweis steht schon in den Beschreibungen (Zeile 17), wird aber in Zeile 55 noch als "zu ergänzen" geführt. Widersprüchlich.
5. studienplan-semester/listing-etsy.md:11: Startdatum 18.10.2027 ist als Annahme gekennzeichnet, aber nicht belegt.

Was der Mensch vor Veröffentlichung tun muss:
- PDFs selbst in GoodNotes und Notability öffnen und Tabs, Links und Layout prüfen. Danach die Zeile "von Hand geprüft" wahrheitsgemäß halten.
- Mockup-Bilder erstellen. Etsy-Richtlinien (Creativity Standards, Herstellerangabe, KI-/Tool-Kennzeichnung) prüfen. Steuerstatus (Kleinunternehmer § 19 UStG) und Impressum/Händlerangaben klären.
- Preise gegen den Markt prüfen. Listing-Texte an die Mängel 2 und 4 anpassen.

## Gesamtergebnis

E1, E2 und E3: bestanden, jeweils mit den oben genannten Mängeln, die kein Hindernis für den Status "Entwurf" sind. Keines der Pakete ist veröffentlichungsfähig, bevor die Punkte unter "Was der Mensch tun muss" erledigt sind. Die Mängel E1-1 und E1-2 sollten im Builder-Lauf zurück in plan.md.
