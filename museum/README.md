# Our Museum

Ein kleines 3D-Museum im Browser (Three.js + Vite) – Single- oder Multiplayer, Musik, zwei Sprachen.

**Aufbau:** Eingangshalle (Hero-Foto, Schild, Bank) mit drei Türen und einem Exit:
`About us` (klein) · `Moments` (Erlebnisse, Screen, schwarze Wand) · `Words` (Bücher zum Lesen, Teppich, Regale)
· **Exit** → Fade zu Schwarz → „I love you“ / „Te quiero“.

* Figuren: Seb & Mia (an La La Land angelehnt). Beim Namen entscheidet ein kleines System (Namenslisten + Endungen),
  wer man ist – mit „switch“ zum Korrigieren.
* Chat wie in Roblox: Verlauf oben links, Nachrichten zusätzlich als Sprechblase über dem Kopf (Enter oder `/`, am Handy 💬). Der Name wird beim Start frei gewählt.
* Musik-Box unten (Zurück / Play-Pause / Weiter / Fortschritt / Lautstärke). Songs werden am Ende ineinander überblendet; beim Exit wird die Musik leiser.
* Beschriftet sind nur die zwei Dates (Ort + Koordinaten, `dates` in `src/config.js`); alle anderen Bilder bleiben bewusst ohne Schild.
* Schriften: EB Garamond (Titel, Bücher) + System-Schrift (SF Pro auf Apple-Geräten) für die Bedienung.
* Sprache: Englisch (Standard), Deutsch oder Spanisch (Chile) – Umschalter **EN | DE | ES** oben rechts, alles inkl. Schilder & Bücher.
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
| Moments – große Bilder (Menschen, Orte) | `src/photos/moments/*` | 12 große Rahmen, Reihenfolge = Dateinamen (`01-…`, `02-…`) |
| Moments – kleine Rahmen (reine Blumen-/Pflanzenfotos) | `src/photos/moments/flowers/*` | 24 kleine Rahmen in Salon-Hängung |
| Video für den Screen | `src/media/video.mp4` (oder `.webm`) | läuft stumm in Schleife an der Rückwand von „Moments“; Hoch- oder Querformat wird erkannt. Ca. 540–720 px Breite, wenige MB |
| Musik | `src/media/music/*.mp3` | alphabetisch; Titel/Künstler in `src/config.js` (`MUSIC_TITLES`) |
| Bücher | `src/books/*.md` | eine Datei = ein Buch auf einem Lesepult (max. 8). Neue Datei ergänzen → neues Pult erscheint |
| Namen, Schild, Exit-Text, Bildunterschriften | `src/config.js` | alles zweisprachig `{ en, es }` |

Fotos vorher verkleinern spart Ladezeit: `npm run photos -- /pfad/zu/originalen` (schreibt `.webp` nach `src/photos/`;
anschließend in den passenden Unterordner verschieben).

**Bücher-Format** (`src/books/03-mein-text.md`) – ein Block pro Sprache:

```
=== en
# Title
Text … (Absätze durch Leerzeile trennen)
=== de
# Titel
Text …
=== es
# Título
Texto …
```
Fehlt eine Sprache, wird ersatzweise Englisch → Deutsch → Spanisch gezeigt. Eine neue Datei in `src/books/` erzeugt automatisch ein neues Lesepult.

## Auf Vercel deployen

Im Repo-Wurzelordner liegt noch ein anderes Projekt (der Pad Sampler). Deshalb:

1. vercel.com → **Add New → Project** → GitHub-Repo importieren.
2. **Root Directory: `museum`** (Framework „Vite“, Build `npm run build`, Output `dist` werden erkannt).
3. Der Standard-Branch des Repos ist `claude/pad-sampler` – dort gibt es kein `museum/`. Darum nach dem Import
   **Settings → Git → Production Branch = `claude/our-museum`** setzen (oder `claude/our-museum` in den Standard-Branch mergen) und neu deployen.
   Nur ein *Production*-Deployment ist öffentlich erreichbar; Preview-Deployments verlangen bei Vercel einen Login.

### Zugangscode
Beim Start fragt die Seite nach einem Code (`password` in `src/config.js`, aktuell `1234`; leer lassen = kein Code).
Der Code wird auf dem Gerät gemerkt. **Das ist nur eine Hürde gegen zufällige Besucher, kein echter Schutz:** Fotos und Texte liegen als normale
Dateien auf dem Server und wären mit der genauen Datei-URL abrufbar. Echten Schutz bietet nur Vercels „Password Protection“ (Pro-Plan) oder ein privates Hosting.

### App installieren (Android / iPhone / iPad)
Die Seite ist eine installierbare Web-App (Vollbild, eigenes Icon, schnellerer Start beim Wiederbesuch):
* **Android (Chrome):** unten auf dem Startbildschirm erscheint „Als App installieren“ (oder Menü → „App installieren“).
* **iPhone/iPad (Safari):** Teilen → „Zum Home-Bildschirm“.
Musik und Video werden bewusst nicht vom Service Worker gecacht (Safari braucht dafür Range-Antworten); sie kommen aus dem normalen Browser-Cache.

## Multiplayer

* Spieler 1: **Multiplayer → Raum erstellen** → Code (z. B. `K7QM2`) + „Link kopieren“ oben links.
* Spieler 2: Code unter **Join** eingeben oder Link `…/?room=K7QM2` öffnen. Der Zugangscode (s. o.) gilt auch für Eingeladene.
* Technik: WebRTC über [PeerJS](https://peerjs.com); der kostenlose Cloud-Broker wird nur zum Verbindungsaufbau genutzt. Host verteilt an bis zu 6 Spieler. Der Host muss im Raum bleiben.

### Wenn die Verbindung im Mobilfunknetz scheitert (TURN)
Manche Netze blockieren direkte Verbindungen. Dann hilft ein **TURN-Relay**. Kostenlos geht das z. B. mit
[Cloudflare Realtime TURN](https://developers.cloudflare.com/realtime/turn/) (großzügiges Gratis-Kontingent) oder [Metered](https://www.metered.ca/).
In Vercel unter **Settings → Environment Variables** eintragen und neu deployen:

| Anbieter | Variablen |
|---|---|
| Cloudflare | `CLOUDFLARE_TURN_KEY_ID`, `CLOUDFLARE_TURN_API_TOKEN` |
| Metered | `METERED_DOMAIN` (z. B. `name.metered.live`), `METERED_API_KEY` |

Die Funktion `api/ice.js` holt damit kurzlebige Zugangsdaten; die Schlüssel landen nie im Browser-Code. Ohne diese Variablen nutzt die Seite
öffentliche STUN-Server und eine frei verfügbare Best-Effort-TURN-Liste.

## Steuerung

| Aktion | Desktop | Handy |
|---|---|---|
| Laufen / Rennen | WASD / Shift | Stick links unten |
| Umsehen | Maus (einmal in die Szene klicken → Mausblick wie in Minecraft, `Esc` gibt die Maus frei), Pfeil links/rechts, Mausrad = Zoom | Überall wischen |
| Bild ansehen / Buch lesen / Hinsetzen | E | Button |
| Aufstehen | F oder E | Button |
| Emotes (Winken, Tanzen, Klatschen, Herz, Verbeugen, Jubeln) | Tasten `1`–`6` oder ☺-Button | ☺-Button |
| Chat | Enter | 💬 |

## Performance

* Raum und Figuren sind komplett prozedural – keine Modelle/Texturen zum Herunterladen (Bundle ≈ 190 KB gzip, Multiplayer-Code lädt erst bei Bedarf).
* Statische Geometrie wird pro Material zusammengefasst (wenige Draw-Calls), Figuren sind Pivot-Hierarchien ohne Skinning, Schatten sind Decals.
* Fotos werden vor dem Start dekodiert, auf max. 1600 px skaliert, mit Mipmaps hochgeladen. Der Loading Screen wartet auf **alles**
  (Schriften, Fotos, Video, erster Song, GPU-Upload, Shader) und dauert mindestens `minLoadingMs`.
* Adaptive Auflösung: sinkt die Framerate, senkt das Spiel die Pixeldichte automatisch.
