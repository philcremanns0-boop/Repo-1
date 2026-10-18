# Hyperrealismus-Test: Supermarkt, Kopfhörer, plötzlich Ruhe

Szene: Eine Frau steht im lauten Supermarkt, setzt Kopfhörer auf, und schlagartig ist es ruhig. Dein Higgsfield-Video dazu kenne ich nicht, ich konnte es nirgends finden (Notion-Memory war leer, frühere Chats sehe ich nicht). Ich baue den Prompt deshalb aus deiner Beschreibung. Wenn du mir dein Higgsfield-Ergebnis oder seinen Prompt gibst, gleiche ich beide Szenen genau an.

Zum Produkt: "AirPods Pro Max" gibt es nach meinem Wissen nicht. AirPods Pro sind In-Ear-Stöpsel, AirPods Max sind die großen Over-Ear-Kopfhörer. Für die Szene "Ruhe auf Knopfdruck" passen die Over-Ear am besten (gut sichtbare Geste). Der Prompt beschreibt das Objekt statt den Markennamen, das klappt bei Videomodellen zuverlässiger. Variante für In-Ear steht unten.

## Die Schleife: Prompt schreiben, kritisieren, verbessern

### Version 1 (naiv)
```
A woman in a supermarket puts on AirPods Pro Max and everything becomes quiet. Hyperrealistic, 4K.
```
**Kritik an V1**
1. "Hyperrealistic, 4K" sind Floskeln und schieben den Look eher Richtung CGI.
2. Keine Zeitleiste. In 8 Sekunden hetzt das Modell durch die Handlung.
3. "Alles wird ruhig" ist nicht darstellbar. Es fehlt, welche Geräusche wann aufhören und was übrig bleibt.
4. Markenname trifft kein eindeutiges Produkt und kann zu falscher Form oder Ablehnung führen.
5. Keine Kamera, kein Licht, keine Person. Ergebnis: generischer Stock-Look.
6. Schilder im Supermarkt erzeugen oft unleserliche Buchstaben. Dagegen braucht es eine Anweisung.

### Version 2 (strukturiert)
Zeitleiste, Kamera, Person, Ort, Ton am Ende.

**Kritik an V2**
1. Ton als Liste am Ende. Quellen zu Veo empfehlen, den Ton in die jeweilige Szene einzubauen, sonst wird er ungenauer.
2. Der schwierigste Moment ist das Aufsetzen (Hände, Haare, Bügel kollidieren). Risiko senken: Kopfhörer hängen schon um den Hals, sie hebt sie nur an.
3. Die Stille hat kein Bild. Gegenmittel: Umgebung bewegt sich weiter, aber lautlos, und ihr Körper entspannt sichtbar.
4. "Laut" ist visuell zu schwach. Es braucht Auslöser: weinendes Kleinkind, klappernde Wagen, Scanner.
5. Keine Hautdetails. Ohne sie wird die Haut glatt.
6. Sprache vermeiden, sonst Lippen-Synchronität als Fehlerquelle.

### Version 3 (final, Veo-Stil, 8 Sekunden)
```
Vertical 9:16, handheld smartphone footage, 8 seconds, one continuous take, 28mm equivalent, camera at chest height with slight natural sway.

A woman in her early 30s with a loose low ponytail and a few flyaway strands, light freckles, no visible makeup, wearing a beige quilted jacket and a canvas tote bag on her shoulder, stands in a busy supermarket aisle under flat white fluorescent light. Around her: shoppers pushing carts, a toddler in a cart seat crying, stacked boxes in the background with blurred, unreadable packaging, hanging price signs out of focus. No readable text anywhere in the frame.

0 to 3 seconds: The aisle is overwhelming. Audio: dense supermarket noise at full volume, rattling cart wheels, overlapping unintelligible voices, a toddler wailing, rhythmic scanner beeps, a distorted PA chime. She stands tense, jaw tight, eyes darting, shoulders raised, one hand gripping the cart handle.

3 to 5 seconds: With both hands she lifts a pair of silver over-ear headphones with a knit mesh headband and aluminium ear cups from around her neck, settles them over her ears and adjusts the left cup once. Audio: the noise stays loud, with one soft click as the cups seal.

At 5 seconds: Audio: all ambient sound drops abruptly into a muffled, distant low rumble, as if heard through noise cancelling. The wailing and beeps are barely audible.

5 to 8 seconds: Her shoulders drop, she exhales slowly through her nose, her eyes close for a moment and reopen with a faint, relieved half-smile. Behind her, shoppers keep moving and the toddler keeps crying, but we only hear the soft muffled rumble and her slow breath. The camera drifts slightly closer.

Style: photorealistic documentary look, natural skin texture with visible pores, slight facial asymmetry, mild handheld imperfection, soft white-green fluorescent colour cast, no colour grading, no slow motion. No music, no subtitles, no text overlays, nobody speaks intelligibly.
```

### Version 3 kompakt (falls das Tool lange Prompts schlecht verarbeitet, etwa 150 Wörter)
```
Vertical handheld smartphone video, 8 seconds, one take. A woman in her early 30s, loose ponytail with flyaway strands, light freckles, beige quilted jacket, stands in a crowded supermarket aisle under flat fluorescent light; a toddler cries in a cart, carts rattle, scanners beep, voices overlap (loud ambient audio). She looks tense, shoulders raised. At 3 seconds she lifts silver over-ear headphones with a mesh headband from her neck onto her ears with both hands. At 5 seconds all sound drops abruptly to a muffled low rumble, as if noise cancelling. Her shoulders drop, she exhales slowly, eyes close, then open with a faint relieved smile, while shoppers keep moving silently behind her. Natural skin texture with pores, no retouching, soft handheld drift, no readable text in frame, no music, no speech.
```

### Variante In-Ear (AirPods Pro Stil)
Ersetze den Abschnitt "3 to 5 seconds" durch:
```
3 to 5 seconds: She takes a small white wireless earbud with a short stem from her jacket pocket, presses it gently into her right ear with one finger, then the left. Audio: the noise stays loud, with one soft chime as the earbuds connect.
```
Riskanter, weil Finger und Ohr eng zusammen sind. Mehrere Versuche einplanen.

## Auswertung Test 1 (Video von Phil, Version 3, 8 Sekunden, 720x1280, 24 fps)
Ich habe Standbilder alle 0,5 Sekunden, das Gesicht mit 6 Bildern pro Sekunde und den Ton mit ffmpeg gemessen. Gehört habe ich das Video nicht. Alle Tonaussagen beruhen auf Pegelmessungen.

| Beobachtung | Beleg | Ursache im Prompt oder Modell |
|---|---|---|
| Kopfhörer tauchen aus dem Nichts auf | Bei 2,5 s greift sie noch den Wagen, bei 3,0 s hält sie die Kopfhörer vor dem Bauch. Um den Hals hingen sie nie | Der Prompt sagte "from around her neck", aber im ersten Bild war nichts davon sichtbar. Das Modell erfindet das Objekt im Moment, wo es gebraucht wird |
| Einkaufswagen verschwindet | Bis 2,5 s ist der Griff im Bild, ab 3,5 s nicht mehr | "The camera drifts slightly closer" plus Bewegung der Frau. Ausschnitt wechselt, der Wagen fällt heraus |
| Blinzeln unnatürlich | Von 0 bis etwa 5,4 s kein einziges Blinzeln. Dann Augen zu von etwa 5,4 s bis 6,7 s, rund 1,3 s | Menschen blinzeln etwa alle 3 bis 4 Sekunden, ein Blinzeln dauert grob 0,1 bis 0,4 s. Der Prompt verlangte "eyes close for a moment" und nannte keine normale Blinzelrate |
| Mund öffnet sich wie beim Sprechen | Bei 6,5 bis 7,0 s ist der Mund leicht offen | "exhales slowly through her nose" war zu schwach, Lippen nicht ausdrücklich geschlossen |
| Tonwechsel zu schwach | Gesamtpegel etwa -31 bis -37 dB bis 3,5 s, dann etwa -38 bis -43 dB: rund 8 dB leiser. Höhen über 3 kHz fallen von etwa -43 bis -47 dB auf -49 bis -55 dB. Tiefen unter 400 Hz bleiben bei etwa -42 dB gleich. Der Abfall beginnt um 4 s, nicht abrupt | Kein Knall-Effekt. Zeitangabe "at 5 seconds" wird vom Modell nicht exakt eingehalten, Aufsetzen geschah schon bei etwa 3,7 bis 4,5 s |
| Positiv | Licht, Haut, Jacke, Gesichtsausdruck, Umgebung wirken glaubwürdig, Kopfhörer-Form stabil, Gesicht über den ganzen Clip gleich | Details im Prompt zu Licht, Haut und Kleidung zahlen sich aus |

### Lehren (gelten auch für Higgsfield)
1. **Objekte vor dem Gebrauch zeigen.** Alles, was später benutzt wird, muss von der ersten Sekunde an im Bild sichtbar sein (hier: Kopfhörer um den Hals). Sonst "spawnt" es.
2. **Kamera festhalten, wenn etwas im Bild bleiben muss.** Kein Heranfahren, kein Schwenk.
3. **Ton an Bildereignisse binden, nicht an Sekunden.** "Der Lärm endet in dem Moment, in dem die Ohrmuscheln die Ohren berühren."
4. **Blinzeln beschreiben.** Rate, Dauer, und eine bewusste Handlung als eigenes, kurzes Blinzeln.
5. **Mund festlegen** (Lippen geschlossen, kein Sprechen), sonst wirkt Atmen wie Reden.
6. **Wirkung groß genug machen.** Ein Pegelsprung unter 10 dB reicht nicht für "Knall-Stille". Anweisung: "cuts to almost complete silence, as if someone pressed a mute button".
7. **Bei Objektkontinuität Start- und Endbild verwenden**, falls dein Werkzeug das kann (bei Kling und Higgsfield üblich, bei Veo je nach Version): Erst ein Standbild mit Kopfhörern um den Hals, dann animieren. Das ist die robusteste Lösung gegen Auftauchen von Gegenständen.
8. **Reihenfolge-Effekt trennen.** Dein Ergebnis "erster Prompt war der beste" kann an der Reihenfolge liegen (zum Beispiel Nachwirkung im selben Chat). Starte für jeden Prompt einen neuen Chat und mache je 3 Durchläufe. Erst dann ist der Vergleich belastbar. Ich nehme an, dass dein Video von der langen Version 3 stammt, denn Jacke, Tasche und Kopfhörer passen dazu.

## Version 4 (nach Test 1)
```
Vertical 9:16, handheld smartphone footage, 8 seconds, one continuous take, 28mm equivalent. The camera keeps the same distance from start to end, only a slight natural handheld sway, no push-in, no dolly, no zoom, no reframing. The woman and the shopping cart stay in the same place in the frame.

A woman in her early 30s with a loose low ponytail and a few flyaway strands, light freckles, no visible makeup, wearing a beige quilted jacket and a canvas tote bag on her left shoulder, stands in a busy supermarket aisle under flat white fluorescent light, holding the handle of a shopping cart. The cart stays at the bottom of the frame the whole time. A pair of silver over-ear headphones with smooth ear cups and a thin headband hangs around her neck and is clearly visible against her jacket from the very first frame. Behind her: shoppers with carts, a toddler crying in a cart seat, stacked boxes with blurred, unreadable packaging, price signs out of focus. No readable text anywhere in the frame.

Eyes: she blinks naturally, a quick blink about every three seconds, never keeping her eyes closed longer than half a second. Her gaze scans left, then right, then down at the cart.

Start: Audio: very loud, dense supermarket noise at full volume, rattling cart wheels, overlapping unintelligible voices, a toddler wailing, rhythmic scanner beeps, a distorted PA chime. She looks tense, jaw tight, shoulders raised.

Middle: She lets go of the cart handle, which stays exactly where it is. In one smooth motion she lifts the headphones from her neck with both hands, raises them and lowers them over her ears, then adjusts the left cup once. The headphones are never out of sight: they travel from her neck straight up to her head. Audio: the noise stays loud until the exact moment the ear cups touch her ears.

The instant the cups settle on her ears: Audio: the noise cuts out within a quarter of a second to almost complete silence, as if someone pressed a mute button. Only a very faint low air hum and her own breath remain. Behind her the shoppers keep moving and the toddler keeps crying with an open mouth, but silently.

End: Her shoulders drop, her jaw softens, she exhales slowly through her nose with her lips closed (she does not speak), one slow blink, then a faint relieved half-smile.

Style: photorealistic documentary look, natural skin texture with visible pores, slight facial asymmetry, mild handheld imperfection, soft white-green fluorescent colour cast, no colour grading, real-time speed, no slow motion. No music, no subtitles, no text overlays, nobody speaks.
```

### Version 4 kompakt
```
Vertical handheld smartphone video, 8 seconds, one take, camera keeps the same distance (no push-in, no zoom). A woman in her early 30s, loose ponytail with flyaway strands, light freckles, beige quilted jacket, stands in a crowded supermarket aisle under flat fluorescent light, holding a shopping cart that stays in the bottom of the frame. Silver over-ear headphones hang around her neck, clearly visible from the first frame. Very loud ambient audio: carts, scanners, overlapping voices, a crying toddler. She blinks naturally every ~3 seconds, never longer than half a second. She lets go of the cart, lifts the headphones from her neck with both hands straight up onto her ears. The instant the cups touch her ears the noise cuts to almost complete silence, as if muted; only a faint hum and her breath remain, while shoppers keep moving silently behind her. Her shoulders drop, she exhales through closed lips (no speaking), one slow blink, faint half-smile. Natural skin texture with pores, real-time speed, no readable text, no music.
```

## Ablauf im Gemini-Video-Tool (Veo)
1. Prüfe, ob Ton aktiviert ist. Eine Quelle nennt Audio als Einstellung, die nicht überall standardmäßig an ist.
2. Clip-Länge auf 8 Sekunden, Hochformat 9:16, falls wählbar. Veo 3.1 bietet laut Quelle 4, 6 oder 8 Sekunden.
3. Prompt Version 3 einfügen. Drei Durchläufe machen, weil das Ergebnis jedes Mal anders ausfällt.
4. Die beste Version speichern. Welche Tarife kostenlos Video erlauben, konnte ich nicht klären. Prüfe die Grenzen in deinem Konto.

## Echte Schleife: Ergebnis zurück an mich
Schick mir 2 bis 3 Standbilder (Sekunde 1, 4, 7) und beschreibe den Ton. Dann diagnostiziere ich nach dieser Tabelle und schreibe Version 4.

| Symptom | Wahrscheinliche Ursache | Änderung im Prompt |
|---|---|---|
| Haut glatt, wächsern | zu wenig Hautangaben | "visible pores, uneven skin tone, tiny blemish near the chin" ergänzen |
| Kopfhörer verformt oder verschmelzen mit Haaren | Aufsetz-Moment zu komplex | Kopfhörer schon auf den Ohren, sie berührt nur kurz den Bügel |
| Ton fällt nicht ab oder zu spät | Tonanweisung zu weich | "abruptly" und "within a quarter of a second" ergänzen |
| Hintergrund still von Anfang an | Ton-Auslöser fehlen | mehr konkrete Geräuschquellen, jede einzeln benennen |
| Gesichtsausdruck wechselt nicht | Mimik zu vage | Abfolge: "jaw tight, then jaw softens, then half-smile" |
| Schriftzüge verschmiert | Text im Bild | "all signage out of focus", mehr Tiefenunschärfe |
| Zeitlupe | Modell streckt Handlung | "real-time speed, no slow motion" und Handlung kürzen |
| Kamera zu ruhig und kinoartig | fehlende Handy-Anmutung | "slightly shaky, auto-exposure shifts when she moves" |

## Vergleichsprotokoll Gemini gegen Higgsfield
Beide Videos nebeneinander, Ton an. Je 0 bis 2 Punkte: Haut, Augen, Hände, Kopfhörer-Form, Bewegung, Ton-Wechsel, Mimik, Umgebung, Handy-Look. Maximal 18. Notiere Punkte und Dauer pro Version. So siehst du, ob der gelernte Prompt das günstigere Werkzeug an das teurere heranführt. Ein unabhängiger Beleg wäre das nicht, nur dein eigener Test.
