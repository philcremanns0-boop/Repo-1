# Jarvis-Light

Telegram-Bot für Aufgaben, Erinnerungen als Push-Nachricht und eine Morgenübersicht. Nur Python-Standardbibliothek, kein Abo, keine Pakete.

Getestet: Befehlslogik, Zeitparser, Erinnerungen, Morgenübersicht und der komplette Nachrichtenablauf gegen einen lokalen Telegram-Mock (`python3 -m unittest -v test_bot`, 15 Tests). Nicht getestet: die Verbindung zum echten Telegram, weil die Cloud-Umgebung, in der ich gebaut habe, api.telegram.org nicht erreicht. Der erste echte Start ist also dein Test.

## Einrichten (10 Minuten)

1. In Telegram `@BotFather` öffnen, `/newbot` senden, Namen vergeben. Du bekommst einen Token.
2. `.env.example` nach `.env` kopieren, den Token bei `TELEGRAM_BOT_TOKEN` eintragen.
3. Bot starten: `set -a; . ./.env; set +a; python3 bot.py`
4. Dem Bot in Telegram `/id` schreiben. Er antwortet mit deiner Chat-ID. Diese Zahl bei `ALLOWED_CHAT_IDS` in `.env` eintragen, Bot neu starten. Alle anderen Chats werden abgewiesen.
5. Deine Aufgabenliste importieren: `python3 bot.py seed backlog.json`
6. `/brief` senden und prüfen.

## Befehle

| Befehl | Wirkung |
|---|---|
| `/add Text #tag !1 @morgen 9:00` | Aufgabe. Tag, Priorität (1 hoch bis 3 niedrig) und Erinnerung sind optional |
| Einfach Text senden | Aufgabe ohne Tag |
| `/list`, `/list tag` | Offene Aufgaben nach Priorität |
| `/today` | Heute fällig und überfällig |
| `/done 3` oder `/done 3,4` | Erledigt |
| `/del 3` | Löschen |
| `/remind in 30m Text` | Erinnerung. Auch: `in 2h`, `heute 18:00`, `morgen 9:00`, `mo 8:30`, `24.10. 10:00` |
| `/brief` | Übersicht jetzt. Kommt außerdem automatisch ab 08:00 (`BRIEF_TIME`) |

## Dauerbetrieb ohne neues Abo

Der Bot muss laufen, damit Erinnerungen ankommen. Möglichkeiten:
- Ein Rechner, der ohnehin läuft (Heim-PC, Mac mini). Für Linux liegt `jarvis.service` bei.
- Raspberry Pi, falls vorhanden.
- Ein kostenloser Cloud-Tarif. Welche Anbieter aktuell wirklich kostenlos sind, ändert sich oft, bitte vor der Wahl prüfen. Mit der `Dockerfile` läuft der Bot überall, wo Container laufen; unter `/data` braucht er dauerhaften Speicher.

Vom iPad aus kannst du den Bot jederzeit nutzen, weil er ein normaler Telegram-Chat ist. Nur der Dauerbetrieb braucht einen laufenden Rechner.

## Sicherheit

- Telegram-Bot-Nachrichten sind nicht Ende-zu-Ende-verschlüsselt. Schreibe keine Passwörter oder Zugangsdaten hinein.
- `.env` enthält den Token. Nie hochladen, nie in einen Chat kopieren. Wurde er geleakt, bei `@BotFather` mit `/revoke` erneuern.
- Die Daten liegen in `jarvis.db` (SQLite) auf dem Rechner, auf dem der Bot läuft.

## Nächste Ausbaustufen (nicht gebaut)

- WhatsApp: braucht die kostenpflichtige Business-Schnittstelle und eine verifizierte Nummer. Zum Start nicht nötig.
- Anrufe: brauchen einen Telefonie-Anbieter (z. B. Twilio, Abrechnung pro Minute). Sinnvoll nur für wenige, wirklich dringende Erinnerungen.
- Fragen an Claude oder ChatGPT direkt im Chat: geht nur über die jeweilige API und wird pro Nutzung abgerechnet, getrennt vom Abo. Deshalb bewusst weggelassen.
