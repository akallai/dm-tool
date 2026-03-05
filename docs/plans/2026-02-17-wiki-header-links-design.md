# Wiki Header Links Design

## Summary

Extend the wiki widget's `[[Article]]` link syntax to support linking to specific headings within articles using `[[Article#Header]]` notation. Same-article header links (`[[#Header]]`) are also supported.

## Syntax

| Input | Title | Header | Display Text |
|---|---|---|---|
| `[[Monsters]]` | Monsters | null | Monsters |
| `[[Monsters#Dragons]]` | Monsters | Dragons | Monsters#Dragons |
| `[[#Dragons]]` | null | Dragons | #Dragons |

## Changes

### 1. WikiLink Mark (`wiki-link.extension.ts`)

**New attribute:** `header` (optional, default `null`), rendered as `data-wiki-header` on the anchor element.

**Input rule regex:** Updated to capture an optional `#fragment`:
- `[[text]]` -> title=text, header=null
- `[[text#fragment]]` -> title=text, header=fragment
- `[[#fragment]]` -> title=null, header=fragment

**Paste handling:** `transformPastedHTML` and `transformPastedText` updated with the same parsing logic, emitting `data-wiki-header` when a `#` is present.

### 2. Navigation (`wiki-widget.component.ts`)

**Click handler:** Reads both `data-wiki-title` and `data-wiki-header` from the clicked anchor.

**`handleWikiLink` logic:**
1. **Cross-article + header** (`[[Monsters#Dragons]]`): Find article by title, navigate to it, wait for content to render, scroll to matching heading.
2. **Same-article header** (`[[#Dragons]]`): Scroll to matching heading in the current editor content. No article navigation.
3. **Article only** (`[[Monsters]]`): Existing behavior, unchanged.
4. **Article found, header not found**: Navigate to the article, show warning "Header 'X' not found in 'Y'" for 3 seconds.
5. **Article not found**: Existing behavior, show error.

**Scroll-to-heading:** Query `h1, h2, h3` elements in the editor container, match by `textContent.trim()` (case-insensitive), call `scrollIntoView()` on the first match.

### 3. No Data Model Changes

- `WikiArticle` interface unchanged
- localStorage/file storage format unchanged
- Export/import unchanged
- No content migration needed

## Backwards Compatibility

- Existing `[[Article]]` links work unchanged (`header` defaults to `null`)
- Existing stored HTML (`<a class="wiki-link" data-wiki-title="...">`) parses correctly since `data-wiki-header` is optional
- No migration required
