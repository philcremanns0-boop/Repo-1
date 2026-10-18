# Token-Effizienz mit Claude Code

Stand 18.10.2026. Quellen: offizielle Kostendoku von Claude Code und mehrere Praxisartikel. Konkrete Schwellenwerte aus Blogs habe ich nicht übernommen, wenn die offizielle Doku sie nicht bestätigt.

## Das Prinzip
Jede Nachricht kostet so viel, wie der gesamte Kontext lang ist. Alte, nicht mehr nötige Inhalte machen jeden weiteren Schritt teurer. Sparen heißt also: Kontext klein halten und Nacharbeit vermeiden. Bei dir ist Nacharbeit der größte Posten: ein schwaches erstes Konzept kostet drei Überarbeitungsrunden.

## Die wirksamsten Hebel für dich (nach Wirkung sortiert)
1. **Konzept vor Code.** Ein freigegebenes Konzept (DESIGN.md) verhindert Neubauten. Das spart mehr als jede technische Einstellung.
2. **Eine Aufgabe pro Sitzung.** Bei einem neuen, unabhängigen Thema `/clear`. Die offizielle Doku nennt das ausdrücklich.
3. **`/compact` an Phasengrenzen**, mit Fokus-Anweisung, zum Beispiel `/compact Behalte: Entscheidungen zu Typo, Farben und offene Fehler`. Nicht erst, wenn das Fenster voll ist.
4. **CLAUDE.md schlank halten.** Sie wird bei jedem Start geladen. Aufteilen in mehrere Dateien spart nichts, weil importierte Dateien ebenfalls geladen werden. HTML-Kommentare darin werden laut einer Quelle vor dem Laden entfernt und kosten nichts. Das habe ich nicht gegengeprüft.
5. **Nicht genutzte MCP-Server abschalten.** Jeder Server bringt Werkzeugbeschreibungen mit. Dein Higgsfield-Server hat über 140 Werkzeuge. Mit `/context` siehst du, was Platz belegt.
6. **Modell und Server nicht mitten in der Sitzung wechseln.** Das macht den Zwischenspeicher ungültig, alles wird neu gelesen. Wechsel am Sitzungsanfang.
7. **Unteragenten eng führen.** Sie sind nützlich für abgegrenzte Aufgaben (Recherche, Prüfung) und verbrauchen weiter Tokens, bis sie beendet sind. Für Routine geht ein kleineres Modell.
8. **Große Ausgaben filtern.** Nicht ganze Logs lesen lassen, sondern nur Fehlerzeilen.
9. **Skills nur laden, wenn nötig.** Große Skills wie novex-designer kosten beim Laden viel. Für reine Fehlerbehebung ohne visuelle Änderung nicht laden.

## Vorlage: schlanke CLAUDE.md für deine Projekte
Kopiere das in `CLAUDE.md` im Projektstamm. Anpassen, nicht aufblähen.

```
# Projekt: [Name]
Kunde: [Firma, Branche, Stadt] · Ziel: [ein Satz] · Sprache: Deutsch, Sie-Form

## Arbeitsweise
- Erst lesen, dann fragen, dann bauen. Lies nur Dateien, die für die Aufgabe nötig sind.
- Bei neuen Seiten: zuerst DESIGN.md schreiben und von Phil freigeben lassen. Kein Code vorher.
- Ändere nur, was verlangt ist. Keine Umbauten nebenbei.
- Prüfe jede Änderung im Browser (Screenshot Desktop und 400 px) bevor du "fertig" sagst.
- Melde ehrlich, was getestet ist und was nicht.

## Qualität
- Ziel ist das Beste seiner Klasse, nicht der Durchschnitt. Vor dem Entwurf drei echte, prämierte Referenzen analysieren und benennen, was NICHT übernommen wird.
- Standard-Looks vermeiden: Schwarz mit Gold, violetter Verlauf, zentrierte Standard-Hero, Icon-Karten im Raster, Lorem ipsum.
- Mobile zuerst prüfen, Kontrast und Tastaturbedienung einhalten.

## Technik
- Stack: [z. B. reines HTML/CSS/JS oder Next.js]; Fonts selbst hosten.
- Keine Geheimnisse in Dateien. Zugangsdaten nur über Umgebungsvariablen.
```

## Prompt-Baustein "Bestes statt Durchschnitt"
Füge das an Briefings für Websites an:
```
Arbeite nicht mit dem Durchschnitt des Internets. Benenne zuerst drei konkrete, ausgezeichnete Referenzen dieser Branche und was sie besser machen als der Standard. Nenne dann drei Dinge, die ein durchschnittlicher Entwurf hier tun würde, und lasse sie weg. Entwickle drei deutlich verschiedene Richtungen, bewerte sie ehrlich und empfiehl eine. Baue erst nach meiner Freigabe.
```

## Quellen
- [Claude Code Docs: Manage costs effectively](https://code.claude.com/docs/en/costs)
- [23 Tips for Smart Claude Code Token Saving (Analytics Vidhya)](https://www.analyticsvidhya.com/blog/2026/05/tips-for-claude-code-token-saving/)
- [12 Ways to Cut Token Consumption in Claude Code (Firecrawl)](https://www.firecrawl.dev/blog/claude-code-token-efficiency)
- [How to Manage Claude Code Token Usage (MindStudio)](https://www.mindstudio.ai/blog/how-to-manage-claude-code-token-usage)
- [Claude Code, Optimizing Token Usage (avonture.be)](https://www.avonture.be/blog/claude-ia-spare-tokens/)
