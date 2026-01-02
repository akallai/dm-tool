# DM Tool - Functional Requirements

## Product Overview

**DM Tool** is a digital workspace application designed to assist tabletop roleplaying game Dungeon Masters (Game Masters) during game sessions. The product provides a customizable, multi-tab workspace where users can add, arrange, and configure specialized widgets that support various aspects of running a game session.

### Core Purpose
To provide a comprehensive, all-in-one digital assistant that replaces physical DM screens, notebooks, music players, reference materials, and various other tools Game Masters typically need during sessions.

---

## Primary Features

### Multi-Tab Workspace System
Users can organize their tools across multiple workspace tabs, allowing for different configurations per campaign, session type, or organizational preference.

**Requirements:**
- Create unlimited workspace tabs
- Switch between tabs instantly
- Rename tabs by double-clicking the tab name
- Close tabs (minimum one tab must always exist)
- Each tab maintains its own independent set of widgets
- Tab configuration persists between sessions

### Customizable Background
Visual customization to match campaign themes or user preference.

**Requirements:**
- Provide multiple pre-configured background images
- Include variety: fantasy, sci-fi, modern, atmospheric themes
- Allow users to cycle through backgrounds using navigation controls
- Background preference persists between sessions

### Widget System
The core of the application - a collection of specialized tools that can be added, removed, positioned, and resized.

**Requirements:**
- Widget selector to browse and add available widgets
- Each widget can be dragged to any position on screen
- Each widget can be resized
- Widget positions and sizes persist between sessions
- Each widget has configurable settings accessed via a settings button
- Widgets can be individually removed
- Option to reset entire workspace (remove all widgets)
- All widget data persists between sessions

---

## Widget Specifications

### 1. Image/PDF Viewer Widget

**Purpose:** Display reference images, maps, handouts, or PDF documents during sessions.

**Functional Requirements:**
- Open and display image files (PNG, JPG, JPEG, GIF, BMP)
- Open and display PDF documents
- Display opened files within the widget bounds
- Provide a clear/close function to remove current file
- File persists within widget until manually cleared
- Simple file selection interface

**Use Cases:**
- Display battle maps
- Show player handouts
- Reference rulebook pages
- Display character portraits or location images

---

### 2. Notepad Widget

**Purpose:** Take and maintain session notes with rich text formatting support.

**Functional Requirements:**
- Create new text documents
- Open existing text documents from file system
- Support markdown formatting syntax
- Provide live preview of formatted text
- Auto-save changes to file
- Visual indicator when saving
- Click-to-edit interaction pattern
- Preserve content between sessions

**Markdown Support Required:**
- Headings (multiple levels)
- Bold and italic text
- Bulleted and numbered lists
- Code blocks
- Tables
- Blockquotes
- Links

**Use Cases:**
- Session notes and minutes
- NPC dialogue scripts
- Quest tracking
- Player action logs
- Campaign planning notes

---

### 3. Random Generator Widget

**Purpose:** Generate random results from customizable tables for game elements like loot, encounters, NPCs, weather, etc.

**Functional Requirements:**

**Table Management:**
- Create unlimited random tables
- Each table has a name (displayed on button)
- Each table contains a list of possible results (one per line)
- Optional category assignment for organization
- Import/export tables as files
- Auto-save table changes

**Generation Features:**
- Click a table's button to generate random result
- Display last generated result prominently
- Support weighted selection system:
  - Items can have numeric ranges (e.g., "1-5 Common Item" = 5x more likely)
  - Toggle weighted selection on/off

**Organization:**
- Group tables by category
- Collapsible category sections
- Uncategorized items section
- Visual organization of many tables

**Use Cases:**
- Treasure generation
- Random encounters
- NPC name generation
- Weather determination
- Plot hooks and complications
- Tavern menu items
- Random magical effects

---

### 4. Dice Tool Widget

**Purpose:** Roll virtual dice for game mechanics and random number generation.

**Functional Requirements:**

**Standard Dice:**
- Visual buttons for standard RPG dice: d4, d6, d8, d10, d12, d20, d100
- Click any die to roll it
- Display result clearly
- Show which die was rolled

**Custom Dice Notation:**
- Text input for complex dice formulas
- Support notation format: NdX+Y or NdX-Y
  - N = number of dice
  - X = die type
  - Y = modifier
  - Example: "3d6+2" rolls three 6-sided dice and adds 2
- Support alternative notation with "w" instead of "d"
- Display detailed results:
  - Individual die rolls
  - Sum of dice
  - Modifier applied
  - Final total

**Configuration:**
- Enable/disable individual standard dice
- Show/hide custom dice notation input
- Settings persist per widget instance

**Use Cases:**
- Ability checks and saving throws
- Attack rolls and damage
- Initiative rolls
- Loot quantity determination
- Random percentile results

---

### 5. Music Widget

**Purpose:** Play background music and sound effects to enhance game atmosphere.

**Functional Requirements:**

**Sound Button System:**
- Create unlimited sound buttons
- Each button has a custom label
- Each button can contain multiple audio files (playlist)
- Click button to play associated sounds
- Click again to stop

**Playback Features:**
- Play sounds in sequential order or random order
- Loop functionality (restart playlist when finished)
- Option to allow multiple simultaneous sounds
- Visual indication of currently playing sounds (highlighted button)
- Automatic progression through playlist

**Configuration Per Button:**
- Custom button label
- Multiple audio file selection
- Playlist management

**Global Settings:**
- Toggle multiple simultaneous sounds
- Toggle random playback order
- Toggle loop mode

**Use Cases:**
- Background ambiance (tavern, forest, dungeon)
- Combat music
- Sound effects (door creaking, thunder, monster roars)
- Mood music for different scenes
- Region-specific themes

---

### 6. Wiki Widget

**Purpose:** Maintain a structured campaign knowledge base with interconnected articles.

**Functional Requirements:**

**Article Structure:**
- Hierarchical organization (articles can contain sub-articles)
- Each article contains:
  - Title
  - Content (with markdown formatting)
  - Optional child articles (unlimited depth)

**Article Operations:**
- Create new articles
- Edit existing articles
- Delete articles
- Add sub-articles to any article
- Move between parent and child articles

**Content Features:**
- Markdown editing with preview mode
- Wiki-link syntax: [[Article Name]] creates clickable links between articles
- Links navigate directly to referenced articles

**Navigation:**
- Sidebar with collapsible article tree
- Click article in sidebar to view
- Click wiki-links in content to navigate
- Search/filter articles by name
- Breadcrumb or back navigation

**File Management:**
- Create new wiki (new knowledge base)
- Open existing wiki from file
- Auto-save changes to file
- Visual saving indicator

**Use Cases:**
- Campaign world building
- NPC database
- Location descriptions
- Historical timeline
- Faction information
- Magic item compendium
- Quest and plot tracking

---

### 7. Combat Tracker Widget

**Purpose:** Manage combat encounters with initiative order, turn tracking, and combatant information.

**Functional Requirements:**

**Game Mode Selection:**
Two distinct modes for different game systems:

**Mode 1: General RPG Mode**
Each combatant has:
- Name
- Initiative value
- Hit Points (HP)
- Notes field

Special behavior:
- Visual indication when HP reaches 0 (defeated/dead)

**Mode 2: Mutant Year Zero Mode**
Each combatant has:
- Name
- Initiative value
- Role
- Four attributes: Strength, Agility, Wits, Empathy
- Skills field
- Notes field

Special feature:
- Pre-defined character templates for quick NPC creation
- Templates include: Various NPC roles with pre-filled stats

**Core Combat Features (Both Modes):**

**Initiative Management:**
- Manual initiative entry
- Drag and drop to manually reorder combatants
- Manual sort button (sorts by initiative value descending)
- Auto-sort option (always maintains initiative order)
- Configurable default initiative value for new combatants

**Turn Tracking:**
- Visual indicator of active combatant's turn
- "Next Turn" button advances to next combatant in order
- Automatic round counter increment when cycling back to first combatant
- Round counter display (can be shown/hidden)
- Clear visual distinction between active and waiting combatants

**Combatant Management:**
- Add new combatants with template selection
- Remove combatants from encounter
- All fields inline editable (click to edit)
- Changes save automatically

**Combat State:**
- Reset function (clears turn pointer and round counter, keeps combatants)
- All combatant data persists
- Current turn and round number persists

**Interface Requirements:**
- Compact, scrollable list
- All information visible without excessive clicking
- Quick access to all common operations

**Use Cases:**
- Initiative tracking
- HP/damage management
- Turn order management
- Quick NPC stat reference during combat
- Round/time tracking
- Status effect notes

---

### 8. Daytime Tracker Widget

**Purpose:** Visual representation and tracking of in-game time and day/night cycles.

**Functional Requirements:**

**Time Control:**
- Hour slider (0-23 hours)
- Display current hour numerically

**Visual Time Period Representation:**
Must visually distinguish time periods:
- **Night** (0-5, 20-23): Dark theme
- **Dawn** (5-8): Transition from dark to light
- **Day** (8-17): Bright theme
- **Dusk** (17-20): Transition from light to dark

**Visual Elements:**
- Background color changes based on time period
- Smooth color transitions between periods
- Sun and moon icons for reference
- Text automatically contrasts with background for readability
- Large, clear time display

**Persistence:**
- Current time persists between sessions

**Use Cases:**
- Track in-game time passage
- Visual reminder of time of day for atmosphere
- Coordinate time-based events and encounters
- Night/day mechanics tracking
- NPC schedule alignment

---

### 9. LLM Chat Widget

**Purpose:** AI-powered assistant for Game Masters using large language models to help with improvisation, idea generation, and campaign assistance.

**Functional Requirements:**

**Chat Interface:**
- Text input for messages
- Send messages (Enter key to send, Shift+Enter for line break)
- Display conversation history with user and AI messages
- Clear conversation function
- Auto-scroll to newest messages
- Loading indicator during AI response generation

**AI Integration:**
- Connect to OpenAI-compatible API services
- Configurable API endpoint
- Configurable API key
- Selectable AI model
- Custom system prompt configuration

**Context Awareness:**
- Automatically access and include wiki data from Wiki widgets in the same workspace
- Refresh wiki context periodically
- AI can reference campaign information, NPCs, locations from wiki

**Message Display:**
- Support basic formatting in AI responses (bold, italic, code)
- Clear visual distinction between user and AI messages
- Error message display for API failures

**Configuration:**
- API key input (secure/hidden)
- Model selection dropdown
- System prompt editor
- Settings persist

**Use Cases:**
- Generate NPC dialogue on the fly
- Create improvised plot hooks
- Get campaign-aware suggestions
- Generate descriptions (rooms, NPCs, items)
- Answer rules questions
- Brainstorm ideas with campaign context
- Expand on player unexpected actions

---

## Data Persistence Requirements

**Application State:**
- All workspace configurations must persist between sessions
- All tab configurations must persist between sessions
- All widget positions, sizes, and settings must persist between sessions
- Background selection must persist between sessions
- Active tab must be restored on application load

**Widget Data:**
Each widget type has specific data that must persist:
- **Image/PDF Viewer:** Currently loaded file
- **Notepad:** File path and content
- **Random Generator:** All tables, categories, settings
- **Dice Tool:** Enabled dice, custom dice visibility
- **Music Widget:** All sound buttons, playlists, playback settings
- **Wiki Widget:** File path and all article content
- **Combat Tracker:** Game mode, combatants, turn state, round number, settings
- **Daytime Tracker:** Current hour
- **LLM Chat:** API configuration, conversation history

**File System Integration:**
Some widgets should save/load data from the user's file system:
- Notepad: Text files
- Random Generator: JSON files for table data
- Music Widget: Audio files
- Wiki Widget: JSON files for wiki data
- Image/PDF Viewer: Image and PDF files

**Storage Requirements:**
- Automatic saving (no manual save button required)
- Data persists in browser storage
- File-based widgets also persist to user's file system
- Visual feedback when saving to file system
- Debounced auto-save to prevent excessive file writes

---

## User Experience Requirements

**Intuitive Interface:**
- Minimal learning curve for basic features
- Common UI patterns (drag-drop, click-to-edit, button clicks)
- Tooltips or visual cues for non-obvious features
- Responsive feedback for all user actions

**Performance:**
- Instant tab switching
- Smooth widget dragging and resizing
- Responsive UI (no lag during normal operations)
- Efficient handling of large datasets (many wiki articles, long combat encounters)

**Reliability:**
- No data loss between sessions
- Graceful error handling (file loading failures, API errors)
- Clear error messages for user-correctable issues
- Fallback behaviors when features unavailable

**Accessibility:**
- Keyboard navigation where appropriate
- Sufficient color contrast for readability
- Clear visual hierarchies
- Readable text sizes

---

## Deployment Requirements

**Platform:**
- Web-based application accessible via modern browsers
- No installation required
- No server-side dependencies
- Can be hosted as static website
- Works offline (except LLM Chat widget)

**Browser Compatibility:**
- Modern browsers with File System Access API support
- Chrome, Edge (recommended)
- Firefox, Safari (where File System Access API available)

**No Backend Required:**
- Fully client-side application
- All data storage in browser and local file system
- No user accounts or authentication system
- No server-side data processing

---

## Future Considerations

**Potential Enhancements:**
- Additional widget types (initiative timer, spell tracker, etc.)
- Themes/color schemes
- Widget templates/presets
- Export/import workspace configurations
- Cloud storage integration
- Shared workspaces for online games
- Mobile/tablet optimization
- Custom widget creation framework
- Plugin system for community widgets

---

## Success Criteria

The product successfully fulfills its purpose when:
- A Game Master can run an entire session using only this tool
- All commonly needed DM tools are available as widgets
- The workspace can be customized to individual DM preferences
- Data persists reliably without user intervention
- The interface doesn't distract from running the game
- Setup time is minimal (widgets remember previous configurations)

---

## Technical Constraints

**Must Support:**
- Modern JavaScript/TypeScript frameworks
- Browser localStorage API
- File System Access API (for file-based widgets)
- Drag and drop functionality
- Responsive layout systems
- Audio playback
- PDF rendering
- Markdown rendering
- External API calls (for LLM Chat)

**No Requirements For:**
- Server-side infrastructure
- Database systems
- User authentication
- Multi-user real-time collaboration (single-user application)
- Mobile native apps (web-only)

---

## Summary

DM Tool is a comprehensive, single-page web application providing tabletop RPG Game Masters with a customizable workspace containing nine specialized widgets: Image/PDF Viewer, Notepad, Random Generator, Dice Tool, Music Player, Wiki, Combat Tracker, Daytime Tracker, and LLM Chat. The application requires no backend, stores data locally, and persists all user configurations between sessions. It serves as an all-in-one digital replacement for the various physical and digital tools Game Masters traditionally juggle during game sessions.
