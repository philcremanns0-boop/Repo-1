# Hyperrealistische KI-Menschen und Videos: Methode, Workflow, Testplan

Stand 18.10.2026. Grundlage: eine Websuche (Quellen unten) plus mein eigenes Wissen. Die Quellen sind überwiegend Anbieter-Blogs und Prompt-Seiten, keine unabhängigen Tests. Zahlen wie "95 Prozent Konsistenz" habe ich nicht übernommen. Alles Wesentliche ist deshalb als Testplan formuliert, den du in einer Stunde selbst durchläuft. Fertige Prompts stehen in `../prompts/higgsfield-hyperrealismus.md`.

## 1. Woran man KI-Menschen erkennt (und was du dagegen tust)

| Verräter | Gegenmaßnahme |
|---|---|
| Glatte, wachsartige Haut | Hauttextur, Poren, ungleichmäßige Sommersprossen und kleine Unreinheiten explizit verlangen. Keine "perfekte Haut"-Wörter |
| Zu perfekte Symmetrie und Schönheit | Leichte Asymmetrie, schiefe Zähne, Flyaway-Haare, nicht retuschiert |
| Qualitätsfloskeln ("8k, masterpiece") | Weglassen. Stattdessen Kamera, Objektiv, Blende, Licht nennen, wie ein Fotograf |
| Zu saubere Szene | Alltagsunordnung im Hintergrund, Alltagslicht, Mischlicht |
| Kinoreifer Look bei einem Alltagsmoment | Handy-Ästhetik verlangen: leicht schiefer Bildausschnitt, Handkamera, kleine Unschärfe |
| Tote Augen, Dauerlächeln | Blickrichtung und Ausdruck konkret beschreiben, Mikro-Ausdrücke, Blinzeln |
| Mund und Ton passen nicht | Bewegung aus echtem Video übertragen oder separaten Lip-Sync-Schritt nutzen |
| Zu langsame, schwebende Bewegung | Kurze Clips (5 bis 8 Sekunden), reale Bewegungsreferenz statt Textbeschreibung |
| Hände, Zähne, Schmuck | Hände in der Pose verstecken oder aus dem Bild nehmen, mehrere Versuche, Einzelbilder prüfen |

## 2. Zwei Workflows

### A. Deine Bewegung, eine KI-Person (Motion Control)
Dein aufgenommenes Video liefert Bewegung, Timing und Mimik, die KI-Person liefert Gesicht und Look. Genau das beschreibt dein Ansatz.

1. **Figur bauen.** Entweder ein einzelnes, starkes Referenzbild (Kopf bis Brust, Blick leicht zur Kamera, Tageslicht) oder, für wiederkehrende Figuren, 20 und mehr abwechslungsreiche, gut ausgeleuchtete Fotos für eine trainierte Identität (Higgsfield nennt das Soul ID). Ohne Sonnenbrille, ohne harte Schatten, nicht alle im gleichen Outfit, sonst lernt das Modell die falsche Mischung.
2. **Bewegungsvideo aufnehmen.** Gleicher Bildausschnitt wie das Referenzbild (Kopf und Schultern bleiben im Bild), ruhiger Hintergrund, gutes Licht, 10 bis 30 Sekunden, natürliche Gestik, Mund deutlich bewegen. Ein hoher Kamerawinkel oder ein schneller Schwenk verschlechtert das Ergebnis.
3. **Motion Control ausführen.** Referenzbild plus Bewegungsvideo. Laut Higgsfield-Seite liegt Kling 3.0 Motion Control bei 1080p und 3 bis 30 Sekunden Länge.
4. **Prüfen.** Gesicht über den Clip stabil? Augen, Zähne, Hände, Schmuck? Mundbewegung zum Ton?
5. **Ton.** Dein Originalton passt zur übertragenen Mimik. Soll eine andere Stimme sprechen, ist ein separater Voice- oder Lip-Sync-Schritt nötig.

Wichtig: "Gesicht tauschen" und "Bewegung übertragen" sind verschiedene Verfahren. Eine Quelle beschreibt Face Swap als bildweises Ersetzen des Gesichts im Original, mit separatem Lip-Sync für Sprache. Ob Higgsfield deine Aufnahme direkt mit deinem eigenen Gesicht tauschen kann, geht aus meinen Quellen nicht hervor. Das musst du in der aktuellen Oberfläche prüfen.

### B. Foto zu Video
Erst ein überzeugendes Standbild, dann animieren.
1. Standbild mit Foto-Prompt erzeugen (Abschnitt 3). Mehrere Varianten, das beste auswählen.
2. Als Startbild für ein 5 bis 8 Sekunden langes Video verwenden. Bewegung konkret und klein beschreiben (Blick, Kopfdrehen, Atem, leichtes Handwackeln), keine großen Aktionen.
3. Zwei bis drei Clips zu einer Szene schneiden. Schnitte verstecken Fehler besser als lange Einstellungen. Zum Schneiden gibt es deinen Remotion-Skill.

## 3. Prompt-Formel für Standbilder

`Person (Alter, Typ) · Kleidung · Handlung · Ort · Kamera und Objektiv · Licht · Imperfektionen · Ausschluss`

Beispielbausteine (Englisch, weil Bildmodelle damit am besten arbeiten):
- Kamera: `shot on a smartphone, 26mm equivalent, slight handheld tilt, mild motion softness`
- Licht: `soft window light from the left, mixed with warm ceiling lamp, natural shadows`
- Haut: `visible skin texture, fine pores, uneven skin tone, a few freckles, no retouching`
- Ausschluss: `no airbrushing, no plastic skin, no perfect symmetry, no glossy highlights, no beauty filter`

Mehrere Quellen empfehlen übereinstimmend: Kamera und Blende statt Qualitätsfloskeln, Hauttextur ausdrücklich nennen, kleine Fehler einbauen, Anti-Muster als Ausschlussliste.

Nach dem Training einer Identität: das Gesicht nicht erneut beschreiben, den Prompt für Szene, Kleidung, Licht und Kamera nutzen. Ein Tester berichtet, dass seine Figur im Bild zu dünn wurde. Körperproportionen also prüfen.

## 4. Testplan (60 Minuten, etwa 20 Generierungen)

Dein Higgsfield-Konto hatte zuletzt 840,75 Credits. Wie viele Credits ein Bild oder Video kostet, konnte ich nicht ermitteln. Notiere die Kosten der ersten drei Generierungen und rechne dann hoch.

| Runde | Was | Ziel |
|---|---|---|
| 1 | 6 Standbilder mit Prompt 1 bis 3 aus der Prompt-Datei | Bester Look und Stil festlegen |
| 2 | Bestes Bild als Referenz, 3 Clips mit Foto-zu-Video | Bewegung beurteilen |
| 3 | Eigenes Video aufnehmen (30 Sekunden), Motion Control auf das beste Bild | Workflow A prüfen |

Bewertung je Ergebnis (0 = schwach, 1 = okay, 2 = überzeugend): Haut, Augen, Zähne und Mund, Hände, Licht, Hintergrund, Bewegung, Lip-Sync, Gesamteindruck. Ab 14 von 18 Punkten lohnt sich der Einsatz in Beiträgen. Ein Ergebnis unter 10 Punkten nicht veröffentlichen.

## 5. Rechtliches und Fairness (keine Rechtsberatung)

- Nur dein eigenes Gesicht oder Figuren, die frei erfunden sind. Nie das Aussehen einer realen Person ohne deren Zustimmung.
- Plattformen verlangen meist eine Kennzeichnung realistischer KI-Inhalte. In der EU gelten nach meinem Kenntnisstand ab 2026 Transparenzpflichten für täuschend echte KI-Inhalte. Genauen Stand und Ausnahmen bitte prüfen.
- Keine erfundenen Kundenstimmen oder Bewertungen mit KI-Menschen. Das ist irreführende Werbung.
- Für Kundenprojekte (Zahnarzt, Praxis): echte Fotos von echten Menschen. Ein KI-Arzt ist ein Vertrauensbruch.

## Quellen
- [Higgsfield: How to Create a Consistent AI Influencer in 2026](https://higgsfield.ai/blog/how-to-create-ai-influencer)
- [Higgsfield: Mastering AI Character Consistency](https://higgsfield.ai/blog/Soul-ID-AI-Character-Consistency)
- [Higgsfield Soul 2.0 Review (Substack)](https://coffeeandclaude.substack.com/p/higgsfield-soul-20-review-is-soul)
- [Higgsfield: Kling Motion Control 3.0](https://higgsfield.ai/blog/kling-motion-control-3)
- [Higgsfield: AI Influencer, Create Anyone, Remake Any Video](https://higgsfield.ai/ai-influencer)
- [Realistic AI Image Prompts: 26 for Photorealism](https://gptprompts.ai/realistic-ai-image-prompts)
- [Master AI Prompts for Hyper-Realistic Image Generation](https://contra.com/community/XKePVPiS-master-ai-prompts-for-hyper-realistic-image)

Einschränkung: Higgsfield-Seiten sind Eigenwerbung. Ob die Ergebnisse bei dir so aussehen, zeigt erst der Testplan.
