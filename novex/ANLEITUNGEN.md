# Anleitungen (Antworten auf deine Fragen)

## 1. Das Outreach-System: wofür, und wie nutzt du es?

**Was es ist:** Eine Tabelle (Excel oder Google Sheets), in der du festhältst, wen du angesprochen hast, womit und wann. Sie schickt selbst nichts ab. Sie rechnet nur aus, wann du nachfassen musst, und zeigt dir, wie viele Kontakte zu einem Auftrag führen. Ohne so eine Tabelle verlierst du nach 30 Leads den Überblick.

**Was es nicht ist:** Kein Programm, das du an ChatGPT gibst. Die Excel-Datei bleibt bei dir. ChatGPT bekommt nur die Prompts (Leads suchen, Texte schreiben) und du kopierst das Ergebnis in die Tabelle. Wenn du die Datei in Google Drive hochlädst und dein ChatGPT dafür eine Verbindung hat, kann es sie vielleicht direkt befüllen. Ob das bei dir geht, musst du in ChatGPT ausprobieren.

**Warum nicht einfach E-Mails schicken?** Unaufgeforderte Werbe-Mails an Unternehmen sind in Deutschland nach meinem Wissen ohne Einwilligung meist unzulässig, es drohen Abmahnungen. Das ist keine Rechtsberatung, lass es kurz prüfen. Die sicheren Wege:
- **Brief per Post** (Standardkanal für den Start)
- **Persönlich vorbeigehen** (Visitenkarte, Skizze auf dem iPad)
- **Empfehlung** (der Zahnarzt kennt andere Praxen)
- **Inbound**: Interessenten melden sich bei dir, nach Reels, Referenzen, Kommentar-Auslösern
- **Danach** darfst du normal schreiben: Sobald jemand geantwortet oder angefragt hat, ist es keine Kaltakquise mehr.

**Ein Beispiel-Tag-für-Tag (erste Woche):**
1. **Montag, 20 Minuten:** In ChatGPT den Prompt `prompts/chatgpt-lead-recherche.md` laufen lassen (zum Beispiel 30 Zahnarztpraxen in deiner Stadt). Die CSV in die Tabelle "Pipeline" einfügen, Status "Recherchiert".
2. **Dienstag, 90 Minuten:** Für die besten 10 das Blatt "Mini-Audit" ausfüllen (je 10 Minuten). Den stärksten Befund in Spalte J schreiben.
3. **Mittwoch:** Brief-Vorlage 1 für jeden Lead personalisieren. Ich kann auf Wunsch pro Lead einen kleinen Website-Entwurf bauen und einen QR-Code für den Brief erzeugen. Das wäre dein stärkster Hebel.
4. **Donnerstag:** Briefe versenden oder einwerfen. Status "Kontaktiert", Datum in Spalte L eintragen.
5. **Freitag:** Dashboard ansehen. Wer sich meldet, bekommt Status "Antwort" und du schreibst ihm zurück (jetzt per E-Mail erlaubt).
Das Blatt "Rechner" zeigt, was bei deinen Zahlen daraus wird. Die Zahlen darin sind meine Platzhalter, ersetze sie nach den ersten 50 Kontakten durch deine.

**Mein Angebot:** Ich baue dir einen Serienbrief-Generator. Er liest die Pipeline und erzeugt pro Lead einen fertigen Brief als PDF mit deinem Befund und einem QR-Code zum Entwurf. Sag einfach "Bau den Briefgenerator".

## 2. Jarvis und Telegram: was geht, was nicht

**Was der Bot, den ich gebaut habe, ist:** Ein Aufgaben- und Erinnerungsbot. Er hat keine KI und greift nicht auf deine Dateien zu. Er merkt sich Aufgaben und schickt dir eine Push-Nachricht zur richtigen Zeit. Er muss dauerhaft auf einem laufenden Rechner oder Server laufen. Auf dem iPad allein läuft er nicht.

**Was du eigentlich willst** (Claude über Telegram, mit Zugriff auf deine Sachen, ohne API-Schlüssel): Das gibt es offiziell: **Claude Code Channels**. Die Nachrichten aus Telegram landen in einer echten Claude-Code-Sitzung auf deinem Rechner. Die Sitzung hat dann Zugriff auf deine Dateien, wie hier. Laut den Quellen braucht es Claude Code ab Version 2.1.80, die Laufzeit Bun und ein Pro- oder Max-Abo (also dein Abo, keinen API-Schlüssel). Es ist eine "Research Preview", also neu und im Wandel. Grundablauf laut Anleitungen: Bot bei BotFather erstellen, Plugin `telegram@claude-plugins-official` installieren, Token speichern, mit Kanal-Option starten, per Pairing-Code koppeln. Die genauen Befehle bitte aus der aktuellen Anleitung nehmen: [Setup Guide](https://fast.io/resources/claude-channels-guide/) oder [DEV Community](https://dev.to/alanwest/claude-code-channels-control-your-ai-coding-agent-from-telegram-2b0n). Der Haken: Die Sitzung muss laufen. Dafür brauchst du einen Rechner, der an bleibt (Laptop, Mac mini, kleiner Server). Aktivier nie die Option, die Rückfragen abschaltet ("dangerously skip permissions"), sonst kann jede Nachricht beliebig Dinge auslösen.

**Was jetzt auf dem iPad ohne Rechner geht:**
- **Geplante Aufgaben in Claude:** Ich kann geplante Aufgaben anlegen, die zu festen Zeiten laufen und dir eine Push-Nachricht oder E-Mail schicken, zum Beispiel jeden Morgen deine Prioritäten. Sag "Richte die Morgen-Nachricht ein".
- **Claude-App:** Diese Sitzung läuft schon in der Cloud und du kannst jederzeit weitermachen.

**Anrufe:** Mit keiner dieser Lösungen. Dafür bräuchtest du einen Telefonie-Anbieter (kostenpflichtig). Ich würde das streichen.

**Empfehlung:** Jetzt geplante Aufgaben (ohne Rechner). Sobald du am Rechner bist, Claude Code Channels. Der Aufgabenbot ist dann nur noch Zusatz.

## 3. BotFather: Telegram-Token holen (5 Minuten)
1. Telegram aus dem App Store laden, mit deiner Nummer anmelden.
2. Oben auf die Suche tippen, `BotFather` eintippen. Nimm den Treffer mit blauem Haken (@BotFather).
3. Auf "Start" tippen, dann `/newbot` senden.
4. Er fragt nach einem **Namen** (frei, zum Beispiel "Phil Jarvis").
5. Dann nach einem **Benutzernamen**. Er muss auf `bot` enden und noch frei sein, zum Beispiel `phil_jarvis_bot`.
6. BotFather antwortet mit einem **Token** (eine lange Zeichenfolge mit Doppelpunkt) und einem Link zu deinem Bot.
7. Den Token in einer Notiz-App oder einem Passwortmanager speichern. **Nicht** in Chats mit mir oder ChatGPT einfügen, nicht ins Netz stellen. Wer den Token hat, steuert den Bot.
8. Wurde er doch bekannt: bei BotFather `/revoke` senden und einen neuen holen.
Den Token brauchst du erst, wenn der Rechner da ist. Dann trägst du ihn in die Datei `.env` ein (siehe `jarvis-bot/README.md`).

## 4. Netzwerk freigeben (Sketchfab, Awwwards und Co.)
1. Öffne diese Sitzung in der Claude-App oder auf claude.ai/code.
2. In der Titelleiste das **Menü der Cloud-Umgebung** öffnen, dann **Bearbeiten**.
3. Bei **Netzwerkzugriff** (Network access) entweder eine breitere Stufe wählen oder unter **Allowed domains** diese Hosts eintragen: `sketchfab.com`, `api.sketchfab.com`, `www.awwwards.com`, `normalisboring.es`, `unpkg.com`. Das Häkchen für Paketmanager angehakt lassen.
4. Speichern, dann eine **neue Sitzung** starten, damit es sicher greift.
Dokumentation: https://code.claude.com/docs/en/cloud-environments#network-access
Hinweis: Sketchfab liefert Downloads über weitere Hosts aus. Wenn ein Download scheitert, steht der gesperrte Host in der Fehlermeldung. Den trägst du dann ebenfalls ein.

## 5. Sketchfab-MCP verbinden
Ich habe das Paket `sketchfab-mcp` (Version 1.0.7) selbst geprüft: Es sind etwa 400 Zeilen Code, der Schlüssel geht nur an `api.sketchfab.com`, es schreibt Dateien nur an den Pfad, der beim Aufruf angegeben wird. Es wird seit März 2025 nicht mehr gepflegt, deshalb ist die Version fest eingestellt.
1. **Sketchfab-Konto** anlegen (kostenlos), in den Kontoeinstellungen im Bereich "Password & API" den **API-Token** erzeugen. (Die Menübezeichnung kann abweichen.)
2. In den **Umgebungseinstellungen** (wie oben, Menü, Bearbeiten) eine **Umgebungsvariable** `SKETCHFAB_API_KEY` mit dem Token anlegen. Dort, wo es "Network secrets" oder "API credentials" gibt, geht auch das. Den Token nie in den Chat einfügen.
3. Die Konfiguration `.mcp.json` habe ich im Repository angelegt. Sie startet den Server mit `npx`.
4. **Neue Sitzung** starten, auf dem Branch, der diese Datei enthält (siehe nächster Punkt). Beim ersten Mal fragt Claude Code, ob du dem Server vertraust.
5. Test: "Suche auf Sketchfab nach einem Porsche 911 als GLB, nur herunterladbare."
Vor dem Einsatz bei Kunden die Lizenz des Modells prüfen. Du sagtest, beim Porsche-Modell passt sie. Dann ist das erledigt.

## 6. Was "Branch pushen" bedeutet
Ein **Repository** ist der Projektordner bei GitHub. Ein **Branch** ist ein abgetrennter Arbeitsstand darin, wie eine Kopie, an der man arbeiten kann, ohne den Hauptstand zu verändern. Dein Hauptstand heißt hier `claude/pad-sampler` (die Sampler-App). Ich habe meine Arbeit auf eine eigene Kopie gelegt: `claude/novex-workspace`. **Das ist schon erledigt, du musst nichts tun.** Alle Dateien sind dort gesichert und gehen nicht verloren.

Folge: Neue Sitzungen laden normalerweise den Hauptstand und sehen deshalb meinen Ordner, `CLAUDE.md`, die Skills und `.mcp.json` nicht. Zwei Wege:
- **Sitzung auf dem Branch starten** (`claude/novex-workspace` wählen).
- **Zusammenführen:** Ich lege einen Pull Request an (ein "Vorschlag, die Kopie in den Hauptstand zu übernehmen"), du tippst auf "Merge". Dann gilt alles für jede neue Sitzung. Sag "Mach den Pull Request". Das Repository ist öffentlich, dort liegt dann alles offen. Wenn dir das nicht recht ist, sag es.

## 7. Zertifikate
Siehe `prompts/chatgpt-lernpfad-zertifikate.md`. Kurz: keine erfundenen oder bearbeiteten Zertifikate, aber ein Plan für echte, prüfbare Nachweise.
