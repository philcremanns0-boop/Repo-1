# Prompt-System: Google Flow (gratis) und Higgsfield (Premium)

Stand 18.10.2026, nach Test 1 und Test 2 der Supermarkt-Szene. Die Modellangaben zu Higgsfield stammen aus dem Modellkatalog des Higgsfield-Zugangs (Parameter und Rollen), Preise stehen dort nicht. Zu Flow stützen sich die Angaben auf Googles Veo-3.1-Berichte: Frames to Video (Start- und Endbild), Ingredients to Video und Ton in allen Modi.

## Die Arbeitsteilung
| | Google Flow (tägliche Gratis-Credits) | Higgsfield (Credits) |
|---|---|---|
| Aufgabe | Ablauf und Idee testen, solange die Credits reichen | Tests und Endergebnis (Credits pro Lauf sind niedrig, siehe unten) |
| Eingabe | Text, Startbild, Endbild | Startbild und Endbild, die du in Flow gratis erzeugt hast |
| Prompt | lang und beschreibend (Veo versteht Zeitleisten) | kurz, nur Bewegung (das Bild liefert den Look) |
| Ton | im Prompt verlangen, aber später ersetzen | nach Möglichkeit "aus" und in der Nachbearbeitung vertonen |

Wichtigste Regel: **Der Look kommt aus den Bildern, die Bewegung aus dem Prompt.** Alles, was im Video später da sein oder fehlen soll (Kopfhörer am Hals, leerer Hals danach), legst du mit Start- und Endbild fest, nicht mit Text.

## Fakten aus der Gegenrecherche (ChatGPT, Abruf 18.10.2026, von mir nicht geprüft)
**Google Flow.** "Kostenlos unbegrenzt" stimmt laut ChatGPT nicht. Ohne Abo gibt es 50 Credits pro Tag. Veo 3.1 Lite kostet 10 Credits pro Video (5 Videos pro Tag), Fast 20, Quality 100. Gemini Omni Flash kostet bei 720p und 8 s 12 Credits, bei 360p 6 Credits. Nicht abonnierte Nutzer können zwischen etwa 14 und 17 Uhr UTC eingeschränkt sein. Dein Zähler in Flow zeigt, was bei dir wirklich gilt. Start- und Endbild gibt es bei allen Veo-3.1-Modellen und Omni Flash, in 9:16, 4, 6 oder 8 Sekunden (Omni auch 10). Ingredients to Video: laut Google-Leitfaden bis zu 3 Referenzbilder. **In den Projekteinstellungen gibt es "Return silent videos"**, dann sind alle Videos stumm. Ein getrennter Ton-Export ist nicht belegt.

**Higgsfield (Preflight-Kosten laut ChatGPT, 9:16, 1 Ergebnis, Unlimited aus):**
| Modell | Dauer | Ton an | Ton aus |
|---|---|---|---|
| Kling v3.0 std | 5 s | 8,75 | 6,25 |
| Kling v3.0 std | 10 s | 17,5 | 12,5 |
| Kling v3.0 pro | 5 s | 10 | 7,5 |
| Kling v3.0 pro | 10 s | 20 | 15 |
| Seedance 2.0 Mini (720p) | 5 s | 5 | 5 |
| Seedance 2.0 Mini (720p) | 10 s | 10 | 10 |
| Seedance 2.0 std (720p) | 5 s | 22,5 | 22,5 |
| Gemini Omni Flash 1.1 (720p) | 8 s | 24 | nicht erfasst |
Die Higgsfield-Oberfläche zeigt vor dem Start den Preis, nimm diesen als Maßstab. Mit deinem Stand von 840,75 Credits wären das rund 134 Kling-std-Läufe zu 5 s ohne Ton oder rund 168 Seedance-Mini-Läufe zu 5 s. **Das ist deutlich günstiger, als ich angenommen hatte.** Iterieren bei Higgsfield ist also vernünftig, wenn du dort Start- und Endbild nutzt. Unlimited-Angebote: laut ChatGPT Kling 3.0 nur 7 Tage auf bestimmten Jahrestarifen, Seedance 2.0 für Team-Tarife, Mini unklar, Omni Flash 1.1 keine Zusage. Bei deinem Konto war Unlimited beim Abruf nicht verfügbar.

**Bildmodelle bei Higgsfield (aus dem Modellkatalog):** Higgsfield Soul 2.0 ("realistic UGC, fashion editorial and character generation", mit Soul-ID und genau einem Referenzbild), Nano Banana Pro (Bild-zu-Bild mit Referenzbildern), Kling O1 Image, GPT Image 2 (OpenAI, mit Bearbeitung). Für realistische Menschen ist Soul 2.0 am ehesten gebaut. Für das Endbild (Startbild als Referenz, ein Gegenstand ändert sich) passt Nano Banana Pro besser, weil es mehrere Referenzbilder nimmt. Bildpreise stehen im Katalog nicht.

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

## Warum die KI Gegenstände aus dem Nichts erzeugt (Erklärung, teils Vermutung)
Ich kann nicht in die Modelle hineinsehen. Diese Erklärung beruht auf dem, was über solche Modelle allgemein bekannt ist, und auf dem, was in deinen Videos zu sehen ist.
1. **Kein Objektgedächtnis.** Ein Videomodell führt keine Liste "Objekt Kopfhörer, Ort Hals, jetzt Ort Kopf". Es erzeugt Bilder, die zu den vorherigen Bildern und zum Text *plausibel* aussehen. Dass ein Gegenstand nur einmal existiert und sich bewegt statt zu kopieren, ist nur eine gelernte Gewohnheit, keine Regel. Je länger der Clip, desto mehr Fehler sammeln sich an. Am Anfang ist es meist am besten.
2. **Bewegen heißt für das Modell zweimal ändern.** Am alten Ort muss etwas verschwinden und am neuen Ort erscheinen. Das ist schwerer als etwas bestehen zu lassen. Typischer Fehler: Der neue Ort entsteht, der alte bleibt als Geist aus den früheren Bildern stehen. Das siehst du bei den Kopfhörern.
3. **Starke Gewohnheiten aus den Trainingsdaten.** Menschen mit Over-Ear-Kopfhörern tragen sie sehr oft um den Hals oder auf dem Kopf. Das Bild "Kopfhörer am Hals" ist ein häufiges Muster. Das Modell fällt dorthin zurück.
4. **Verneinungen funktionieren schlecht.** Wenn der Prompt "neck bare, no headphones around neck" sagt, steht das Wort für Kopfhörer am Hals im Text und kann das Gegenteil bewirken ("denke nicht an einen Elefanten"). Das ist eine Vermutung, passt aber zu dem, was du siehst: Je mehr ich den Hals erwähnt habe, desto sicherer taucht das Paar auf. Deshalb: den Hals gar nicht erwähnen, und den Zustand nur positiv beschreiben.
5. **Ton ist ein eigener Schritt.** Der Ton wird zusätzlich zum Bild erzeugt. In den Trainingsvideos gibt es fast immer Umgebungsgeräusche, echte Stille ist selten. Das Modell neigt deshalb zu Grundrauschen, auch wenn du "silence" schreibst. Verneinungen wie "no hum" helfen wieder nur wenig.

**Was daraus folgt:**
- Kurze Clips (3 bis 5 Sekunden) mit nur einer Veränderung pro Clip, dann schneiden.
- Gegenstände nicht über eine große Strecke bewegen lassen, wenn es sich vermeiden lässt.
- Zustände positiv beschreiben, Verneinungen vermeiden, störende Begriffe weglassen.
- Start- und Endbild nur nutzen, wenn die Bilder gut sind (siehe unten, ChatGPT statt Flow).
- Ton immer in der Nachbearbeitung machen.

## Wofür ist welcher Prompt im Paket?
| Prompt | Werkzeug | Wofür |
|---|---|---|
| Master-Prompt | ChatGPT Work | Recherche-Aufgaben abarbeiten (Nocieling, Instagram, Design-Kritik, Fakten). Hat nichts mit Video zu tun |
| F1, F2 | ChatGPT (oder Flow) | Start- und Endbild für die Supermarkt-Szene |
| F3 | Flow, nur wenn Start- und Endbild gut sind | Video zwischen zwei Bildern |
| F4 | Flow ohne Bilder | Video nur aus Text |
| H1, H1b | Higgsfield | Endergebnis aus Start- und Endbild |
| Foto-Prompt 1 bis 3 | ChatGPT oder Higgsfield-Bildmodelle | Realistische Personen als Standbilder: Basis für Werbung, Social Media oder das Gesicht für einen Face Swap |
| Foto-Prompt 4 und 5 | Higgsfield | Ein Standbild animieren (ruhige Bewegung, kurzer Satz) |
| Foto-Prompt 6 | Higgsfield | Deine eigene Videoaufnahme steuert die Figur (Motion Control) |
| Prompt-Veredler | ChatGPT | Macht aus einer Idee in Worten einen guten Prompt |
Für Standbilder genügt ChatGPT, weil du dort laut deiner Angabe beliebig viele erzeugen kannst und nur jedes zehnte gut sein muss. Higgsfield brauchst du für Video, Motion Control und Face Swap.

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
Preise stehen weiter oben (laut ChatGPT). Vorschlag: Tests mit Seedance 2.0 Mini (5 Credits für 5 s) oder Kling v3.0 std ohne Ton (6,25 Credits für 5 s), den Endlauf mit Kling v3.0 pro. Notiere den Creditverbrauch jedes Laufs.

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
1. Video erzeugen, am besten stumm: in Flow Projekteinstellungen "Return silent videos", bei Higgsfield Ton aus.
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

## Test 3: Varianten ohne Start- und Endbild (alle in Flow, je 3 Läufe)
Start- und Endbild in Flow haben bei dir nicht funktioniert, weil die Bilder schlecht waren. Diese drei Varianten brauchen keine Bilder und vermeiden den Gegenstand, der sich über eine große Strecke bewegt. Der Hals wird nirgends erwähnt. Es sind Hypothesen, der Test zeigt, welche trägt.

### V-A: Kopfhörer in der Hand
```
Vertical 9:16, handheld smartphone footage, 6 seconds, one continuous take, 28mm equivalent, the camera keeps the same distance, no push-in, no zoom. A woman in her early 30s with a loose low ponytail, flyaway strands, light freckles, no visible makeup, beige quilted jacket, canvas tote bag on her left shoulder, stands in a busy supermarket aisle under flat white fluorescent light. Her left hand rests on a shopping cart handle at the bottom of the frame. In her right hand she holds a pair of silver over-ear headphones in front of her chest. Behind her: shoppers with carts, a toddler crying in a cart seat, blurred boxes, out-of-focus price signs, no readable text.
Audio: very loud, dense supermarket noise: rattling carts, overlapping unintelligible voices, a toddler wailing, scanner beeps. She looks tense and scans left, then right. Then, in one slow deliberate motion, she raises the headphones with both hands straight up to her head and lowers them onto her ears. The loud noise continues until the exact moment the ear cups touch her ears, then stops completely. Total silence. Her hands rest on the cart handle, shoulders drop, lips closed, one slow breath in through the nose and out through slightly parted lips, a faint relieved half-smile. She blinks naturally about every three seconds. Real-time speed, natural skin texture with visible pores, no music, nobody speaks.
```

### V-B: Knopfdruck, kein Gegenstand wird bewegt
```
Vertical 9:16, handheld smartphone footage, 6 seconds, one continuous take, 28mm equivalent, the camera keeps the same distance, no push-in, no zoom. A woman in her early 30s with a loose low ponytail, flyaway strands, light freckles, no visible makeup, beige quilted jacket, canvas tote bag, wearing silver over-ear headphones on her head, stands in a busy supermarket aisle under flat white fluorescent light, holding a shopping cart handle at the bottom of the frame. Behind her: shoppers with carts, a toddler crying in a cart seat, blurred boxes, out-of-focus price signs, no readable text.
Audio: very loud, dense supermarket noise: rattling carts, overlapping unintelligible voices, a toddler wailing, scanner beeps, even though she wears the headphones. She looks tense and scans left, then right. Then she lifts one hand and presses a small button on top of the right ear cup with her index finger. At the exact moment of the press, all sound stops completely. Total silence. Her hand returns to the cart handle, shoulders drop, lips closed, one slow breath in through the nose and out through slightly parted lips, a faint relieved half-smile. Behind her the shoppers keep moving and the toddler keeps crying with an open mouth, silently. She blinks naturally about every three seconds. Real-time speed, natural skin texture with visible pores, no music, nobody speaks.
```

### V-C: Zwei kurze Clips, geschnitten
Clip 1 (4 Sekunden):
```
Vertical 9:16, handheld smartphone footage, 4 seconds, 28mm equivalent, same distance, no push-in. A woman in her early 30s, loose low ponytail, flyaway strands, light freckles, beige quilted jacket, canvas tote bag, stands in a busy supermarket aisle under flat white fluorescent light, one hand on a shopping cart handle at the bottom of the frame, silver over-ear headphones in her other hand in front of her chest. Behind her: shoppers, a toddler crying in a cart seat, blurred boxes, no readable text. Audio: very loud supermarket noise. She looks tense, scans left, then raises the headphones with both hands slowly towards her ears. The clip ends the moment the ear cups touch her ears. Natural skin texture, real-time speed, no music, nobody speaks.
```
Clip 2 (4 Sekunden), anderes Setup:
```
Vertical 9:16, handheld smartphone footage, 4 seconds, 28mm equivalent, same distance, no push-in. The same woman, same beige quilted jacket and bag, same supermarket aisle, wearing silver over-ear headphones on her head, both hands resting on a shopping cart handle at the bottom of the frame. Her shoulders drop, her jaw softens, lips closed, she breathes in slowly through the nose and out through slightly parted lips, then a faint relieved half-smile. Behind her the shoppers keep moving and a toddler cries with an open mouth, silently. Audio: silence, only her slow breath. She blinks naturally once or twice. Natural skin texture, real-time speed, no music, nobody speaks.
```
Clip 2 passt zu Clip 1 nur, wenn Frau und Raum gleich aussehen. Das gelingt am besten, wenn du das letzte Bild von Clip 1 als Referenzbild oder Startbild für Clip 2 verwendest. Geschnitten wird beim Kontakt der Ohrmuscheln.

## Start- und Endbild: ChatGPT hat bei dir nicht funktioniert
Stand 18.10.: Die Bilder aus ChatGPT waren bei dir unbrauchbar, die aus Flow ebenfalls. Der Katalog von Higgsfield nennt dafür andere Modelle: **Soul 2.0** (gebaut für realistische UGC-Menschen) für das Startbild und **Nano Banana Pro** (nimmt Referenzbilder) für das Endbild mit dem Startbild als Referenz. Preise stehen im Katalog nicht, schau sie vor dem Start in der Higgsfield-Oberfläche an und mache zuerst nur zwei oder drei Bilder. Schick mir ein, zwei der schlechten Bilder, dann sage ich dir, woran es liegt (Haut, Licht, Gesicht, Hände) und passe den Prompt an.

Der folgende Ablauf gilt für jedes Bildmodell, auch für ChatGPT, falls es später besser klappt:
1. Startbild: F1 in ChatGPT einfügen und vier Varianten anfordern, die beste wählen.
2. Endbild: das gewählte Bild hochladen und ein *Bearbeiten* verlangen (nicht neu erzeugen). So bleiben Gesicht und Raum gleich.
```
Bearbeite genau dieses Bild und ändere nur das Folgende: Die silbernen Over-Ear-Kopfhörer sitzen jetzt auf ihren Ohren, das Kopfband liegt über dem Kopf. Am Hals und auf der Brust hängt nichts, man sieht nur die beige Jacke und den Kragen. Die Hände liegen locker am Griff des Einkaufswagens, die Schultern sind entspannt, die Lippen geschlossen, die Augen offen, ein leichtes, erleichtertes Halblächeln. Alles andere bleibt unverändert: gleiche Frau, gleiches Gesicht, gleiche Jacke, gleiche Tasche, gleicher Gang, gleiche Kameraposition, gleiche Menschen im Hintergrund, gleiches Licht. Gib nur das bearbeitete Bild aus.
```
3. Prüfen: Gleiche Frau? Gleicher Hintergrund? Hals leer? Wenn nicht, neu bearbeiten lassen.
4. Dann bei Higgsfield Start- und Endbild hochladen (H1) oder in Flow als Referenzbild nutzen, falls Start- und Endbild dort wieder schlecht werden.
