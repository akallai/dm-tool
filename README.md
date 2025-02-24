# DM Tool - A Digital Game Master's Companion

A versatile web application built with Angular that provides various tools and widgets to assist Game Masters during tabletop roleplaying sessions.

## Features

### Draggable & Resizable Widgets
- All widgets can be freely positioned and resized
- Maximize/minimize functionality
- Persistent layout saving
- Individual widget settings

### Available Widgets

1. **Image/PDF Viewer**
   - Support for images and PDF files
   - Drag-and-drop file loading
   - File persistence

2. **Notepad**
   - Markdown support
   - Auto-saving functionality
   - Preview mode
   - File system integration

3. **Random Generator**
   - Customizable random tables
   - JSON file import/export
   - Quick access buttons
   - Real-time results display

4. **Dice Tool**
   - Standard RPG dice (d4, d6, d8, d10, d12, d20, d100)
   - Custom dice notation support
   - Configurable dice sets
   - Roll history

5. **Music Widget**
   - Audio file playback
   - Multiple simultaneous tracks
   - Customizable sound buttons
   - Loop functionality

6. **Wiki**
   - Hierarchical article structure
   - Markdown editing
   - Article linking
   - Search functionality
   - Auto-saving

7. **Combat Tracker**
   - Initiative tracking
   - HP management
   - Turn order
   - Special support for Mutant Year Zero system
   - Round counter

8. **Daytime Tracker**
   - Visual time tracking
   - Day/night cycle visualization
   - Customizable time scale

### Additional Features
- Customizable backgrounds
- Background cycling
- Persistent storage using localStorage
- Modern Material Design interface

## Technical Requirements

- Node.js 18.x or higher
- Angular CLI 17.x or higher
- Modern web browser with File System Access API support

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
```
2. Install dependencies:
```bash
npm install
```
3. Start the development server:
```bash
ng serve
```
4. Navigate to http://localhost:4200 in your browser
# Building for Production
Run `ng build` to build the project. The build artifacts will be stored in the dist/ directory.
5. Deploy new version:
`ng deploy`
# Dependencies
- @angular/material
- @angular/cdk
- marked
- lucide-react
- recharts
- lodash

# Development Notes
## File Structure
```
src/
├── app/
│   ├── dialogs/         # Dialog components
│   ├── services/        # Application services
│   ├── settings/        # Settings module
│   ├── widgets/         # Widget components
│   └── workspace/       # Main workspace components
```
# Widget Development
New widgets should:

Implement standalone component architecture
1. Support drag-and-drop functionality
2. Include settings configuration
3. Handle persistent storage
4. Follow the established widget interface

# Browser Support
The application requires modern browser features including:

- File System Access API
- CSS Grid
- Flexbox
- Web Audio API