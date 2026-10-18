# Higgsfield: fertige Prompts für Hyperrealismus

Zum Kopieren. Eckige Klammern ersetzen. Reihenfolge: erst Standbilder (Prompt 1 bis 3), das beste als Referenz für Video (4, 5) und Motion Control (6). Hintergrund und Bewertungsbogen stehen in `../research/01-hyperrealismus.md`.

Regel: Keine Floskeln wie "8k", "masterpiece", "ultra realistic". Sie schieben das Ergebnis eher in den CGI-Look. Konkrete Kamera, Licht und Fehler benennen.

## Prompt 1: Alltags-Selfie (Handy-Look)
```
A candid smartphone selfie of a [age]-year-old [woman/man], [hair description], wearing [simple everyday clothing], sitting in a [real room, e.g. small kitchen with a slightly messy counter]. Shot on a phone front camera, 24mm equivalent, arm slightly extended, slight tilt, mild motion softness. Soft daylight from a window on the left mixed with a warm ceiling lamp. Visible skin texture, fine pores, a few uneven freckles, a small blemish near the chin, slightly asymmetric smile, a few flyaway hairs. No retouching. Avoid: airbrushed skin, plastic look, glossy highlights, perfect symmetry, beauty filter, studio lighting.
```

## Prompt 2: Halbnah-Porträt (Fotografen-Look)
```
Documentary-style portrait of a [age]-year-old [description] at a [real location], waist-up, looking just past the camera with a relaxed, slightly tired expression. Shot on a 50mm lens at f/2.2, natural overcast light, shallow depth of field, slight film grain. Real skin with visible pores and fine lines, uneven skin tone, small scar or mole, no makeup look, hair not perfectly styled. Clothing with natural creases. Background with ordinary clutter, not tidy. Avoid: HDR look, over-sharpening, symmetrical perfection, smooth skin, cinematic orange-teal grading.
```

## Prompt 3: Szene mit Handlung (UGC-Stil)
```
A [age]-year-old [description] holding [product or phone] and explaining something to the camera in a [real place, e.g. car parked on a street]. Handheld smartphone footage look, vertical framing, 26mm equivalent, slight shake, natural reflections on glass, daylight. Mouth slightly open mid-word, eyebrows slightly raised, visible teeth with minor irregularities. Real skin texture. Avoid: perfect teeth, plastic skin, studio backdrop, ring light reflections in eyes unless a ring light is in the scene.
```

## Prompt 4: Foto zu Video, ruhig und glaubwürdig
Referenzbild einsetzen, dann:
```
Subtle handheld smartphone motion. The person blinks naturally, shifts weight slightly, glances at the camera and back, small natural head movement. Slight camera drift, no zoom, no dramatic movement. Natural breathing. Keep face, skin texture and lighting identical to the reference image. 6 seconds.
```

## Prompt 5: Foto zu Video mit Sprechen (kurzer Satz)
```
The person says a short sentence in German: "[Satz, höchstens 12 Wörter]". Natural mouth shapes, relaxed jaw, small eyebrow movement on stressed words, a blink between phrases. Handheld, slight camera drift. Same face, same lighting as the reference image. 6 seconds.
```
Hinweis: Sprache und Lippenbewegung sind die häufigste Schwachstelle. Mehrere Versuche, den besten nehmen. Alternativ Workflow A mit eigenem Video.

## Prompt 6: Motion Control mit deinem Video
Kein langer Prompt nötig. Referenzbild plus dein Video hochladen und im Textfeld nur:
```
Keep the character's face, skin texture and clothing identical to the reference image. Natural lighting matching the reference. No beautification.
```
Dein Video: gleicher Ausschnitt wie das Referenzbild, ruhiger Hintergrund, 10 bis 30 Sekunden, Mund deutlich bewegen.

## Mini-Checkliste nach jeder Generierung
1. Auf 100 Prozent zoomen: Haut, Augen, Zähne, Finger.
2. Standbild aus dem Video bei Sekunde 1, 3 und 5 vergleichen. Bleibt das Gesicht gleich?
3. Ton aus, nur Bild ansehen. Wirkt es echt? Dann Ton an.
4. Verwerfen, wenn: Finger falsch, Zähne verschmolzen, Augen ohne Blick, Haut wächsern.

## Prompt für ChatGPT: dein Prompt-Veredler
```
Du bist Fotograf und Prompt-Engineer. Ich gebe dir eine Idee für ein Bild oder Video einer Person. Schreibe daraus einen Prompt für ein Bildmodell nach diesem Muster: Person, Kleidung, Handlung, Ort, Kamera mit Objektiv und Blende, Licht, Hauttextur und Imperfektionen, Ausschlussliste. Keine Qualitätsfloskeln wie 8k oder masterpiece. Nur konkret sichtbare Dinge. Gib drei Varianten mit unterschiedlichem Licht. Idee: [deine Idee]
```
