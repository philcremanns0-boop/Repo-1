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
