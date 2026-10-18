# DESIGN.md · Zahnarztpraxis (Arbeitstitel)
Standard: Regeln v3.1 · Skill v3.0 · Tier: M (Leuchtturm-Ambition, Entscheidung nach dem Call) · Nische: Medizin / Zahnarzt · Motion-Persönlichkeit: RUHIG

Status: Entwurf vor dem ersten Call. Alle Aussagen zur Praxis sind Annahmen und im Call zu bestätigen. Texte sind Vorschläge, keine freigegebenen Werbeaussagen.

## (a) Herleitung
Drei Richtungen stehen zur Wahl (Ansicht: Artifact "Zahnarzt Stilrichtungen"). Herleitungssätze, jeweils vorläufig:
- A Stille: "Die Praxis ist ein ruhiger Raum, deshalb Serifenschrift (Instrument Serif), Moosgrün aus Pflanzen und Naturmaterial, Signatur Leistungsindex."
- B Raster: "Die Praxis arbeitet nach klarem Ablauf, deshalb Grotesk mit Mono, Ultramarin als einziger Akzent, Signatur Grundriss-Rundgang."
- C Eigenwillig: "Die Praxis hört zuerst zu, deshalb riesige Schrift, deren Breite der Besucher selbst verstellt, Petrol/Flieder/Butter als Farbflächen."
Endgültige Herleitung erst, wenn Interieur, Team und Geschichte der Praxis bekannt sind. Die Palette soll aus dem echten Praxisraum kommen, nicht aus meinem Entwurf.

## (b) Tokens (je Richtung)
A: bg #EDEFE8 · fg #1B231F · muted #56615A · akzent #3E5A47 · tint #D3DBCC · sand #CDB59A. Display Instrument Serif, Body Hanken Grotesk.
B: bg #F6F6F2 · fg #13171A · muted #5A6267 · akzent #2338D6 · pale #E4E8F7. Display Familjen Grotesk, Body Public Sans, Mono DM Mono.
C: petrol #12393B · flieder #D8D3EE · mint #EEF3EE · butter #F2D96B · ink #0B1F20. Display Anybody (Breitenachse), Body Karla.
Fonts im Produktivbetrieb selbst hosten (DSGVO, Regeln §5).
Body 17 bis 18 px, Zeilenlänge max. 65 Zeichen, Kontrast mindestens AA, Touch-Ziele mindestens 44 px.

## (c) Motion-Storyboard
Persönlichkeit RUHIG. Kein Intro, keine Scrub-Sektion. Ein ruhiger Einblend-Moment je Sektion (Maske oder Fade, 400 bis 600 ms). prefers-reduced-motion schaltet alles bis auf Zustandswechsel ab. Ausnahme C: der rotierende Termin-Sticker ist die einzige Dauerbewegung und lässt sich per reduced-motion abschalten.

## (d) Signature (drei Zugänge)
- A Leistungsindex mit Vorschau. Maus: Hover. Touch: Tippen. Tastatur: Fokus.
- B Praxis-Grundriss. Maus: Hover. Touch: Tippen. Tastatur: Tab und Enter.
- C Schriftbreite der Hauptüberschrift. Maus: Bewegung über dem Hero. Touch: horizontales Wischen. Tastatur: Regler mit Pfeiltasten.

## (e) Award versus Conversion
Dosierung: Conversion vor Award. Der Terminweg ist in allen Richtungen konventionell (verlinktes Buchungssystem der Praxis, Telefon, Sprechzeiten immer sichtbar). Gestalterischer Mut sitzt in Typografie und Fläche, nie im Buchungspfad.

## (f) Psychologie (Regeln §16)
1. Ersteindruck ist Vertrauen: echte Fotos der Praxis und des Teams statt Stock (Pflicht).
2. Aesthetic-Usability: Politur in Abständen, Typografie und Detail.
3. Peak-End: sorgfältige Terminbestätigung und freundliche 404.
Dringlichkeit und Knappheit sind in der Medizin tabu.

## (g) 3D-Stufe
Stufe 1 (keine 3D-Elemente). Optionaler Praxisrundgang als scroll-getriebene Fotostrecke nur, wenn gute Fotos vorliegen.

## (h) Sprache
Deutsch, Sie-Form. Englisch nur, wenn die Praxis internationale Patienten erwähnt (next-intl, hreflang).

## (i) Content-Status
Blocker offen: Praxisname, Standort, Impressum mit Kammerangaben und Berufsbezeichnung, Sprechzeiten, Terminweg (Buchungssystem), Notdienst-Hinweis, Telefon.
Nachrüstbar offen: Team- und Praxisfotos, Leistungsdetails, Preise, Praxisrundgang, Bewertungen.
Platzhalter im Entwurf sind markiert (gestrichelte Unterstreichung, "Textvorschlag").

## (j) Conversion-Event
Primär: Klick auf "Online-Termin" (Weiterleitung ans Buchungssystem). Sekundär: Telefonklick, Anfahrt.

## Rechtliches (zu prüfen, keine Rechtsberatung)
- Heilmittelwerbegesetz: keine Heilversprechen, keine irreführenden Superlative, Vorher/Nachher-Bilder nur nach Prüfung.
- Berufsordnung der Zahnärztekammer und Impressumspflichten (Kammer, Berufsbezeichnung, Aufsichtsbehörde).
- Datenschutz: Kontaktformular minimal, keine Diagnose-Freitexte, Datenschutz-Link direkt am Formular, Einwilligung für externe Dienste (Karten, Buchungssystem).
- Barrierefreiheit: Praxen mit Publikumsverkehr sollten WCAG 2.1 AA anstreben.

## Offene Entscheidungen für den Call
1. Welche Richtung (oder Mischung)?
2. Gibt es Fotos, Logo, Farben? Wer liefert Texte?
3. Welches Buchungssystem?
4. Seitenumfang (Startseite, Leistungen, Praxis/Team, Kontakt) und Zeitplan.
