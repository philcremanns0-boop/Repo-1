# Our Museum

Ein kleines 3D-Museum im Browser – nachgebaut nach dem Video: heller Galerieraum mit dunkler Decke,
freistehende schwarze Wand, Bilderrahmen mit Wandstrahlern, Wand-Screen, Bänke, Schild „For Emma“,
zwei Figuren mit Namensschildern, Sitzen, Tanzen, Winken, Chat-Blasen und „Viewing“-Modus für Bilder.

* **Single Player** oder **Multiplayer** (Raum-Code / Einladungslink, direkt Peer-to-Peer, kein eigener Server nötig)
* Loading Screen mit **echtem Fortschritt** (Schriften, Fotos, Video, GPU-Upload, Shader-Kompilierung) + Mindestdauer
* Läuft auf Desktop (WASD + Maus) und Handy/Tablet (Joystick + Wischen)

## Starten

```bash
cd museum
npm install
npm run dev        # http://localhost:5173
npm run build      # → dist/
```

## Deine Fotos & dein Video einfügen

1. Fotos in **`src/photos/`** legen (jpg/png/webp). Sie werden alphabetisch auf die Rahmen verteilt
   (die ersten landen an den prominentesten Plätzen). Gibt es weniger Fotos als Rahmen, wiederholen sie sich.
   Das Format (Hoch-/Querformat) wird automatisch erkannt, der Rahmen passt sich an.
2. Optional vorher verkleinern (empfohlen, spart Ladezeit):
   `npm run photos -- /pfad/zu/originalen` → schreibt web-optimierte `.webp` nach `src/photos/`.
3. Video für den Wand-Screen: **`src/media/video.mp4`** (oder `.webm`). Es läuft stumm in Schleife.
   Ohne Datei läuft ein animierter Sonnenuntergang als Platzhalter.
4. Namen, Schild-Text, Sprache: **`src/config.js`** (`from`, `to`, `plaque`, `lang`).

## Auf Vercel deployen

Das Repo enthält neben dem Museum noch ein anderes Projekt im Wurzelordner. Deshalb in Vercel beim Import:

* **Root Directory:** `museum`
* Framework: Vite (wird erkannt) · Build `npm run build` · Output `dist`

Fertig – `vercel.json` (Caching, Header) liegt schon im Ordner.

## Multiplayer – wie es funktioniert

* Spieler 1 klickt **Multiplayer → Raum erstellen** und bekommt einen 5-stelligen Code (z. B. `K7QM2`)
  plus „Link kopieren“ oben links im Spiel.
* Spieler 2 öffnet die Seite, gibt den Code unter **Join** ein (oder öffnet den Link `…/?room=K7QM2`).
* Technik: WebRTC über [PeerJS](https://peerjs.com). Der kostenlose PeerJS-Cloud-Broker wird nur für den
  Verbindungsaufbau gebraucht, danach laufen die Daten direkt zwischen den Browsern (Host verteilt an bis zu 6 Spieler).
  Es gibt keinen eigenen Server → funktioniert auf Vercel ohne Zusatzkosten.
* Grenzen: Der Host muss im Raum bleiben. Hinter sehr strikten Firmen-/Mobilfunk-NATs kann WebRTC ohne TURN-Server
  scheitern; für Zuhause/WLAN/normales LTE klappt es fast immer. Bei Bedarf lässt sich in `src/net.js` ein
  eigener PeerServer oder TURN-Server eintragen (`peerOptions()`).

## Steuerung

| Aktion | Desktop | Handy |
|---|---|---|
| Laufen / Rennen | WASD / Shift | Joystick |
| Umsehen | Maus ziehen, Pfeil links/rechts, Mausrad = Zoom | Wischen |
| Bild ansehen / Hinsetzen | E (am Bild bzw. an der Bank) | Button |
| Aufstehen | F oder E | Button |
| Tanzen / Winken | G / H | ♪ |
| Chat | Enter | 💬 |

## Performance – was dahintersteckt

* **Keine Modelle, keine Texturen-Downloads** für Raum & Figuren: alles prozedural (Bundle ≈ 190 KB gzip inkl. Three.js,
  Multiplayer-Code wird erst bei Bedarf nachgeladen).
* Statische Geometrie wird pro Material zu wenigen Meshes zusammengefasst (~70 Draw-Calls, ~23k Dreiecke).
* Figuren sind Pivot-Hierarchien mit prozeduraler Animation (kein Skinning), Schatten sind Blob-/Kontakt-Decals statt Shadow-Maps.
* Fotos werden vor dem Start dekodiert, auf max. 1600 px skaliert, mit Mipmaps & Anisotropie auf die GPU geladen.
  Der Loading Screen wartet, bis **alles** geladen, hochgeladen und kompiliert ist (und mindestens `minLoadingMs`).
* **Adaptive Auflösung**: fällt die Framerate, senkt das Spiel automatisch die Pixeldichte und erhöht sie wieder, wenn Luft ist.
