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

---

## Dice Tool

Ein umfassender Würfelsimulator.

### Bedienung
*   **Standard-Würfel**: Klicke auf die Symbole (W4, W6, W8, etc.), um zu würfeln. Das Ergebnis erscheint sofort unten im Fenster.
*   **Benutzerdefinierte Formel**: Aktiviere über die Einstellungen die Eingabezeile. Hier kannst du komplexe Ausdrücke eingeben (z.B. `2d8+3`) und mit dem "Casino"-Button ausführen.

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

### Einstellungen (Zahnrad)
*   **Mappings**: Definiere deine Listen. Eine Liste besteht aus einem Namen und den Einträgen (ein Eintrag pro Zeile).
*   **Categories**: Gruppiere deine Listen in Kategorien für mehr Übersicht.
*   **Use Weighted Selection**: Ermöglicht unterschiedliche Wahrscheinlichkeiten für Einträge.

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
*   **Visuelles Feedback**: Der Hintergrund und das Symbol ändern sich passend zur Tageszeit (Nacht, Dämmerung, Tag), um die Stimmung zu unterstützen.

---

## LLM Chat

Integrierter KI-Assistent (benötigt OpenAI API Key).

### Bedienung
*   **Chatten**: Schreibe deine Frage oder Prompt in das Eingabefeld und sende es ab. Die KI antwortet im Kontext deiner vorherigen Nachrichten.

### Einstellungen (Zahnrad)
*   **API Key**: Hier musst du deinen OpenAI API Schlüssel eintragen.
*   **Model**: Wähle das gewünschte KI-Modell (z.B. gpt-4o).
*   **Prompt**: Definiere das Verhalten der KI (System Prompt), z.B. "Du bist ein hilfreicher Assistent für D&D 5e".
*   **Temperature**: Steuert die "Kreativität" der Antworten.
