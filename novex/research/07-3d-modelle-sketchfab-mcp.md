# 3D-Modelle für Websites: Sketchfab-MCP und Alternativen

## Der Sketchfab-MCP
Es gibt einen Sketchfab-MCP-Server von gregkop (TypeScript). Laut Verzeichnis-Seiten bietet er drei Werkzeuge:
- **Suchen** mit Stichwort, Tag, Kategorie, Filter "herunterladbar", bis zu 24 Treffer.
- **Modelldetails** per Modell-ID.
- **Herunterladen** in den Formaten glTF, GLB, USDZ oder Quelle, optional mit Zielpfad.

Voraussetzungen: Node.js 18 oder neuer und ein Sketchfab-API-Schlüssel (kostenloses Konto, Schlüssel unter den Kontoeinstellungen im Bereich API). Ich habe das Repository selbst nicht geöffnet, weil meine Umgebung die Seiten sperrt. Die Angaben stammen aus Verzeichnis-Einträgen. Vor der Nutzung README und Lizenz im Repository lesen.

### Einrichten (Vorschlag, ungetestet)
```
git clone <Repository von gregkop/sketchfab-mcp-server>
cd sketchfab-mcp-server && npm install && npm run build
claude mcp add sketchfab -e SKETCHFAB_API_KEY=DEIN_SCHLUESSEL -- node <Pfad>/build/index.js
```
Der Pfad zur gebauten Datei kann abweichen, siehe README. Den Schlüssel nie in eine Datei im Projekt schreiben, die du hochlädst.

### Damit ich es in der Cloud-Sitzung nutzen kann
In den Einstellungen der Umgebung (Menü der Cloud-Umgebung in der Titelleiste, Bearbeiten, Netzwerkzugriff) müssen `sketchfab.com` und `api.sketchfab.com` freigegeben sein. Die Doku dazu: https://code.claude.com/docs/en/cloud-environments#network-access . Zusätzlich brauche ich für Referenzanalysen `www.awwwards.com`, `normalisboring.es` und `unpkg.com`.

## Wichtig: Lizenzen prüfen
Auf Sketchfab hat jedes Modell eine eigene Lizenz. Bei Creative-Commons-Modellen ist meist die **Namensnennung Pflicht**, manche verbieten die kommerzielle Nutzung (NC). Für eine Kundenseite brauchst du ein Modell, das kommerzielle Nutzung erlaubt, und musst den Urheber nennen, wenn verlangt. Bei Marken wie Porsche kommen Markenrechte dazu. Ein Nachbau eines Markenfahrzeugs auf der Seite eines Autohauses, das diese Marke nicht vertritt, kann Probleme machen. Für deine Autofabrik-Seite bitte prüfen: Quelle, Lizenz, Namensnennung, Marke. Ich habe das Modell nicht gesehen und kann dazu nichts bestätigen.

## Alternativen
- **Poly Pizza** und **Kenney**: freie, einfache Modelle (Lizenz je Modell prüfen).
- **BlenderMCP**: laut Suchergebnis kann es Sketchfab-Modelle suchen und in Blender importieren. Sinnvoll, wenn du Modelle nachbearbeiten willst, braucht aber Blender auf einem Rechner.
- **Eigenes Modell aus Bild:** Higgsfield bietet eine Bild-zu-3D-Funktion. Du fandest sie zu teuer, deshalb nur als Option.

## Technik auf der Webseite
GLB-Dateien lassen sich mit `three.js` oder dem Webkomponenten-Viewer `model-viewer` einbinden. Dateigröße klein halten (unter wenigen MB, Kompression mit Draco), sonst leidet die Ladezeit am Handy. Für den Scroll-Effekt "Auto dreht sich" gibt es zwei Wege: echtes 3D (flexibel, schwerer) oder eine Bildsequenz (leichter, wie Apple es macht).

## Quellen
- [Sketchfab MCP Server (Glama)](https://glama.ai/mcp/servers/@gregkop/sketchfab-mcp-server)
- [Sketchfab MCP Server (Playbooks)](https://playbooks.com/mcp/gregkop-sketchfab)
- [Three.js MCP Server (Docker Hub)](https://hub.docker.com/r/buryhuang/mcp-server-threejs)
