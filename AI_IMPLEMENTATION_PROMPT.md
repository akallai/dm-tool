# AI Implementation Prompt: DM Tool

Build a web-based digital workspace application for tabletop RPG Dungeon Masters. The application provides a customizable canvas where users can add, position, resize, and configure specialized widgets to assist with running game sessions.

## Core Requirements

**Multi-Tab Workspace:**
- Users can create multiple workspace tabs
- Each tab holds its own independent set of widgets
- Tabs can be renamed (double-click to edit) and closed (minimum 1 tab)
- Tabs persist between sessions

**Background System:**
- Provide selectable background images (fantasy, sci-fi, atmospheric themes)
- Previous/next navigation controls
- Background preference persists

**Widget Framework:**
- All widgets are draggable and resizable
- Each widget has a settings dialog (gear icon)
- Widget positions, sizes, and configurations persist automatically
- Users can add widgets via a selector dialog and remove them individually
- Option to reset/clear all widgets from workspace

## Nine Required Widgets

1. **Image/PDF Viewer** - Open and display image files or PDF documents as reference materials

2. **Notepad** - Markdown editor with live preview, file save/load, auto-save functionality

3. **Random Generator** - Create customizable random tables with category organization, weighted selection support (range notation like "1-5 item"), import/export, click buttons to generate results

4. **Dice Tool** - Visual buttons for standard RPG dice (d4, d6, d8, d10, d12, d20, d100) plus custom dice notation parser (e.g., "3d6+2") showing detailed roll results

5. **Music Widget** - Create sound buttons with playlists, support sequential/random playback, loop mode, multiple simultaneous sounds, visual indication of playing state

6. **Wiki** - Hierarchical article system with markdown support, wiki-link syntax ([[Article Name]]), collapsible sidebar navigation, search, auto-save to JSON file

7. **Combat Tracker** - Two game modes (General with HP/initiative, and Mutant Year Zero with attributes), turn tracking with visual indicators, drag-drop reordering, auto-sort option, round counter, character templates for quick NPC creation

8. **Daytime Tracker** - Hour slider (0-23) with visual time-of-day representation (night/dawn/day/dusk) using color gradients and sun/moon icons

9. **LLM Chat** - AI assistant using OpenAI-compatible APIs with configurable API key/model/system prompt, automatically includes Wiki widget data from workspace as context, markdown formatting in responses

## Technical Constraints

- **Client-side only** - No backend server required
- **Data persistence** - Use browser localStorage for all widget and workspace data
- **File system integration** - Use File System Access API for widgets that save/load files (Notepad, Wiki, Random Generator, Music, Image/PDF Viewer)
- **Modern web technologies** - Use contemporary framework (Angular, React, Vue, etc.)
- **Static deployment** - Must be deployable to static hosting (GitHub Pages, Netlify, etc.)
- **No authentication** - Single-user application, no accounts needed

## Key User Experience Goals

- Minimal setup time - widgets remember previous configurations
- Auto-save everything - no manual save buttons needed
- Smooth drag-and-drop interactions
- Visual feedback for all actions (saving indicators, loading states)
- Clean, unobtrusive interface that doesn't distract from running the game
- All data persists between sessions automatically

## Success Criteria

A Game Master should be able to run an entire tabletop RPG session using only this tool, with all their commonly needed resources available as widgets in a customizable workspace that remembers their setup.

---

**Start by implementing the workspace framework with tabs and background selection, then add widgets incrementally starting with simpler ones (Dice Tool, Daytime Tracker) before tackling complex ones (Wiki, Combat Tracker, LLM Chat).**
