# ChatGPT: Leads für NOVEX recherchieren

Liefert Zeilen für die Pipeline im Outreach-System. Läuft am besten in der Recherche- oder Agentenfunktion mit Webzugriff.

```
Du bist Recherche-Assistent für eine Webdesign-Agentur (NOVEX, Deutschland). Finde [30] Unternehmen der Branche [Zahnarztpraxis / Autohaus / Dachdecker] in [Stadt oder Umkreis 30 km], deren Website erkennbar Verbesserungsbedarf hat.

SUCHE
- Nutze Google Maps und Webseiten. Nimm nur Unternehmen mit eigener Website und vollständigem Impressum.
- Bevorzuge Betriebe mit vielen Bewertungen, aber schwacher Website (hoher Kundenwert, sichtbares Potenzial).

PRO UNTERNEHMEN PRÜFEN (öffne die Seite wirklich, schätze nichts)
1. Ist die Seite am Handy schnell und lesbar?
2. Ist die Hauptaktion (Termin, Anruf, Angebot) sofort zu finden?
3. Echte Fotos oder Stockfotos?
4. Wirkt die Seite veraltet (Jahreszahl, tote Links)?
5. Impressum und Datenschutz vorhanden?
Nenne den stärksten Befund in einem konkreten Satz ("Auf dem Handy erscheint der Terminlink erst nach dreimal Scrollen").

AUSGABE als CSV mit genau diesen Spalten:
Firma;Branche;Stadt;Website;Ansprechperson (nur falls im Impressum öffentlich genannt);Postanschrift laut Impressum;Telefon laut Impressum;Quelle des Leads (URL);Aufhänger (stärkster Befund);Bewertungsanzahl und Durchschnitt bei Google

REGELN
- Nur geschäftliche Angaben aus Impressum und öffentlichen Unternehmensseiten. Keine privaten Daten, keine privaten E-Mail-Adressen.
- Keine erfundenen Daten. Wenn etwas fehlt, "nicht gefunden".
- Zu jedem Eintrag die URL, wo du es gesehen hast.
- Keine Nachrichten senden, keine Formulare ausfüllen, nichts bestellen.
Arbeite in Etappen zu je 10 Zeilen und melde dich nach jeder Etappe.
```

## Danach
1. CSV in die Pipeline einfügen (Spalten B bis J), Status "Recherchiert" setzen.
2. Pro Lead das Mini-Audit ausfüllen, bevor du Kontakt aufnimmst.
3. Erstkontakt per Brief (siehe Blatt "Recht" und "Vorlagen").
