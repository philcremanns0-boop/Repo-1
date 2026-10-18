# Prompt-System: Google Flow (gratis) und Higgsfield (Premium)

Stand 18.10.2026, nach Test 1 und Test 2 der Supermarkt-Szene. Die Modellangaben zu Higgsfield stammen aus dem Modellkatalog des Higgsfield-Zugangs (Parameter und Rollen), Preise stehen dort nicht. Zu Flow stützen sich die Angaben auf Googles Veo-3.1-Berichte: Frames to Video (Start- und Endbild), Ingredients to Video und Ton in allen Modi.

## Die Arbeitsteilung
| | Google Flow (gratis, unbegrenzt) | Higgsfield (Credits) |
|---|---|---|
| Aufgabe | Standbilder (Nano Banana), Ablauf und Idee testen | nur das beste Endergebnis |
| Eingabe | Text, Startbild, Endbild | Startbild und Endbild, die du in Flow gratis erzeugt hast |
| Prompt | lang und beschreibend (Veo versteht Zeitleisten) | kurz, nur Bewegung (das Bild liefert den Look) |
| Ton | im Prompt verlangen, aber später ersetzen | nach Möglichkeit "aus" und in der Nachbearbeitung vertonen |

Wichtigste Regel: **Der Look kommt aus den Bildern, die Bewegung aus dem Prompt.** Alles, was im Video später da sein oder fehlen soll (Kopfhörer am Hals, leerer Hals danach), legst du mit Start- und Endbild fest, nicht mit Text.

## Warum "Prompt V4" nicht der richtige Higgsfield-Prompt ist
V4 ist ein langer Text-zu-Video-Prompt im Veo-Stil. Er hatte außerdem einen Denkfehler: "Kopfhörer hängen um den Hals, von Anfang an sichtbar" plus "sie hebt sie vom Hals". Das Modell hält den Satz über den Hals für einen dauerhaften Zustand und zeichnet nach dem Aufsetzen ein neues Paar. Auf Higgsfield nimmst du stattdessen Bild-zu-Video mit Start- und Endbild. Der Prompt dort ist kurz.

## Lehren aus Test 2 (Flow, Version 4)
| Beobachtung | Ursache | Gegenmittel |
|---|---|---|
| Zweites Kopfhörerpaar am Hals ab 3,2 s | Zustand "hängt um den Hals" blieb im Prompt bestehen | Endbild mit leerem Hals, im Prompt "danach ist der Hals leer" |
| Dauerhaftes tiefes Brummen (unter 400 Hz um -34 dB) | Prompt verlangte "faint low hum" | "no hum, no rumble, no room tone", oder Ton in der Nachbearbeitung |
| Ton nicht still | Modell hält Ambiente weiter | Ton nachträglich ersetzen |
| Wagen im Bild, Kopfhörer zu Beginn sichtbar | funktioniert | beibehalten |
| Blinzeln in den ersten 3 s natürlich (1,0 s und 3,2 s) | funktioniert | beibehalten |
| Danach Augen 1,3 s und 0,8 s zu | "slow blink" und "eyes close" werden als lange Lidschlussphase gerendert | maximal eine entspannte, längere Phase, und die Dauer nennen ("about 0.6 seconds") |
| Hände unscharf beim Aufsetzen | schnelle Bewegung | Bewegung ruhiger, "slow and deliberate", Endbild fixiert das Ergebnis |

## Track 1: Google Flow
### F1: Startbild (Nano Banana, 9:16)
```
Vertical 9:16 photograph taken on a smartphone. A woman in her early 30s with a loose low ponytail and a few flyaway strands, light freckles, no visible makeup, wearing a beige quilted jacket with a canvas tote bag on her left shoulder, stands in a busy supermarket aisle under flat white fluorescent light, gripping the handle bar of a shopping cart with both hands. The cart's handle bar runs across the bottom of the frame. A pair of silver over-ear headphones with smooth aluminium ear cups hangs around her neck, resting on her chest. She looks tense: jaw tight, shoulders slightly raised, gaze to the left. Behind her: shoppers with carts, a toddler crying in a cart seat, stacked boxes with blurred packaging, price signs out of focus, no readable text. Chest-height camera, 28mm equivalent, slight handheld tilt, natural skin texture with visible pores, slight facial asymmetry, soft white-green fluorescent colour cast, no retouching, no beauty filter, no HDR.
```

### F2: Endbild (mit dem Startbild als Referenz)
```
Use the first image as reference: same woman, same face, same jacket, same bag, same supermarket aisle, same camera position and distance, same cart handle bar at the bottom of the frame. Change only this: the silver over-ear headphones now sit on her ears with the headband over her head. Her neck and chest are completely bare, nothing hangs around her neck. Her hands rest lightly on the cart handle. Her shoulders are relaxed, jaw soft, lips closed, eyes open, with a faint, relieved half-smile. The shoppers behind her and the crying toddler are unchanged. No other changes.
```

### F3: Video, Frames to Video (Start- und Endbild einsetzen)
```
She lets go of the cart handle and lifts the silver over-ear headphones from her neck with both hands in one smooth, deliberate motion, raises them over her head and lowers them onto her ears, then rests her hands on the cart handle again. Once she has lifted them, her neck stays bare: no headphones hang around her neck at any point afterwards. Handheld smartphone footage, the camera keeps the same distance, no push-in, no zoom, real-time speed, no slow motion. She blinks naturally, a quick blink about every three seconds. Only once, after the headphones are on, her eyes close for about 0.6 seconds. Her lips stay closed, she does not speak.
Audio: very loud, dense supermarket noise (rattling carts, overlapping unintelligible voices, a toddler wailing, scanner beeps, a PA chime) until the exact moment the ear cups touch her ears. At that moment all sound stops completely, total silence, as if muted. No hum, no rumble, no room tone, no music, no background noise at all. Afterwards the only sounds are her slow, deep, audible breath in through the nose and out through slightly parted lips.
```

### F4: Video nur mit Text (falls Flow keinen Endbild-Modus anbietet), Version 5
```
Vertical 9:16, handheld smartphone footage, 8 seconds, one continuous take, 28mm equivalent. The camera keeps the same distance from start to end, only slight natural handheld sway, no push-in, no zoom. The woman and the shopping cart stay in the same place in the frame.

A woman in her early 30s with a loose low ponytail, a few flyaway strands, light freckles, no visible makeup, beige quilted jacket, canvas tote bag on her left shoulder, stands in a busy supermarket aisle under flat white fluorescent light, holding the cart handle. Silver over-ear headphones hang around her neck at the start. Behind her: shoppers with carts, a toddler crying in a cart seat, blurred boxes, out-of-focus price signs, no readable text.

First 2 seconds: very loud, dense supermarket noise: rattling carts, overlapping unintelligible voices, a toddler wailing, scanner beeps, a PA chime. She looks tense, scans left, then right.

Then: she lets go of the handle and in one smooth, deliberate motion lifts the headphones from her neck with both hands, raises them over her head and lowers them onto her ears. From that moment on her neck is completely bare: there is only one pair of headphones in the whole shot and it is on her head. The noise stays loud until the exact moment the cups touch her ears, then all sound stops completely, total silence as if muted: no hum, no rumble, no room tone, no music.

Last 4 seconds: she rests her hands on the cart handle, shoulders drop, jaw softens, lips closed. Audible only: her slow, deep breath in through the nose and out through slightly parted lips. Behind her the shoppers keep moving and the toddler keeps crying with an open mouth, but silently. She blinks naturally every three seconds, once longer (about 0.6 seconds) after the headphones are on, then a faint, relieved half-smile.

Style: photorealistic documentary look, natural skin texture with visible pores, slight facial asymmetry, soft white-green fluorescent colour cast, no colour grading, real-time speed, no slow motion. No subtitles, no text overlays, nobody speaks.
```

## Track 2: Higgsfield
### Modelle laut Katalog (Start- und Endbild plus Tonschalter, 9:16)
| Modell | Start und Ende | Ton | Dauer | Hinweis |
|---|---|---|---|---|
| Kling v3.0 | ja | an oder aus ("aus" spart laut Katalog Credits) | 3 bis 15 s | Modi std, pro, 4k. Trägt das Merkmal "unlim", für dein Konto war das beim Abruf nicht verfügbar |
| Kling 3.0 Omni (Frames) | ja | an oder aus | 3 bis 15 s | Erstes Bild und optional letztes Bild |
| Seedance 2.0 Mini | ja | an oder aus | 4 bis 15 s | Schnell und günstig, nur 480p und 720p. Trägt "unlim", nicht verfügbar bei dir beim Abruf |
| Seedance 2.0 | ja | an oder aus | 4 bis 15 s | Höhere Qualität, bis 4k im Standardmodus |
| Gemini Omni Flash 1.1 | ja | nativer Ton | 3 bis 10 s | Google-Modell (vermutlich das, was du "Gemini Video Flash" nennst), 9:16 |
| Seedance 1.5 Pro | ja | an oder aus | 4, 8, 12 s | Zuverlässige Bewegung |
Preise stehen im Katalog nicht. Mein Vorschlag: Zuerst ein Durchlauf mit dem günstigsten Modell (Seedance 2.0 Mini), Ton aus. Wenn Ablauf und Gesicht stimmen, den Endlauf mit Kling v3.0 im Pro-Modus. Notiere den Creditverbrauch jedes Laufs.

### H1: Prompt für Higgsfield (Startbild F1 und Endbild F2 hochladen)
```
Same shot as the start frame, ending on the end frame. In one smooth, deliberate motion she lets go of the cart handle, lifts the headphones from her neck with both hands, raises them over her head and lowers them onto her ears, then rests her hands on the cart handle. Her neck is bare afterwards, there is only one pair of headphones in the shot. Handheld smartphone footage, same camera distance, no push-in, no zoom, real-time speed. Natural blink about every 3 seconds, one longer relaxed blink of about 0.6 seconds after the headphones are on. Lips closed, she does not speak.
```
### H1b: Ton-Zusatz (nur wenn das Modell Ton erzeugen soll)
```
Audio: very loud supermarket noise until the cups touch her ears, then total silence except her slow, deep breath. No hum, no room tone, no music.
```
Besser: Ton aus und in der Nachbearbeitung vertonen (siehe unten).

## Ton in der Nachbearbeitung (der sichere Weg)
Kein Videomodell hält "Stille bis auf den Atem" zuverlässig ein. Es geht in der Nachbearbeitung:
1. Video erzeugen (Ton egal oder aus).
2. Video in den Chat hochladen und die Sekunde nennen, in der die Ohrmuscheln die Ohren berühren.
3. Ich liefere zurück: Lärm bis zu dieser Sekunde, harter Abfall, dann Stille und zwei tiefe Atemzüge. Der Atem ist synthetisch, die Lautstärke lässt sich ändern.
Bei Test 2 funktionierte das: Lärm um -20 bis -24 dB, ab 3,25 s Stille unter -70 dB, Atemspitzen bei -29 bis -38 dB (Messwerte, nicht gehört). Wenn du echten Atem willst, nimm ihn mit dem Handy auf (ruhiger Raum, 10 Sekunden) und gib ihn mir.

## Ablauf pro Szene
1. In Flow Startbild F1 erzeugen (10 Varianten, bestes wählen).
2. Endbild F2 mit F1 als Referenz erzeugen, bis der Hals leer und das Gesicht gleich ist.
3. In Flow F3 testen (so viele Läufe wie nötig). Bewertung mit dem Protokoll aus `video-supermarkt-ruhe.md`.
4. Gewinner-Bilder bei Higgsfield als Start- und Endbild hochladen, H1 laufen lassen, Ton aus.
5. Ton über mich nachbearbeiten.
6. Vor Veröffentlichung kennzeichnen (Instagram "AI info", TikTok).
