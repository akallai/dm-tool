# Widget-Anleitung

Hier findest du detaillierte Beschreibungen zu allen verfügbaren Werkzeugen (Widgets) im DM Tool.

## Inhaltsverzeichnis

*   [Dice Tool (Würfel)](#dice-tool)
*   [Music Widget (Musik & Sound)](#music-widget)
*   [Wiki Widget](#wiki-widget)
*   [Combat Tracker](#combat-tracker)
*   [Random Generator (Zufallstabellen)](#random-generator)
*   [Notepad (Notizen)](#notepad)
*   [Image / PDF Viewer](#image--pdf-viewer)
*   [Daytime Tracker (Tageszeit)](#daytime-tracker)
*   [LLM Chat (KI-Assistent)](#llm-chat)
*   [Hex Map (Hexfeld-Karte)](#hex-map)
*   [Name Generator (Namensgenerator)](#name-generator)

---

## Dice Tool

Ein umfassender Würfelsimulator.

### Bedienung
*   **Standard-Würfel**: Klicke auf die Symbole (W4, W6, W8, etc.), um zu würfeln. Das Ergebnis erscheint sofort unten im Fenster.
*   **Benutzerdefinierte Formel**: Aktiviere über die Einstellungen die Eingabezeile. Hier kannst du komplexe Ausdrücke eingeben und mit dem "Casino"-Button ausführen.

### Würfel-Notation

Das Dice Tool unterstützt verschiedene Schreibweisen:

| Format | Beispiel | Beschreibung |
|--------|----------|--------------|
| Standard | `2d6` | 2 sechsseitige Würfel |
| Deutsch | `3w8` | 3 achtseitige Würfel (W = Würfel) |
| Mit Bonus | `1d20+5` | Ein d20, dann +5 zum Ergebnis |
| Mit Malus | `2d10-2` | Zwei d10, dann -2 vom Ergebnis |

Die Notation ist **nicht case-sensitive** - `2D6` funktioniert genauso wie `2d6`.

### Einstellungen (Zahnrad)
*   **Würfel anzeigen**: Wähle aus, welche Standard-Würfel (d4 bis d100) im Widget sichtbar sein sollen.
*   **Custom Buttons**: Erstelle eigene Buttons mit festen Formeln (z.B. "Feuerball" -> `8d6`).
*   **Show Custom Input**: Zeigt oder versteckt das manuelle Eingabefeld.

---

## Music Widget

Verwalte Hintergrundmusik und Soundeffekte.

### Bedienung
*   **Tracks abspielen**: Klicke auf den Play-Button neben einem Tracknamen.
*   **Lautstärke/Fade**: Das Widget unterstützt sanftes Ein- und Ausblenden (Fading) beim Starten und Stoppen.

### Einstellungen (Zahnrad)
*   **Mappings**: Hier verknüpfst du Namen (z.B. "Kampfmusik") mit Audio-Dateien von deinem Computer.
*   **Fade Duration**: Dauer des Ein-/Ausblendens in Sekunden (Standard: 0.5s).
*   **Allow Multiple**: Wenn aktiviert, können mehrere Sounds gleichzeitig spielen (gut für Atmosphäre + Soundeffekte). Wenn deaktiviert, stoppt der startende Track automatisch den laufenden.

---

## Wiki Widget

Dein persönliches Lexikon für deine Kampagne.

### Bedienung
*   **Navigation**: Links findest du eine Liste aller Artikel. Nutze die Suche, um Artikel schnell zu finden.
*   **Neuer Artikel**: Klicke auf das **+** in der Sidebar für einen neuen Hauptartikel oder auf den Button "Add Sub-Article" bei einem bestehenden Artikel für Unterseiten.
*   **Bearbeiten**: Schreibe deine Texte im Markdown-Format (einfache Formatierung).
    *   Schalte mit dem "Edit / Preview"-Schalter oben rechts zwischen Bearbeitungsmodus und Leseansicht um.
*   **Speichern**: Artikel werden automatisch gespeichert, wenn die Option aktiviert ist ("Auto Save"), oder manuell.

### Einstellungen (Zahnrad)
*   **Auto Save**: Schaltet das automatische Speichern bei Änderungen an/aus.
*   **Default View**: Legt fest, ob Artikel standardmäßig im Editier- oder Lese-Modus geöffnet werden.

---

## Combat Tracker

Behalte den Überblick in Kämpfen.

### Bedienung
*   **Teilnehmer hinzufügen**: Füge Spieler und Gegner mit Namen, Initiative-Wert und Lebenspunkten (HP) hinzu.
*   **Initiative**: Sortiere die Liste automatisch nach Initiative.
*   **Runden**: Ein optionaler Rundenzähler hilft dir, die Zeit im Blick zu behalten.
*   **Drag & Drop**: Ziehe Einträge per Drag & Drop, um die Reihenfolge manuell anzupassen.
*   **Nächste Runde**: Klicke auf "Next Turn", um zur nächsten Runde zu wechseln.

### Game Mode: General
Der Standard-Modus für die meisten Systeme:
*   Name, Initiative, HP und Notizen für jeden Teilnehmer
*   Besiegte Teilnehmer (HP ≤ 0) werden visuell markiert

### Game Mode: Mutant Year Zero
Spezieller Modus für das Mutant Jahr Null System:

**Verfügbare Rollen:**
*   Vollstrecker, Schrauber, Pirscher, Hehler
*   Hundeführer, Chronist, Boss, Sklave
*   Keine Rolle

**Attribute:**
*   Stärke, Geschick, Verstand, Empathie
*   Skills-Feld für Fertigkeiten

### Einstellungen (Zahnrad)
*   **Game Mode**: Wähle zwischen "General" (allgemein) und "Mutant Year Zero" (spezielle Felder).
*   **Show Round Counter**: Zeigt oder versteckt den Rundenzähler.
*   **Auto Sort**: Wenn aktiv, wird die Liste bei jeder Änderung der Initiative automatisch neu sortiert.
*   **Default Initiative**: Standardwert für neue Einträge.

---

## Random Generator

Erstelle zufällige Ergebnisse aus Listen (z.B. Loot, Begegnungen, Namen).

### Bedienung
*   **Datei öffnen/neu**: Erstelle oder lade eine Generator-Datei.
*   **Generieren**: Klicke auf einen der Buttons, um ein zufälliges Ergebnis aus der hinterlegten Liste zu erhalten.

### Gewichtete Auswahl (Weighted Selection)

Mit der gewichteten Auswahl kannst du klassische RPG-Zufallstabellen nachbauen. Aktiviere die Option "Use Weighted Selection" in den Einstellungen.

**Format:** `<Start>-<Ende> <Eintrag>`

**Beispiel einer Begegnungstabelle:**
```
1-5 Goblin-Späher
6-8 Ork-Krieger
9-11 Hobgoblin-Hauptmann
12-12 Roter Drache
```

**So funktioniert es:**
*   Die Zahl gibt den Bereich auf einem imaginären Würfel an
*   `1-5 Goblin-Späher` hat eine Gewichtung von 5 (erscheint in ~42% der Fälle)
*   `12-12 Roter Drache` hat eine Gewichtung von 1 (erscheint in ~8% der Fälle)
*   Die Gewichtung errechnet sich aus: Ende - Start + 1
*   So kannst du häufige Ergebnisse (niedrige Zahlen) und seltene Ergebnisse (hohe Zahlen) definieren

**Ohne Gewichtung:** Wenn du die Option deaktivierst oder keine Zahlen angibst, hat jeder Eintrag die gleiche Wahrscheinlichkeit.

### Einstellungen (Zahnrad)
*   **Mappings**: Definiere deine Listen. Eine Liste besteht aus einem Namen und den Einträgen (ein Eintrag pro Zeile).
*   **Categories**: Gruppiere deine Listen in Kategorien für mehr Übersicht.
*   **Use Weighted Selection**: Aktiviert die gewichtete Auswahl (siehe oben).

---

## Notepad

Für schnelle Notizen.

### Bedienung
*   **Schreiben**: Einfaches Textfeld. Unterstützt Markdown-Formatierung.
*   **Dateien**: Du kannst Textdateien von deinem Computer öffnen ("Open File") und neue erstellen ("New File").
*   **Speichern**: Das Widget speichert Änderungen automatisch in der geöffneten Datei (sofern technisch möglich/erlaubt).

---

## Image / PDF Viewer

Zeigt Bilder oder Dokumente an.

### Bedienung
*   **Öffnen**: Klicke auf "Open File", um ein Bild (JPG, PNG, etc.) oder ein PDF auszuwählen.
*   **Anzeige**: Bilder werden eingepasst, PDFs werden in einem scrollbaren Rahmen angezeigt.
*   **Löschen**: "Clear" entfernt die aktuelle Datei aus der Ansicht.

---

## Daytime Tracker

Visualisiert die Tageszeit im Spiel.

### Bedienung
*   **Zeit einstellen**: Schiebe den Regler, um die Uhrzeit (0-23 Uhr) zu ändern.
*   **Visuelles Feedback**: Der Hintergrund und das Symbol ändern sich passend zur Tageszeit, um die Stimmung zu unterstützen.

### Tageszeiten

| Uhrzeit | Phase | Hintergrund |
|---------|-------|-------------|
| 0-4 Uhr | Nacht | Dunkelblau/Schwarz |
| 5-7 Uhr | Morgendämmerung | Übergang zu Hell |
| 8-16 Uhr | Tag | Goldgelb |
| 17-19 Uhr | Abenddämmerung | Übergang zu Dunkel |
| 20-23 Uhr | Nacht | Dunkelblau/Schwarz |

Die Farben werden interpoliert, sodass weiche Übergänge entstehen.

---

## LLM Chat

Integrierter KI-Assistent (benötigt OpenAI API Key).

### Bedienung
*   **Chatten**: Schreibe deine Frage oder Prompt in das Eingabefeld und sende es ab. Die KI antwortet im Kontext deiner vorherigen Nachrichten.
*   **Chat leeren**: Lösche den bisherigen Gesprächsverlauf, um neu zu starten.

### Wiki-Kontext

Der LLM Chat kann automatisch auf die Inhalte deines **Wiki Widgets** zugreifen. Das bedeutet:
*   Die KI kennt deine Kampagnenwelt, NPCs, Orte und Hintergrundgeschichten
*   Du kannst Fragen stellen wie "Was wissen die Spieler über den Ork-Häuptling?" und die KI nutzt deine Wiki-Einträge
*   Ideal für spontane Improvisation während der Session

### Textformatierung

Nachrichten unterstützen Markdown:
*   **Fett** mit `**text**`
*   *Kursiv* mit `*text*`
*   `Code` mit Backticks
*   Zeilenumbrüche werden beibehalten

### Einstellungen (Zahnrad)
*   **API Key**: Hier musst du deinen OpenAI API Schlüssel eintragen.
*   **Model**: Wähle das gewünschte KI-Modell (z.B. gpt-4o).
*   **Prompt**: Definiere das Verhalten der KI (System Prompt), z.B. "Du bist ein hilfreicher Assistent für D&D 5e".
*   **Temperature**: Steuert die "Kreativität" der Antworten (0 = deterministisch, 1 = kreativ).

---

## Hex Map

Erstelle und bearbeite Hexfeld-Karten für Overland-Reisen und Weltenbau.

### Modi

Das Widget hat drei Bearbeitungsmodi:

**Auswahl-Modus (Select)**
*   Klicke auf ein Hex, um es auszuwählen
*   Ändere Farbe und Beschriftung des ausgewählten Hexes
*   Ideal für Details einzelner Felder

**Mal-Modus (Paint)**
*   Ziehe mit gedrückter Maustaste über die Karte
*   Alle berührten Hexes werden in der gewählten Farbe eingefärbt
*   **Radierer**: Aktiviere den Radierer, um Hexes auf die Standardfarbe zurückzusetzen
*   Ideal für schnelles Ausfüllen großer Bereiche

**Pfad-Modus (Path)**
*   Klicke auf ein Start-Hex, dann auf ein Ziel-Hex
*   Das System berechnet automatisch den kürzesten Pfad
*   Ideal für Reiserouten und Wegmarkierungen
*   Pfade können nachträglich bearbeitet oder gelöscht werden

### Einstellungen (Zahnrad)
*   **Grid Width / Height**: Anzahl der Hexes in Breite und Höhe
*   **Hex Size**: Größe eines einzelnen Hexes in Pixeln
*   **Show Coordinates**: Zeigt oder versteckt die Koordinaten auf den Hexes
*   **Default Color**: Standardfarbe für leere Hexes

---

## Name Generator

Generiere zufällige Namen für Charaktere, Orte, Gegenstände und mehr.

### Bedienung
*   **Kategorie wählen**: Wähle links eine Hauptkategorie (z.B. Fantasy, D&D, Star Wars)
*   **Generator wählen**: Wähle einen spezifischen Generator aus der Kategorie
*   **Generieren**: Klicke auf den Button, um einen neuen Namen zu erzeugen
*   **Kopieren**: Klicke auf einen Namen in der Historie, um ihn in die Zwischenablage zu kopieren

### Verfügbare Kategorien

**Fantasy (22 Typen)**
Elfen, Zwerge, Orks, Drachen, Dämonen, Engel, Feen, Kobolde, Trolle, Riesen, Vampire, Werwölfe, Hexen, Nekromanten, Steampunk, Roboter, Aliens, Cowboys, Piraten, Ninjas, Wikinger, Ritter

**Echte Kulturen (16 Typen)**
Englisch, Deutsch, Französisch, Spanisch, Italienisch, Griechisch, Russisch, Japanisch, Chinesisch, Koreanisch, Arabisch, Hebräisch, Indisch, Afrikanisch, Skandinavisch, Native American

**D&D (10 Rassen)**
Menschen, Elfen, Zwerge, Halblinge, Gnome, Halb-Elfen, Halb-Orks, Tieflinge, Drachenblütige, Aasimar

**Star Wars (8 Typen)**
Mandalorianer, Wookiees, Twi'leks, Rodianer, Zabrak, Togruta, Sith-Namen, Darth-Namen

**Herr der Ringe (5 Typen)**
Elben, Hobbits, Zwerge, Menschen (Gondor), Menschen (Rohan)

**The Witcher (4 Typen)**
Menschen, Elfen, Zwerge, Hexer

**Game of Thrones (4 Typen)**
Westeros, Essos, Dothraki, Valyrer

**Orte (9 Typen)**
Städte, Dörfer, Burgen, Tavernen, Dungeons, Wälder, Berge, Flüsse, Inseln

**Gegenstände & Waffen (9 Typen)**
Schwerter, Bögen, Stäbe, Äxte, Schilde, Helme, Rüstungen, Ringe, Amulette

### Historie
Die letzten 20 generierten Namen werden automatisch gespeichert und können jederzeit per Klick kopiert werden.
