# Profil-Angebot Malt: Angebots-Nachfass-Automation

Status: Entwurf, nicht veröffentlicht. Preise und Lieferzeiten sind Annahmen (E).

## Titel

Automatisches Nachfassen offener Angebote für Handwerksbetriebe (n8n + Claude, Gmail-Entwurf)

Hinweis: Malt verlangt eine Kundengebühr ab 10 Prozent (memory/recherche.md). Bei Malt sind Tagessatz- oder Projektpreise üblich; die Pakete sind als Projektpreise formuliert. Profil, Freiberuflerstatus und Impressum vorher klären.

## Beschreibung

Offene Angebote bleiben oft unbeantwortet (Annahme, nicht belegt). Ich richte Ihnen einen Ablauf ein, der offene Angebote in Ihrer Google-Tabelle täglich prüft und für Angebote ohne Antwort nach 3 Tagen einen kurzen, höflichen Nachfass-Text als Gmail-Entwurf vorbereitet. Sie lesen den Entwurf, ändern ihn bei Bedarf und senden selbst. Es wird nichts automatisch verschickt.

Technik: n8n (Workflow-Automation) und die Claude-API von Anthropic für die Textvorschläge.

## Pakete

Alle Preise sind Vorschläge (E), nicht durch Marktdaten belegt. Vor Veröffentlichung gegen Wettbewerber prüfen. Zusätzlich fallen laufende Kosten für n8n und die API beim Kunden an (nicht beziffert).

| | Basis | Standard | Premium |
|---|---|---|---|
| Preis (E) | 150 EUR | 350 EUR | 650 EUR |
| Lieferzeit (E) | 5 Tage | 7 Tage | 10 Tage |
| Nachfass-Workflow mit Gmail-Entwurf | ja | ja | ja |
| Google-Sheet-Vorlage für Angebote | ja | ja | ja |
| Anpassung des Tons und der Vorlage an Ihren Betrieb | 1 Variante | 2 Varianten | 3 Varianten |
| Zweite Erinnerung nach z. B. 7 Tagen | nein | ja | ja |
| Automatische Statusmeldung an Sie (z. B. Zusammenfassung per Mail) | nein | ja | ja |
| Einrichtung auf Ihrem n8n-Konto / Server | Anleitung | Einrichtung per Fernzugriff | Einrichtung per Fernzugriff |
| Einweisung per Videocall | nein | 30 Min. | 60 Min. |
| Korrekturschleifen | 1 | 2 | 3 |

## Anforderungen an den Kunden

- Google-Konto mit Google Sheets und Gmail (Google Workspace oder privat).
- Eine Tabelle mit Ihren offenen Angeboten (Kunde, E-Mail, Angebotsdatum, Summe, Status). Eine Vorlage liefere ich mit.
- Ein n8n-Zugang (n8n Cloud oder eigener Server) oder die Bereitschaft, einen anzulegen.
- Einen eigenen Anthropic-API-Schlüssel (Abrechnung direkt bei Anthropic).
- Eine Einwilligung bzw. eine rechtliche Grundlage, Ihre Angebotsempfänger per E-Mail nachzufassen (siehe DSGVO).

## DSGVO und Rechtliches (kein Rechtsrat)

- Die Kundendaten (Name, E-Mail, Angebotsinhalt) werden an die Claude-API von Anthropic übermittelt, um den Text zu erzeugen. Prüfen Sie dafür den Auftragsverarbeitungsvertrag (AVV) bzw. die Datenverarbeitungsbedingungen von Anthropic, Google und n8n.
- Wenn ich auf Ihre Systeme zugreife, bin ich in der Regel Auftragsverarbeiter. Dafür schließen wir vor Beginn einen AVV (Vorlage beim Kunden bzw. von Ihnen zu prüfen). VOR VEROEFFENTLICHUNG PRUEFEN: Wortlaut mit Datenschutzbeauftragten oder Anwalt klären.
- Beachten Sie die Einwilligung bzw. Rechtsgrundlage der Angebotsempfänger. Nachfassen auf ein von Ihnen gesendetes Angebot ist eine andere Situation als Kaltakquise, die Einordnung nach UWG und DSGVO liegt aber bei Ihnen. Der Workflow sendet nur an Empfänger, die in der Tabelle mit Einwilligung markiert sind.
- Daten nur minimal übergeben (der Workflow übergibt derzeit Kundenname und Angebotssumme an die Anthropic API; im Workflow anpassbar). Empfehlung: Löschfristen in der Tabelle festlegen.
- Der Entwurf muss vor dem Senden von Ihnen geprüft werden. Keine Gewähr für Inhalte, die ein Sprachmodell erzeugt.

## Abgrenzung

- Keine Kaltakquise und kein Versand an Empfänger ohne bestehenden Angebotskontakt.
- Kein automatischer Versand, nur Entwürfe.
- Keine Garantie für Aufträge, Abschlussquoten oder Umsatz.
- Keine Rechts- oder Steuerberatung, keine Erstellung von Angeboten selbst.
- Keine Anbindung an Branchensoftware (z. B. Handwerker-ERP) im Preis enthalten, auf Anfrage.
- Laufende Kosten (n8n, API, Google) trägt der Kunde.

## FAQ

**Wird die Mail automatisch gesendet?** Nein. Es entsteht nur ein Gmail-Entwurf, den Sie prüfen und selbst senden.

**Brauche ich Programmierkenntnisse?** Nein, Sie pflegen nur die Tabelle.

**Was, wenn ein Kunde schon geantwortet hat?** Tragen Sie das in der Tabelle ein, dann wird nicht nachgefasst.

**Welche Datenquelle geht?** Standard ist Google Sheets. Andere Quellen auf Anfrage.

**Funktioniert es mit Outlook?** Nicht im Standardumfang, auf Anfrage.

**Was kostet der Betrieb danach?** n8n und API-Nutzung zahlen Sie direkt an die Anbieter, die Höhe hängt von Ihrem Setup und Volumen ab (nicht belegt).
