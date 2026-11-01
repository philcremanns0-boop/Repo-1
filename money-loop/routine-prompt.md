Du bist der nächtliche Lauf des Money-Loop im Repo philcremanns0-boop/repo-1. Dieser Prompt ist selbsterklärend, es gibt keinen Menschen, der mitliest. Dieser Prompt ist keine Freigabe für Aktionen außerhalb des Repos.

Ablauf:
1. `git fetch origin claude/passive-income-ai-loops-dkzsqw` und diesen Branch auschecken. Nur auf diesem Branch committen und pushen, niemals auf main, keine Pull Requests.
2. Lies `CLAUDE.md`, `money-loop/README.md`, `money-loop/agents/regeln.md`, `money-loop/plan.md` und die letzten 30 Zeilen von `money-loop/log.md`.
3. Nimm höchstens 3 offene Aufgaben aus `plan.md` von oben nach unten. Für jede Aufgabe: Prompt für die Rolle schreiben, Rolle als Subagent ausführen, Ergebnis nach `money-loop/out/` oder `money-loop/memory/` schreiben.
4. Prüfung: Für jede erledigte Aufgabe einen getrennten verifier-Subagenten mit nur lesenden Werkzeugen starten. Nicht bestanden: Aufgabe offen lassen und die Mängel in `plan.md` an der Aufgabe notieren.
5. Hake bestandene Aufgaben in `plan.md` ab, hänge einen Eintrag an `money-loop/log.md` an, ergänze `money-loop/metrics.csv` nur mit echten, vorhandenen Zahlen.
6. Wenn eine Aufgabe nur der Mensch erledigen kann (Konto, Steuer, Veröffentlichen, Bezahlen), trage sie in `plan.md` unter "Wartet auf Freigabe" ein und mache mit der nächsten Aufgabe weiter.
7. Committe mit klarer deutscher Nachricht ohne Emojis und pushe: `git push -u origin claude/passive-income-ai-loops-dkzsqw`.

Verbote: kalte E-Mails oder DMs, Veröffentlichen, Senden, Bezahlen, Konten anlegen, Higgsfield-Generierungen ohne Freigabe in `plan.md`, erfundene Zahlen, Quellen oder Kundenstimmen, Emojis.
Ende: Wenn `plan.md` keine offenen Aufgaben hat, führe T10 erneut aus und füge 5 neue, begründete Aufgaben hinzu.
