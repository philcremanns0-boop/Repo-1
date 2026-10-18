# Instagram: gespeicherte Reels auswerten und Reels-Blocker

## 1. Gespeicherte Reels in eine Liste bringen
Der saubere Weg ist der offizielle Datenexport. In der App: Einstellungen und Datenschutz, Deine Aktivität, Informationen herunterladen, Download anfordern, Format JSON wählen. Je nach Quelle dauert die Bereitstellung bis zu 14 Tage, der Download-Link läuft nach etwa 4 Tagen ab. Die ZIP-Datei enthält einen Ordner `your_instagram_activity` mit gespeicherten und gelikten Beiträgen. Ob dort für gespeicherte Beiträge Links stehen, konnte ich nicht bestätigen. Das siehst du nach dem Auspacken: nach Feldern wie `href` oder `url` suchen.

Wartezeit überbrücken: Eine Browser-Erweiterung "Saved Posts Exporter" verspricht den Export deiner gespeicherten Beiträge. Sie läuft in deiner angemeldeten Sitzung und ich habe sie nicht geprüft. Berechtigungen vorher lesen.

Danach gibst du ChatGPT die Liste und den Prompt aus `../prompts/chatgpt-instagram-saved.md`. Ich kann hier keine Instagram-Konten öffnen und habe deshalb den Prompt so gebaut, dass er in drei Phasen läuft, in denen nichts passiert, bevor du es freigibst.

## 2. Hinweis zum Vorhaben "ChatGPT kommentiert mit Zweitkonto"
Du hast entschieden, das zu tun, ich wiederhole die Warnung nur einmal kurz: Automatisiertes Verhalten auf Instagram kann zu Sperren des Kontos führen. Nimm ein Zweitkonto, das du verlieren kannst, nie dein Hauptkonto. Gib Zugangsdaten nur an Werkzeuge, denen du vertraust, und aktiviere die Zwei-Faktor-Anmeldung. Wenige Aktionen pro Stunde sind weniger auffällig als viele auf einmal. Konkrete Grenzwerte nennt Instagram nicht, ich habe keine verlässliche Zahl.

## 3. Reels und Shorts ausschalten (Theorie)
Meine Suche fand nur Lösungen für **Desktop-Browser**:
- ScrollBlock (Firefox) blendet die Reels-Schaltfläche und die Explore-Seite aus.
- Instagram Feed Blocker (Firefox) hat Schalter für Reels, ein von Freunden gesendetes Reel öffnet sich trotzdem.
- AntiReels (Firefox und Chrome) blendet Reels in Chat, Menü und Direktlinks aus. TikTok wird komplett gesperrt.
- TickTock (Chrome) begrenzt die Anzahl der Reels pro 30 Minuten.

Für **iOS und Android-Apps** fand ich keine verlässliche Lösung. In den Apps lässt sich der Reels-Tab nach meinem Wissen nicht über Bildschirmzeit ausschalten. Als Ausweg bleibt die Webversion im Browser mit Erweiterung, wo der Browser Erweiterungen erlaubt. Das ist nur eine Teillösung und bricht, wenn Instagram sein Layout ändert.

Bewertung: als Nebenprojekt in einem Wochenende als Browser-Erweiterung machbar, als Geschäft schwach, weil die Plattformen Änderungen jederzeit brechen können. Ich würde es parken.

## Quellen
- [ScrollBlock (Firefox)](https://addons.mozilla.org/addon/scrollblock/)
- [Instagram Feed Blocker (Firefox)](https://addons.mozilla.org/addon/instagram-feed-blocker/)
- [AntiReels (GitHub)](https://github.com/mxmxmarexmxm/AntiReels)
- [TickTock (Chrome Web Store)](https://chromewebstore.google.com/detail/iamoaaflepndblhlhkojlhkaecgccmpe)
- [How to Export Instagram Data (Takeout Day)](https://takeoutday.org/guides/how-to-export-instagram-data)
- [What's All Included in Your Instagram Data File Download? (Redact)](https://redact.dev/blog/instagram-data-file-download)
