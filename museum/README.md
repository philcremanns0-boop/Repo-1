# Our Museum

Ein kleines 3D-Museum im Browser (Three.js + Vite) – Single- oder Multiplayer, Musik, zwei Sprachen.

**Aufbau:** Eingangshalle (Hero-Foto, Schild, Bank) mit drei Türen und einem Exit:
`About us` (klein) · `Moments` (Erlebnisse, Screen, schwarze Wand) · `Words` (Bücher zum Lesen, Teppich, Regale)
· **Exit** → Fade zu Schwarz → „I love you“ / „Te quiero“.

* Figuren: Seb & Mia (an La La Land angelehnt). Beim Namen entscheidet ein kleines System (Namenslisten + Endungen),
  wer man ist – mit „switch“ zum Korrigieren.
* Musik-Box unten (Zurück / Play-Pause / Weiter / Fortschritt / Lautstärke).
* Sprache: Englisch (Standard) oder Spanisch (Chile) – Umschalter **EN | ES** oben rechts, alles inkl. Schilder & Bücher.
* Multiplayer: 5-stelliger Raum-Code oder Einladungslink, direkt Peer-to-Peer (kein eigener Server).

## Starten

```bash
cd museum
npm install
npm run dev        # http://localhost:5173
npm run build      # → dist/
```

## Inhalte einsetzen

| Was | Wohin | Hinweis |
|---|---|---|
| Hero-Foto (Eingangshalle) | `src/photos/hero.webp` (oder jpg/png) | |
| About us | `src/photos/us/*` | 7 Rahmen, alphabetisch |
| Moments (Erlebnisse) | `src/photos/moments/*` | 6 Rahmen; leer → schlichte Platzhalter |
| Video für den Screen | `src/media/video.mp4` (oder `.webm`) | läuft stumm in Schleife, Bereich „Moments“ |
| Musik | `src/media/music/*.mp3` | alphabetisch; Titel/Künstler in `src/config.js` (`MUSIC_TITLES`) |
| Bücher | `src/books/*.md` | eine Datei = ein Buch auf einem Lesepult (max. 6) |
| Namen, Schild, Exit-Text, Bildunterschriften | `src/config.js` | alles zweisprachig `{ en, es }` |

Fotos vorher verkleinern spart Ladezeit: `npm run photos -- /pfad/zu/originalen` (schreibt `.webp` nach `src/photos/`;
anschließend in den passenden Unterordner verschieben).

**Bücher-Format** (`src/books/01-mein-text.md`):

```
# Titel
Text … (Absätze durch Leerzeile trennen)
=== es
# Título
Texto …
```
Der Block nach `=== es` ist optional – ohne ihn wird auch im Spanisch-Modus der englische Text gezeigt.

## Auf Vercel deployen

Im Repo-Wurzelordner liegt noch ein anderes Projekt. Deshalb in Vercel beim Import:

* **Root Directory:** `museum`
* Framework: Vite (wird erkannt) · Build `npm run build` · Output `dist`

> Hinweis: Alles in `src/photos`, `src/media` und `src/books` wird mit der Seite öffentlich ausgeliefert.
> Wer den Link kennt, kann die Fotos sehen. Das GitHub-Repo sollte auf **privat** stehen. Die Songs sind urheberrechtlich
> geschützt – für ein privates Geschenk an eine Person ok, für eine öffentlich auffindbare Seite eher nicht.

## Multiplayer

* Spieler 1: **Multiplayer → Raum erstellen** → Code (z. B. `K7QM2`) + „Link kopieren“ oben links.
* Spieler 2: Code unter **Join** eingeben oder Link `…/?room=K7QM2` öffnen.
* Technik: WebRTC über [PeerJS](https://peerjs.com); der kostenlose Cloud-Broker wird nur zum Verbindungsaufbau genutzt.
  Host verteilt an bis zu 6 Spieler. Der Host muss im Raum bleiben. Hinter sehr strikten Firmen-/Mobilfunk-NATs kann
  WebRTC ohne TURN scheitern (in `src/net.js` → `peerOptions()` lässt sich ein eigener Server/TURN eintragen).

## Steuerung

| Aktion | Desktop | Handy |
|---|---|---|
| Laufen / Rennen | WASD / Shift | Joystick |
| Umsehen | Maus ziehen, Pfeil links/rechts, Mausrad = Zoom | Wischen |
| Bild ansehen / Buch lesen / Hinsetzen | E | Button |
| Aufstehen | F oder E | Button |
| Tanzen / Winken | G / H | ♪ |
| Chat | Enter | 💬 |

## Performance

* Raum und Figuren sind komplett prozedural – keine Modelle/Texturen zum Herunterladen (Bundle ≈ 190 KB gzip, Multiplayer-Code lädt erst bei Bedarf).
* Statische Geometrie wird pro Material zusammengefasst (wenige Draw-Calls), Figuren sind Pivot-Hierarchien ohne Skinning, Schatten sind Decals.
* Fotos werden vor dem Start dekodiert, auf max. 1600 px skaliert, mit Mipmaps hochgeladen. Der Loading Screen wartet auf **alles**
  (Schriften, Fotos, Video, erster Song, GPU-Upload, Shader) und dauert mindestens `minLoadingMs`.
* Adaptive Auflösung: sinkt die Framerate, senkt das Spiel die Pixeldichte automatisch.
