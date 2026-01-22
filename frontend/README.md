# DM Tool Frontend

Angular 19 web application that provides digital tools and widgets for Game Masters during tabletop RPG sessions.

## Features

### Draggable & Resizable Widgets
- All widgets can be freely positioned and resized
- Maximize/minimize functionality
- Persistent layout saving
- Individual widget settings

### Available Widgets

1. **Image/PDF Viewer** - Support for images and PDF files with drag-and-drop
2. **Notepad** - Markdown editor with preview mode and auto-saving
3. **Random Generator** - Customizable random tables with JSON import/export
4. **Dice Tool** - Standard RPG dice with custom notation support
5. **Music Widget** - Audio playback with multiple simultaneous tracks
6. **Wiki** - Hierarchical article structure with WYSIWYG editing
7. **Combat Tracker** - Initiative and HP tracking (includes Mutant Year Zero support)
8. **Daytime Tracker** - Visual time progression tracking
9. **LLM Chat** - AI chat integration with OpenAI API
10. **Hex Map** - SVG-based hex grid map with paint and path drawing
11. **Name Generator** - Random name generator with fantasy and real-world presets

### Additional Features
- Customizable backgrounds with cycling
- Persistent storage using localStorage
- Modern Material Design interface

## Development

### Prerequisites
- Node.js 18.x or higher
- Angular CLI 17.x or higher

### Quick Start

```bash
npm install
npm start
```

Navigate to http://localhost:4200

### Commands

```bash
npm start           # Start development server
npm run build       # Build for production
npm test            # Run unit tests
ng deploy           # Deploy to GitHub Pages
```

## File Structure

```
src/
├── app/
│   ├── dialogs/         # Dialog components
│   ├── services/        # Application services
│   ├── settings/        # Settings module
│   ├── widgets/         # Widget components
│   └── workspace/       # Main workspace components
├── types/               # TypeScript type definitions
├── main.ts
├── index.html
└── styles.scss
```

## Browser Requirements

- File System Access API
- CSS Grid & Flexbox
- Web Audio API
