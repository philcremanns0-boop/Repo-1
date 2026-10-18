# DESIGN.md · No Ceiling Media (Entwurf)
Standard: Regeln v3.1 · Skill v3.0 · Tier: M · Nische: Kreativagentur (Video, Motion, Foto), am nächsten bei Nische 4.9 (Entertainment) mit eigener Anpassung · Motion-Persönlichkeit: A PRÄZISE, B ENERGETISCH, C RUHIG

Status: Entwurf vor dem Kundengespräch. Grundlage ist die Auswertung des öffentlichen Instagram-Profils (ChatGPT-Bericht vom 18.10.2026, von mir nicht selbst geprüft). Es gibt keine Website, keine Preise und keinen belegten Firmensitz. Alles Fehlende ist im Entwurf als Platzhalter markiert.

## Belegte Fakten (aus dem Bericht)
- Name "noceiling media", Bio "Kreativagentur für visuelles Marketing, Mehr Aufmerksamkeit. Mehr Wachstum". 160 Follower, 40 Beiträge, Kontakt per DM.
- Angebot: Videoschnitt, Motion Design, Event-, Porträt-, Produkt-Fotografie, Visitenkarten. Zielgruppe wirkt creator-orientiert.
- Gestaltung: Schwarz, Weiß, Grau, riesige angeschnittene Wörter, Collagen auf Weiß, abgerundete UI-Karten, Mockups, sichtbare Schnittprogramme.

## (a) Herleitung
- A Gerüst: "Die Marke arbeitet mit Schwarz, Weiß und riesigen angeschnittenen Wörtern, deshalb Archivo in schmal und extrafett, ein Grün als einzige Farbe, Signatur Vorher/Nachher-Regler."
- B Timeline: "Das Kernangebot ist Videoschnitt, deshalb ist die Seite ein Schnittfenster mit Abspielkopf. Wer sie benutzt, bedient eine Timeline."
- C Kontaktbogen: "Die Collagen aus unterschiedlich großen Fotos auf Weiß werden ein Kontaktbogen: ordnend, ruhig, mit Filter für Video, Foto und Motion."
Empfehlung: A und B zeigen. B ist am merkbarsten, A am nächsten an der bestehenden Marke, C passt, wenn Fotografie wachsen soll.

## (b) Tokens
Gemeinsam: Tinte `#0D0E10`, Papier `#F7F7F7`, Grau `#A6A6A6`, Grün `#6D7867` (visuelle Annäherung aus Instagram-Bildern, keine CI-Datei). Auf Dunkel wird Grün zu `#A9B8A4` aufgehellt (Kontrast).
Fonts im Produktivbetrieb selbst hosten (DSGVO). A: Archivo (wdth 62, 900) und IBM Plex Sans/Mono. B: Archivo, IBM Plex Sans/Mono. C: Schibsted Grotesk, Fragment Mono. Body 16 bis 17 px.

## (c) Motion-Storyboard
A: Regler und ein ruhiger Reveal je Abschnitt. B: Abspielkopf bewegt Monitor und Inhalte, optionales Abspielen. C: Hover-Anheben der Frames, Markierung beim Auswählen. prefers-reduced-motion: Übergänge aus, Abspielen nur auf Knopfdruck.

## (d) Signatur (drei Zugänge)
- A Vorher/Nachher-Regler. Maus: ziehen. Touch: wischen (vertikales Scrollen bleibt möglich). Tastatur: Bereichsregler mit Pfeiltasten.
- B Abspielkopf. Maus: ziehen. Touch: wischen. Tastatur: Pfeiltasten (Shift = 5 s), Pos1, Ende. Alle Inhalte stehen zusätzlich als Liste unter der Timeline (Fallback ohne Interaktion).
- C Kontaktbogen. Maus: Hover und Klick. Touch: Tippen. Tastatur: Tab und Enter, dazu Zurück und Weiter.

## (e) Award versus Conversion
Hauptaktion ist die Anfrage. Sie ist in allen Richtungen ohne Spiel erreichbar (Kontaktbereich, Knopf im Intro). B hat den höchsten Spielanteil, deshalb die Liste als Fallback und ein permanenter Knopf.

## (f) Psychologie (Regeln §16)
1. Spezifität: echte Zahlen und Zitate von Kunden statt Selbstbehauptung (fehlen noch, Frage 4).
2. Commitment-Treppe: ansehen, Vorher/Nachher erleben, Anfrage per DM oder Formular.
3. Autorität durch gezeigte Arbeit statt Versprechen.

## (g) 3D-Stufe
Stufe 1. Kein 3D, Fokus auf Video und Typografie.

## (h) Sprache
Deutsch, Du-Form (zur Zielgruppe passend, mit dem Kunden zu bestätigen). Englische Fachbegriffe wie Reel und Motion Design bleiben.

## (i) Content-Status
Blocker offen: Impressum (Name, Anschrift, Kontakt, Rechtsform), Kontakt (E-Mail, Formular), freigegebene Arbeiten, Logo und Markenrichtlinie, Preisentscheidung.
Nachrüstbar offen: Kundenstimmen, Kennzahlen, Showreel, Teamfotos.
Platzhalter im Entwurf sind markiert (Beschriftung "Platzhalter").

## (j) Conversion-Event
Primär: Klick auf "Projekt besprechen" und Absenden des Formulars. Sekundär: Klick auf das Instagram-Profil.

## Nicht übernehmen
Das Monogramm der Marke, ihre Wortmarken und Bilder, Kundenbilder und Kundennamen, identische Animationen, Kommunikation, die nur aus DM- und Rating-Aufforderungen besteht, und Aussagen wie Verdienstversprechen aus Beiträgen.

## Recht
- Impressum und Datenschutz vor Livegang.
- Musik, Bilder, Videos und Schriften nur mit geklärten Nutzungsrechten. Einbettungen von Instagram oder YouTube brauchen Einwilligung.
- Kundenarbeiten nur mit Freigabe zeigen.
- Keine erfundenen Zahlen oder Kundenstimmen.
