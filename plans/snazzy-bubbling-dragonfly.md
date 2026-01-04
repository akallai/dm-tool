# Refactor Theme to Modern Glassy Design

## Goal
Update the application's UI to a modern / glassmorphism design. This involves introducing global CSS variables for the theme and refactoring widget containers and individual widgets to use these styles for a consistent look.

## Current State Analysis
- **Global Styles**: Minimal `src/styles.scss`.
- **Widget Containers**: Hardcoded semi-transparent white backgrounds (`rgba(255, 255, 255, 0.7)`), standard box-shadows.
- **Header Colors**: Hardcoded dark red (`#871313`).
- **Tab Bar**: Already uses some backdrop-filter.
- **Specific Widgets**:
    - **Wiki**: High conflict (opaque sidebar/header).
    - **Music**: Extreme conflict (physical mixer look).
    - **Combat Tracker**: High conflict (opaque cards).
    - **Random Generator**: Moderate conflict.
    - **Notepad**: Low conflict.
    - **Dice Tool**: Low conflict.

## Proposed Theme System (Glassmorphism)
We will introduce CSS variables in `src/styles.scss` to control the theme.
Since the user requested a **Full Glass Refactor**, we will aggressively override opaque backgrounds.

### CSS Variables
```css
:root {
  /* Glass Base */
  --glass-bg: rgba(20, 25, 40, 0.6); /* Darker base for better contrast */
  --glass-border: 1px solid rgba(255, 255, 255, 0.1);
  --glass-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
  --glass-backdrop: blur(12px);

  /* Text */
  --text-primary: rgba(255, 255, 255, 0.9);
  --text-secondary: rgba(255, 255, 255, 0.7);

  /* Accents */
  --accent-color: rgba(64, 196, 255, 0.8); /* Cyan/Blue accent instead of red */
  --accent-hover: rgba(64, 196, 255, 1);
  --header-bg: rgba(255, 255, 255, 0.05);

  /* Inputs/Panels */
  --panel-bg: rgba(0, 0, 0, 0.2);
  --input-bg: rgba(0, 0, 0, 0.3);
  --input-border: 1px solid rgba(255, 255, 255, 0.1);
}
```

## Execution Plan

### 1. Define Global Theme Variables
Edit `src/styles.scss`:
- Add the `:root` variables above.
- Add utility classes: `.glass-panel`, `.glass-input`, `.glass-button`.
- Override global Material styles if necessary (e.g., scrollbars).

### 2. Update Widget Container
Edit `src/app/workspace/widget-container/widget-container.component.scss`:
- Apply `--glass-bg`, `--glass-border`, `--glass-backdrop` to the main container.
- Update header to use transparent backgrounds but maintain drag capability.
- Change header buttons to be subtle/glassy.

### 3. Refactor Specific Widgets (Deep Refactor)
We need to "hollow out" the opaque backgrounds in these widgets and replace them with semi-transparent variables.

#### Wiki Widget
- Remove opaque sidebar background -> use `--panel-bg`.
- Remove header background -> make transparent with border.
- Content area: ensure text color is readable against variable backgrounds.

#### Music Widget
- This is the hardest. We will try to replace the "solid black" mixer look with a "smoked glass" look.
- Replace `#111` / `#222` with `--glass-bg` (stacked for darkness).
- Update faders/knobs to use accent colors.

#### Combat Tracker
- Convert "cards" from opaque grey to `--panel-bg`.
- Update separate "Active/Defeated" states to use colored semi-transparent overlays (e.g., `rgba(red, 0.2)` instead of solid pink).

#### Random Generator / Dice / Notepad
- Replace `#f5f5f5` backgrounds with `--panel-bg`.
- Update borders to `--glass-border`.

### 4. Cleanup & Polish
- Check text contrast. Since we are moving to a "glass" look which often implies dark mode or dynamic adaptation, we'll default to light text on dark glass (safest for generic wallpapers).
- Verify drag-and-drop handles still look interactive.
