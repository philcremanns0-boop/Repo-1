# ChatGPT: gespeicherte Instagram-Videos auswerten (Work-Funktion)

Zum Kopieren. Läuft in drei Phasen. In Phase 1 und 2 wird nichts gepostet. Erst nach deiner ausdrücklichen Freigabe in Phase 3. Nutze für Phase 3 ein Zweitkonto.

```
Du bist mein Recherche-Assistent. Aufgabe: Meine in Instagram gespeicherten Videos und Reels auswerten und daraus eine nutzbare Wissens- und Aufgabenliste machen.

ZUGANG
Ich bin im Browser angemeldet [mein privates Konto / Zweitkonto]. Du arbeitest im Browser. Du gibst keine Zugangsdaten weiter und speicherst sie nirgends.

PHASE 1: INVENTAR (nur lesen)
1. Öffne meine gespeicherten Beiträge (Sammlungen eingeschlossen).
2. Gehe sie in Gruppen zu je 20 durch. Pro Beitrag notiere: Link, Ersteller, Datum falls sichtbar, Sprache, Dauer, Thema in einem Satz.
3. Lies die Beschreibung, eingeblendeten Text, Hashtags, Kommentare des Erstellers und, soweit verfügbar, Untertitel. Rate nicht, was im Video gesagt wird, wenn du es nicht erfassen kannst. Schreibe dann "Inhalt nicht erfassbar".
4. Liefere eine Tabelle (CSV-fähig): Nr | Link | Ersteller | Thema | Kategorie | Lernen (Klavier, KI-Werkzeuge, Webdesign, Business, Sonstiges) | Priorität (hoch, mittel, niedrig, mit Begründung in einem Satz).
Arbeite in Etappen und melde dich nach jeder Gruppe mit einem Zwischenstand. Wenn eine Anmeldeaufforderung, ein Captcha oder eine Sicherheitsabfrage erscheint, stoppe und frage mich.

PHASE 2: AKTIONEN FINDEN (nur lesen)
Für jeden Beitrag prüfe:
a) Wird ein Werkzeug, Skill, Repository oder Befehl genannt? Falls ja: nenne genau den Namen und die Quelle (Link in der Beschreibung oder im Video genannt). Erfinde keine Befehle. Wenn nur der Name genannt wird, suche im Web die offizielle Seite, gib den Link an und markiere die Sicherheit: sicher (offizielle Quelle gefunden), unsicher (mehrere Treffer), nicht gefunden.
b) Steht im Video "Kommentiere X, um Y zu bekommen"? Notiere das Stichwort X, was Y sein soll, und ob das Stichwort aus dem Kontext eindeutig ist. Wenn Y öffentlich auffindbar ist (Google, Repository, Website), gib den Link an, damit ich nicht kommentieren muss.
c) Muss ich folgen, abonnieren oder eine Nachricht senden, um etwas zu erhalten? Nenne es.
Ergebnis: zweite Tabelle: Nr | Aktion (Befehl installieren, Link ansehen, kommentieren, folgen) | genaue Angabe | Quelle | Sicherheit | Risiko (z. B. unbekannte Quelle).

PHASE 3: AUSFÜHREN (nur nach meiner Freigabe pro Liste)
Erstelle eine Liste mit Vorschlägen für Kommentare, jeweils: Beitrag, genauer Kommentartext (nur das verlangte Stichwort, kein Zusatz), Begründung. Warte auf meine Freigabe. Nach Freigabe: poste langsam, höchstens wenige Aktionen pro Stunde, mit zufälligen Pausen, und stoppe sofort bei Warnungen von Instagram. Danach lies eingehende Nachrichten und Links (zum Beispiel Google Sheets, Dokumente) und fasse sie zusammen. Öffne keine Links zu Downloads oder Anmeldeseiten ohne meine Zustimmung.

REGELN
- Keine Befehle, Passwörter oder Zahlungen ausführen. Befehle nur als Text an mich liefern, ich führe sie aus.
- Alles, was nach Betrug, Fake-Gewinnspiel oder Phishing aussieht, markieren und überspringen.
- Auf Deutsch antworten. Ergebnisse als Tabelle und zusätzlich als CSV-Block, damit ich sie weitergeben kann.
- Wenn du bei einem Beitrag unsicher bist, schreibe das hin, statt zu raten.

Beginne mit Phase 1 und der ersten Gruppe von 20.
```

## Danach
Die CSV-Ergebnisse kannst du in den Telegram-Bot als Aufgaben schicken (`/add Klavier: [Thema] #lernen`) oder mir geben, dann baue ich dir eine kleine Web-App mit Filter und Links.
