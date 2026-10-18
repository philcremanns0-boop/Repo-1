# Abos sinnvoll aufteilen, iPad-Coding, Codex-Frage

## Arbeitsteilung Claude und ChatGPT (Vorschlag)
Ich kenne den aktuellen Funktionsumfang von ChatGPT Pro nicht verlässlich. Frag ChatGPT selbst mit dem Prompt `../prompts/chatgpt-abo-inventur.md` und trage das Ergebnis unten ein. Bis dahin gilt:

| Aufgabe | Wer | Warum |
|---|---|---|
| Websites bauen, Code, Dateien, Tests | Claude (Claude Code) | Arbeitet im Projektordner, prüft im Browser |
| Konzepte, Texte, Strategie, Rechnen mit Dokumenten | Claude | Du bekommst hier die ausführlichste Begründung |
| Bilder in Masse, Storyboards, Moodboards | ChatGPT (laut deiner Angabe unbegrenzt) | Spart Higgsfield-Credits |
| Instagram-Auswertung mit eigenem Konto im Browser ("Work") | ChatGPT | Hat laut dir diese Funktion und du nutzt sie schon |
| Zweite Meinung zu Designs | ChatGPT mit Screenshots und Checkliste | Kostet nichts extra, siehe unten |
| Reels, Produktbilder, Videos | Higgsfield | Dein Abo, Credits begrenzt |

Übergabe zwischen beiden: Eine einzige Datei `PROJEKT-BRIEF.md` pro Kunde (Ziel, Stil, Entscheidungen, offene Punkte). Beide Werkzeuge bekommen sie am Sitzungsanfang. So erklärst du nichts doppelt.

## Codex als Prüfer?
Mein Rat: nein, kein zusätzliches Werkzeug. Der Gewinn einer zweiten Meinung kommt aus der **Rolle**, nicht aus dem Hersteller:
1. Frische Sitzung ohne Vorwissen (hier oder in ChatGPT).
2. Feste Checkliste (siehe `../prompts/chatgpt-design-kritik.md`).
3. Screenshots als Eingabe, keine Zusammenfassung von mir.
Das ist billiger und fehlerärmer als ein weiteres Agentenwerkzeug. Wenn du Codex nicht magst, musst du es nicht nutzen.

## Wie gut klappt Coden auf dem iPad?
- **Websites und Apps in HTML, CSS, JavaScript:** gut. Die Sitzung läuft in der Cloud, du bekommst Vorschau über veröffentlichte Seiten (wie das Zahnarzt-Artifact) und kannst von überall weitermachen.
- **Dateien lokal öffnen oder verschieben:** eingeschränkt. Du siehst nur, was in der Sitzung liegt oder veröffentlicht wurde.
- **Roblox Studio, Remotion-Rendering, Blender, schwere Builds:** nein, dafür braucht es einen Rechner.
- **Netzwerk:** die Cloud-Umgebung blockiert manche Domains. Du musst sie freigeben (siehe 3D-Dokument).
- **Verlust-Risiko:** Die Cloud-Umgebung ist vorübergehend. Alles, was bleiben soll, muss in ein Repository oder als Artifact veröffentlicht werden. Sag mir, wenn ich committen und pushen soll.

## Autofabrik-Website
Die Arbeit am Rechner ist sinnvoll, weil das 3D-Modell und lokale Tests dort einfacher sind. Wenn du mir die Dateien als Repository oder ZIP gibst, kann ich auch in der Cloud daran arbeiten, außer bei schweren 3D-Builds.

## Jarvis: Zusammenspiel
Der Telegram-Bot (`../jarvis-bot`) ist die Aufgabenzentrale für unterwegs. Er hängt bewusst nicht an einer Modell-API. Später kann er Zusammenfassungen oder Planung übernehmen, sobald du einen API-Schlüssel und ein Budget festlegst.
