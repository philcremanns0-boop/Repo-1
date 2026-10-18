# Ergebnisse aus ChatGPT Work (Bericht vom 18.10.2026)

Quelle: Bericht, den ChatGPT im Browser erstellt hat. Ich habe die Angaben nicht selbst nachgeprüft, weil meine Umgebung die Seiten sperrt. Awwwards-Werte, Quelltext-Details und Faktenchecks gelten als "laut ChatGPT". Die Liste deiner gespeicherten Instagram-Beiträge speichere ich bewusst nicht im Repository, weil es öffentlich ist.

## 1. Normal is Boring (normalisboring.es)

**Awwwards:** Site of the Day 23.07.2026, Gesamtnote 7,17 (Design 7,27, Usability 7,00, Kreativität 7,19, Inhalt 7,25), Developer Award 7,49. Agentur LaNegrita. Developer-Wertungen: Animationen 8,20, Performance 8,00, Responsive 7,80, Markup 7,20, Semantik/SEO 6,80, Barrierefreiheit 6,60. Tags: Architecture, Photography, Luxury, Animation, Clean, Typography, Transitions, GSAP, WordPress.

**Typografie:** lokale Schriften Juana (Light, Regular, Medium), Editorial New (Ultralight, Regular, Ultralight Italic), Izmir Regular. Hauptzeile in Versalien, Izmir Regular, auf Desktop etwa 50 px mit sehr engem Zeilenabstand (etwa 45 px). Das letzte Wort wird in einer kontrastierenden Serif mit kursiver Wirkung gesetzt. Große Skala bis 12 rem. Hauptzeile ist technisch ein div, kein h1. Header mit `mix-blend-mode: difference`. Buchstaben-Rollover per doppelten Zeichen und vertikaler Verschiebung.

**Farben:** Schwarz `#000000`, Weiß `#FFFFFF`, Beige `#ECE4DA`, Koralle `#DB5C59`, Hellblau `#C7D7E9`, Grau `#707070`, Gedämpftes Grün `#ADAA8A`. Schwarz, Weiß und Beige tragen, die anderen strukturieren einzelne Kapitel.

**Raster:** 12 Spalten, Rasterabstand etwa 21 px, Außenabstand etwa 23 px, große vertikale Abstände bis etwa 170 px. Unter 950 px vier Spalten.

**Aufbau:** Loader (gedrehtes Logo mit Prozentanzeige), zerlegte Aussage auf Weiß mit hohem Architekturbild, überlagerte Bildsequenz, Über uns, Mission (Weiß auf Schwarz), Werte-Übergang mit riesigem Wort, Bildstrecke, Werte auf Hellblau, horizontale Projektgalerie, Schlusssatz, Kontakt, Footer.

**Technik (im Quelltext erkannt):** GSAP 3.12.7 mit ScrollTrigger, ScrollSmoother, SplitText, MorphSVG, dazu Lenis 1.3.1, Swup 4, Swiper 8.4.5, WordPress. Kein Three.js.

**Kernidee:** Man scrollt vertikal, bewegt sich aber horizontal durch eine Architekturausstellung. Zerlegte Typografie, wechselnde Bildgrößen und überlappende Ebenen machen die Seite selbst zum Gebäude.

**Schwächen (nicht übernehmen):** Luxus-Rhetorik ohne frühe sachliche Erklärung, Hauptüberschrift ohne Semantik, versteckte oder in Bewegung eingebettete Handlungen, riesige Abstände bei informationsreichen Angeboten, Kontaktlink mit fehlerhafter Adresse (`href="http://contacto"`), E-Mail nicht als `mailto:`.

### Was NOVEX daraus mitnimmt
| Prinzip | Anwendung bei Praxis, Autohaus, Handwerk |
|---|---|
| Grotesk und kursive Serif im selben Satz, Kontrast im letzten Wort | Direkt in Zahnarzt-Richtung C übernommen: "Dann *behandeln.*" |
| Zurückhaltende Grundpalette (Schwarz, Weiß, Beige) plus ein bis zwei Kapitel-Farben | Für Richtung A und C möglich: eine Basis und je Abschnitt eine Farbe |
| Ein einziges "Raumgefühl" als Idee (hier: Scrollen als Durchgang) | Bei Praxis: Rundgang durch die Räume. Bei Autohaus: Fahrzeug dreht sich beim Scrollen |
| Loader mit Markenzeichen und Prozentanzeige | Nur kurz und nur auf der Startseite, am Handy abkürzen |
| Typografische Skala mit benannten Stufen | Als Design-Token in jeder DESIGN.md festlegen |
| Semantik, Barrierefreiheit und echte Links | Besser machen: echtes h1, `mailto:` und `tel:` |
| Horizontales Scrollen als Erzählform | Nicht für Informationsseiten übernehmen (siehe ChatGPT-Liste), höchstens für ein Portfolio |

Hinweis: Die Awwwards-Werte liegen mit etwa 7 mäßig hoch. Es lohnt sich, ihre Stärke (Bewegung, Performance) zu lernen und ihre Schwächen (Semantik, Barrierefreiheit) zu vermeiden.

## 2. Faktencheck (laut ChatGPT mit Quellen)
| Aussage | Urteil | Ergebnis | Folge für mich |
|---|---|---|---|
| Kling 3.0 Motion Control, 1080p, 3 bis 30 s | stimmt | Pro-Modus: 15 Credits bei 5 s, 27 bei 10 s, 77 bei 30 s, kein konstanter Sekundenpreis | In 01 ergänzt |
| Higgsfield kann das eigene Video direkt mit dem eigenen Gesicht tauschen | stimmt | "Video Face Swap": Zielvideo plus Gesichtsreferenz, Motion Control nicht nötig | In 01 korrigiert. Das ist dein Plan: eigenes Video aufnehmen, KI-Gesicht daraufsetzen |
| EU-Transparenzpflichten ab 2026 | teilweise | Art. 50 AI Act gilt grundsätzlich ab 2. August 2026, professionelle Verwender müssen Deepfakes klar offenlegen | In 01 präzisiert |
| Instagram verlangt Kennzeichnung | stimmt | "AI info", Offenlegung bei bestimmten realistischen KI-Inhalten | bleibt |
| TikTok verlangt Kennzeichnung | stimmt | realistische KI-Bilder, -Audio und -Video | bleibt |
| Werbe-E-Mail und DM an Unternehmen ohne Einwilligung | teilweise | Grundsätzlich vorherige ausdrückliche Einwilligung nötig. Enge Bestandskundenausnahme in § 7 Abs. 3 UWG. Eine Impressumsadresse ist keine Einwilligung | Im Outreach-Skill ergänzt. Für Kaltkontakte gilt die Ausnahme nicht |
| `/clear` bei Themenwechsel | stimmt | Offizielle Kostendokumentation | bestätigt |
| Modellwechsel macht Cache ungültig | stimmt | Jedes Modell hat einen eigenen Cache | bestätigt |

Quellen laut ChatGPT: Higgsfield-Hilfe zu Kling, Higgsfield Face-Swap-App, EU-Kommission FAQ zu Art. 50, Meta-Hinweis zu KI-Kennzeichnung, TikTok-Newsroom, § 7 UWG auf gesetze-im-internet.de, Claude-Code-Doku zu Kosten und Prompt-Caching.

## 3. ChatGPT Pro (laut ChatGPT)
Offiziell je Pro-Stufe genannt: GPT-6-Modelle, Reasoning-Nutzung, Codex, Deep Research, Bildgenerierung, Work-Funktionen, Datei-Uploads, Projekte, Aufgaben, Custom GPTs, erweiterter Speicher, Apps und Verbindungen. Nicht pauschal belegbar: ein einziges Nachrichtenlimit, unbegrenzte Videogenerierung, Freischaltung jedes Connectors, identische Kontingente für alle Pro-Kunden.

Für NOVEX sinnvoll: Deep Research für Branchenanalysen, Bildgenerierung für Moodboards, Work für lange Browserrecherchen, Projekte pro Kunde, Aufgaben für regelmäßige Konkurrenz- und SEO-Prüfungen.

## 4. Lernplan (laut ChatGPT, 5 Stunden pro Woche)
| Woche | Block | Nachweis | Portfolio-Ergebnis |
|---|---|---|---|
| 1 | Frontend | freeCodeCamp Responsive Web Design (kostenlos, vollständig deutlich länger als 8 Wochen) | Responsive Landingpage für eine Zahnarztpraxis |
| 2 | Barrierefreiheit | W3C Intro to Web Accessibility (kostenlos als Audit, verifiziertes edX-Zertifikat laut W3C etwa 99 USD) | WCAG-Audit und korrigierte Landingpage |
| 3 | Performance | web.dev Learn Performance (etwa 3 bis 5 h, Badge) | Lighthouse-Bericht vorher und nachher |
| 4 | SEO | Google SEO Starter Guide (kein Zertifikat) | Lokale Leistungsseite mit Title, Description, Schema |
| 5 | Datenschutz | openHPI Datenschutz für Einsteiger (kostenlos, Inhalt von 2021) | Checkliste für Cookies, Formulare, Datenschutz |
| 6 | KI | IBM SkillsBuild AI Literacy (etwa 4 h, Credly-Badge) | KI-gestützter Anfrage- und Briefingprozess |
| 7 | Kundenkommunikation | HubSpot Inbound Sales (3 h 6 min, Zertifikat) | Discovery-Call-Leitfaden |
| 8 | Fallstudie | Zusammenführung | Öffentliche Case Study mit Messergebnissen |

Anmerkung: Der Datenschutzkurs ist von 2021, prüfe die Inhalte auf aktuellen Stand. Ich kann die Angebote nicht selbst prüfen. Die Portfolio-Ergebnisse passen gut zu dem, was du ohnehin baust (Zahnarzt-Seite, Audits).

## 5. Nocieling Media
ChatGPT fand die Schreibweise "No Ceiling Media". Kandidaten: `@_noceilingmedia` (40 Beiträge, 160 Follower, "Kreativagentur für visuelles Marketing"), `@noceiling.media`, `@noceilingmedia`, `@noceilingsmedia_`, `@noceilingsmediaa`. Der stärkste Kandidat und der, der zu deiner Erinnerung ("Unterstrich und dann der Name") passt, ist `@_noceilingmedia`. Nächster Schritt: Prompt 1 in `prompts/chatgpt-naechste-schritte.md`. Im Web außerhalb von Instagram fand ich bei meiner Suche nichts.
