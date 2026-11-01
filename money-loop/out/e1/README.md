# E1: Angebots-Nachfass-Automation

Status: UNGETESTET. Vor Nutzung in n8n importieren und prüfen.

## Dateien

- workflow-nachfass.json: n8n-Workflow (Schedule täglich, Google Sheets lesen, IF-Filter, Anthropic Messages API per HTTP Request, Gmail-Entwurf, Status zurückschreiben).
- gig-fiverr.md, gig-malt.md: Entwürfe für Angebotstexte. Preise und Lieferzeiten sind Annahmen (E), nicht belegt. Nichts veröffentlicht.

## Import und Prüfung

1. In n8n: Workflow importieren (Menü, Import from File).
2. Credentials neu anlegen und zuweisen: Google Sheets OAuth2, Gmail OAuth2, Header Auth (Name x-api-key, Wert Anthropic-API-Schlüssel). Im Repo stehen nur Platzhalter.
3. PLATZHALTER_SHEET_ID in beiden Sheets-Nodes ersetzen.
4. Tabellenblatt "Angebote" mit Spalten: angebot_id, kunde_name, kunde_email, projekt, angebot_datum (ISO, z. B. 2026-11-01), summe, status (offen), antwort_erhalten (leer), einwilligung_nachfass (ja), absender_name, nachfass_entwurf_am.
5. Modellname im HTTP-Request-Node prüfen (claude-sonnet-5-5 ist eine Annahme aus der Umgebung) und gegen die aktuelle Anthropic-Doku abgleichen.
6. Mit Testzeilen und eigener E-Mail-Adresse manuell ausführen. Der IF-Node (Datumsvergleich, leere Felder) und die Zuordnung via $('Offene Angebote lesen').item sind nicht verifiziert; ggf. Node-Versionen und Parameter an die installierte n8n-Version anpassen.
7. Erst danach den Workflow aktivieren (active steht auf false).

## Sicherheit und Recht

- Es wird nur ein Entwurf erzeugt, nichts gesendet.
- Kundendaten gehen an Anthropic und Google: AVV prüfen, Einwilligung/Rechtsgrundlage der Empfänger beachten. Der IF-Filter verlangt einwilligung_nachfass = ja.
- Rechtstexte und AVV: VOR VEROEFFENTLICHUNG PRUEFEN.

## Offene Punkte

- Tatsächliche Preise (Marktvergleich fehlt).
- AVV-Vorlage und rechtliche Prüfung.
- Test in echter n8n-Instanz.
