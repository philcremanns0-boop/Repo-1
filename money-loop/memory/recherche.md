# Recherche (Stand 2026-11-01)

Belegtiefe: Fast alle Einnahmequellen sind Anbieter- oder Ratgeber-Blogs. Unabhängige DACH-Daten fehlen. Alles mit (E) ist Einschätzung.

## Die Vorlage (Reel @lasthumannode)

Behauptet: 19 personalisierte Kalt-Mails an Dachdecker in Dallas, 1 Kunde, 550 USD, 4 Stunden Aufwand, n8n-Workflow "Quote follow-up". Bildschirme sehen nach Mockups aus, Ende ist ein "Comment BUILD"-Trichter. Als Ideengeber nutzbar, nicht als Beweis.

## Rechtsrahmen Kundengewinnung (DE)

- E-Mail, Fax, Anrufmaschinen brauchen auch im B2B vorherige Einwilligung. B2B-Telefon nur bei mutmaßlicher Einwilligung mit konkretem Anlass. Hauptrisiko: Abmahnung. Quellen: https://www.ihk-muenchen.de/ratgeber/recht/werbung-fairer-wettbewerb/marketing-per-email-telefon-brief-etc/ , https://kanzlei-herfurtner.de/kaltakquise-b2b-abmahnung/
- Offen: Gesetzestext § 7 und § 20 UWG selbst prüfen (Aufgabe T02).
- Instagram: Kalte automatisierte DMs praktisch ausgeschlossen. Antwort nur innerhalb 24 h nach Nutzernachricht, Private Reply nach Kommentar innerhalb 7 Tagen (Sekundärquelle). https://developers.facebook.com/documentation/business-messaging/messenger-platform/policy

## Angebote (Preise belegt nur aus Anbieter-Blogs)

- n8n-Retainer: 800 bis 2.500 EUR/Monat, Zusatzstunde 120 bis 180 EUR (Einzelanbieter-Blog) https://blckalpaca.at/de/blog/n8n-agentur-vergleich-dach-auswahlkriterien-and-kosten-2026.md
- KI-Telefonassistent: Tools 27 bis 199 EUR/Monat; sehr hoher Wettbewerb (IONOS, Strato verkaufen selbst).
- E-Rechnung: Pflicht zum Ausstellen 1.1.2027 (Vorjahresumsatz über 800.000 EUR), 1.1.2028 alle übrigen. https://www.truecommerce.com/de/blog/e-invoicing-germany-timeline-deadlines/ , https://www.ihk.de/fulda/standortpolitik/handel-dienstleistungen/e-rechnung-6318032
- Google-Business-Profil-Betreuung: US-Preise 300 bis 600 USD/Monat laufend; DE-Preis nicht belegt.
- Förderung Beratung bis 80 %, max. 2.800 EUR/Antrag (Anbieterangabe, prüfen).
- Angebots-Nachfass-Gig existiert auf Fiverr (hoher Wettbewerb).
- Nicht belegt: 550 USD aus dem Reel, "5.000 bis 30.000 USD/Monat"-Aussagen, Zeitersparnis-Angaben von Anbietern.

## Kanäle und Gebühren

- Fiverr 20 %, Upwork 10 % (Quellen widersprüchlich), Malt Kundengebühr ab 10 %.
- Digistore24: Merchant of Record, 7,9 % + 1 EUR je Transaktion (Hilfecenter), 10 % Einbehalt 60 Tage (Sekundärquelle). https://help.digistore24.com/hc/en-us/articles/23694504392721
- Gumroad: MoR-Status widersprüchlich dargestellt, vor Nutzung prüfen.

## Digitalprodukte

- Etsy: Keine belastbare Studie. Blogs: Median 200 bis 800 USD/Monat Umsatz, 65 bis 70 % der Shops unter 100 USD/Jahr. Erste Verkäufe nach Monaten. Listing 0,20 USD, 4 Monate. KI erlaubt mit Kennzeichnung (sekundär). Prompt-Pakete auf Etsy laut Sekundärquelle verboten. https://etsy.com/legal/creativity
- Print-on-Demand: keine belegten Zahlen. Verkäufer haftet für IP. KI-Bilder ohne menschliche Bearbeitung in den USA nicht urheberrechtlich geschützt.
- Nicht recherchiert: n8n-Vorlagen, Notion-Templates, Newsletter, Programmatic SEO.

## Steuer und Recht

- Kleinunternehmer § 19 UStG ab 2025: Vorjahr bis 25.000 EUR netto, laufendes Jahr bis 100.000 EUR netto. https://www.ihk.de/nordwestfalen/steuern/kleinunternehmerregleung-2025-6412924
- Impressum nach § 5 DDG für geschäftsmäßige Dienste, nicht abhängig von Gewerbeanmeldung. https://www.ihk.de/chemnitz/recht-und-steuern/rechtsinformationen/internetrecht/pflichtangaben-im-internet-die-impressumspflicht-4401580
- Gewerbeanmeldung und Einkommensteuer auf Nebeneinkünfte: nicht belegt, beim Finanzamt klären.

## Plattform-APIs

- Instagram Graph API: eigene Posts per media_publish, Limit 100 (Doku nennt an anderer Stelle 50, live prüfen). https://developers.facebook.com/docs/instagram-platform/content-publishing
- Pinterest API v5: neue Apps nur Trial (Pins nur für Ersteller sichtbar), öffentliches Posten braucht Standard-Zugang mit Prüfung. https://developers.pinterest.com/docs/key-concepts/access-tiers/
- Etsy Open API v3: Listings per API möglich, Nutzungsbedingungen nicht verifiziert.

## Infrastruktur (Cloud-Loops)

- Scheduled Tasks laufen in der Anthropic-Cloud, auch bei geschlossener App. Mindestabstand eine Stunde, 100 geplante Läufe/Stunde/Account, Verbrauch aus dem Abo-Kontingent. Prompt zählt nicht als Freigabe. Push nur auf `claude/`-Branches. https://code.claude.com/docs/en/web-scheduled-tasks
- Steuerung per Claude-App (Code-Tab) auf iPad und Handy; kein "Bypass permissions" auf dem Handy. https://code.claude.com/docs/en/mobile
- Netzwerk Standard "Trusted"; Secrets als Network Secrets statt Umgebungsvariablen. https://code.claude.com/docs/en/cloud-environments
- Cloud-Sessions laufen nach Inaktivität ab, `/loop` in Sessions wird nicht übernommen. https://code.claude.com/docs/en/claude-code-on-the-web
- Alternativen: GitHub Actions (cron + claude-code-action, Cron nur vom Default-Branch) https://code.claude.com/docs/en/github-actions ; n8n Cloud ca. 20 bis 60 EUR/Monat; n8n Self-Host auf VPS ca. 4 bis 5 EUR (Sekundärquellen, nicht auf Herstellerseite bestätigt).
- Prompt Caching: Lesen 0,1x, bei Sonnet 5.5/Opus 5.5 0,05x. https://platform.claude.com/docs/en/build-with-claude/prompt-caching
- Subagenten: eigenes Kontextfenster, nur Zusammenfassung kommt zurück; parallele Agenten vervielfachen Kosten. https://code.claude.com/docs/en/sub-agents

## Entscheidung Gedächtnis

Git-Repo mit Markdown statt Obsidian oder Notion-MCP: läuft in jeder Cloud-Session ohne Zusatzserver, ist auf dem iPad lesbar, kostet wenige Tokens. Notion nur als Eingabekanal (Einschätzung, nicht belegt).
