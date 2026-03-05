# Wiki Header Links Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend wiki links to support `[[Article#Header]]` syntax for linking to specific headings within articles.

**Architecture:** Extend the existing `WikiLink` TipTap mark with an optional `header` attribute. The input rule, paste handlers, click handler, and navigation logic are all updated to parse and use the `#` separator. No data model changes.

**Tech Stack:** Angular 19, TipTap (@tiptap/core), ProseMirror

---

### Task 1: Add `header` attribute to WikiLink mark

**Files:**
- Modify: `src/app/widgets/wiki-widget/wiki-link.extension.ts:9-16` (command types)
- Modify: `src/app/widgets/wiki-widget/wiki-link.extension.ts:35-49` (addAttributes)
- Modify: `src/app/widgets/wiki-widget/wiki-link.extension.ts:52-65` (parseHTML)

**Step 1: Update command type declaration**

In the `declare module '@tiptap/core'` block (lines 9-16), update `setWikiLink` to accept an optional `header`:

```typescript
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    wikiLink: {
      setWikiLink: (attributes: { title: string; header?: string }) => ReturnType;
      unsetWikiLink: () => ReturnType;
    };
  }
}
```

**Step 2: Add `header` attribute in `addAttributes()`**

Add a new `header` attribute after the existing `title` attribute (after line 48):

```typescript
header: {
  default: null,
  parseHTML: element => element.getAttribute('data-wiki-header') || null,
  renderHTML: attributes => {
    if (!attributes['header']) {
      return {};
    }
    return {
      'data-wiki-header': attributes['header'],
    };
  },
},
```

**Step 3: Update `parseHTML()` to read `header` from existing anchors**

Update the `a.wiki-link` parser (lines 58-64) to also extract `data-wiki-header`:

```typescript
{
  tag: 'a.wiki-link',
  getAttrs: element => {
    const el = element as HTMLElement;
    const title = el.getAttribute('data-wiki-title') || el.textContent;
    const header = el.getAttribute('data-wiki-header') || null;
    return { title, header };
  },
},
```

Also add header extraction to the `a[data-wiki-title]` rule (lines 53-55) — currently it has no `getAttrs`, so TipTap uses the attribute definitions to auto-parse. Since `data-wiki-header` is defined in `addAttributes()`, the auto-parsing will handle it. No change needed for this rule.

**Step 4: Verify the build compiles**

Run: `ng build --configuration development 2>&1 | head -20`
Expected: Build succeeds (or only unrelated warnings)

**Step 5: Commit**

```bash
git add src/app/widgets/wiki-widget/wiki-link.extension.ts
git commit -m "feat(wiki): add header attribute to WikiLink mark"
```

---

### Task 2: Update input rule to parse `#` separator

**Files:**
- Modify: `src/app/widgets/wiki-widget/wiki-link.extension.ts:83-108` (addInputRules)

**Step 1: Update the input rule regex and handler**

Replace the `addInputRules()` method (lines 83-108) with:

```typescript
addInputRules() {
  // Custom input rule: when user types [[text]] or [[text#header]] and closes with ]],
  // replace with linked text
  const wikiLinkInputRegex = /\[\[([^\]]+)\]\]$/;

  return [
    new InputRule({
      find: wikiLinkInputRegex,
      handler: ({ state, range, match, chain }) => {
        const fullMatch = match[1];
        if (!fullMatch) return;

        const hashIndex = fullMatch.indexOf('#');
        let title: string | null = null;
        let header: string | null = null;

        if (hashIndex !== -1) {
          title = fullMatch.substring(0, hashIndex) || null;
          header = fullMatch.substring(hashIndex + 1) || null;
        } else {
          title = fullMatch;
        }

        const displayText = fullMatch;
        const start = range.from;
        const end = range.to;

        chain()
          .deleteRange({ from: start, to: end })
          .insertContentAt(start, {
            type: 'text',
            text: displayText,
            marks: [{ type: 'wikiLink', attrs: { title, header } }],
          })
          .run();
      },
    }),
  ];
},
```

Key behavior:
- `[[Monsters]]` → title=`"Monsters"`, header=`null`, display=`"Monsters"`
- `[[Monsters#Dragons]]` → title=`"Monsters"`, header=`"Dragons"`, display=`"Monsters#Dragons"`
- `[[#Dragons]]` → title=`null`, header=`"Dragons"`, display=`"#Dragons"`

**Step 2: Verify the build compiles**

Run: `ng build --configuration development 2>&1 | head -20`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/app/widgets/wiki-widget/wiki-link.extension.ts
git commit -m "feat(wiki): parse # separator in wiki link input rule"
```

---

### Task 3: Update paste handlers for `#` separator

**Files:**
- Modify: `src/app/widgets/wiki-widget/wiki-link.extension.ts:111-137` (addProseMirrorPlugins)

**Step 1: Update `transformPastedHTML` and `transformPastedText`**

Replace the `addProseMirrorPlugins()` method (lines 111-137) with:

```typescript
addProseMirrorPlugins() {
  // Handle pasted content with [[wiki links]]
  return [
    new Plugin({
      key: new PluginKey('wikiLinkPaste'),
      props: {
        transformPastedHTML: (html) => {
          // Convert [[text]] and [[text#header]] to wiki link HTML in pasted content
          return html.replace(
            /\[\[([^\]]+)\]\]/g,
            (_match, content) => {
              const hashIndex = content.indexOf('#');
              if (hashIndex !== -1) {
                const title = content.substring(0, hashIndex);
                const header = content.substring(hashIndex + 1);
                const titleAttr = title ? ` data-wiki-title="${title}"` : '';
                const headerAttr = header ? ` data-wiki-header="${header}"` : '';
                return `<a class="wiki-link"${titleAttr}${headerAttr}>${content}</a>`;
              }
              return `<a class="wiki-link" data-wiki-title="${content}">${content}</a>`;
            }
          );
        },
        transformPastedText: (text) => {
          // This handles plain text paste - convert to HTML with links
          if (text.includes('[[')) {
            return text.replace(
              /\[\[([^\]]+)\]\]/g,
              (_match, content) => {
                const hashIndex = content.indexOf('#');
                if (hashIndex !== -1) {
                  const title = content.substring(0, hashIndex);
                  const header = content.substring(hashIndex + 1);
                  const titleAttr = title ? ` data-wiki-title="${title}"` : '';
                  const headerAttr = header ? ` data-wiki-header="${header}"` : '';
                  return `<a class="wiki-link"${titleAttr}${headerAttr}>${content}</a>`;
                }
                return `<a class="wiki-link" data-wiki-title="${content}">${content}</a>`;
              }
            );
          }
          return text;
        },
      },
    }),
  ];
},
```

**Step 2: Verify the build compiles**

Run: `ng build --configuration development 2>&1 | head -20`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/app/widgets/wiki-widget/wiki-link.extension.ts
git commit -m "feat(wiki): support # separator in pasted wiki links"
```

---

### Task 4: Update click handler to read `header` attribute

**Files:**
- Modify: `src/app/widgets/wiki-widget/wiki-widget.component.ts:211-231` (click handler)

**Step 1: Update the click handler to pass `header` to `handleWikiLink`**

Replace the click handler (lines 211-231) with:

```typescript
// Handle wiki link clicks via event delegation
this.wikiLinkClickHandler = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  const anchor = target.closest('a') as HTMLAnchorElement | null;
  if (!anchor) return;

  // Always prevent default on anchor clicks inside the editor
  e.preventDefault();
  e.stopPropagation();

  // Check if this is a wiki link and navigate to the article
  const wikiLink = target.closest('a.wiki-link') as HTMLElement | null
    || (anchor.classList.contains('wiki-link') ? anchor : null);
  if (wikiLink) {
    const title = wikiLink.getAttribute('data-wiki-title') || null;
    const header = wikiLink.getAttribute('data-wiki-header') || null;
    if (title || header) {
      this.handleWikiLink(title, header);
    }
  }
};
```

Key change: reads `data-wiki-header`, passes both `title` and `header` to `handleWikiLink`. Also changed `title` to use `|| null` instead of `|| wikiLink.textContent` since same-article links (`[[#Header]]`) have no title.

**Step 2: Verify the build compiles** (it won't yet — `handleWikiLink` signature mismatch — that's expected, we fix it in Task 5)

**Step 3: Commit** (defer to Task 5)

---

### Task 5: Update `handleWikiLink` and add `scrollToHeader`

**Files:**
- Modify: `src/app/widgets/wiki-widget/wiki-widget.component.ts:714-729` (handleWikiLink)
- Add method: `scrollToHeader` (new private method)

**Step 1: Replace `handleWikiLink` method**

Replace `handleWikiLink` (lines 714-729) with:

```typescript
// Handler for wiki link clicks
handleWikiLink(title: string | null, header: string | null = null) {
  if (!title && header) {
    // Same-article header link: [[#Header]]
    this.scrollToHeader(header, this.currentArticle?.title || 'current article');
    return;
  }

  if (!title) return;

  // Searches the tree for an article with the matching title
  const found = this.findArticleByTitle(this.wikiData.articles, title);
  if (found) {
    this.selectArticle(found).then(() => {
      if (header) {
        // Cross-article header link: [[Article#Header]]
        // Small delay to let the DOM render the new content
        setTimeout(() => this.scrollToHeader(header, title), 50);
      }
    });
  } else {
    this.errorMessage = `Article "${title}" not found.`;
    this.cdr.markForCheck();

    setTimeout(() => {
      this.errorMessage = '';
      this.cdr.markForCheck();
    }, 3000);
  }
}
```

**Step 2: Add `scrollToHeader` private method**

Add this method right after `handleWikiLink`:

```typescript
private scrollToHeader(header: string, articleName: string) {
  if (!this.editorContainer?.nativeElement) return;

  const headings = this.editorContainer.nativeElement.querySelectorAll('h1, h2, h3');
  const target = Array.from(headings).find(
    (el) => (el as HTMLElement).textContent?.trim().toLowerCase() === header.toLowerCase()
  ) as HTMLElement | undefined;

  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    this.errorMessage = `Header "${header}" not found in "${articleName}".`;
    this.cdr.markForCheck();

    setTimeout(() => {
      this.errorMessage = '';
      this.cdr.markForCheck();
    }, 3000);
  }
}
```

**Step 3: Verify the build compiles**

Run: `ng build --configuration development 2>&1 | head -20`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/app/widgets/wiki-widget/wiki-widget.component.ts
git commit -m "feat(wiki): support header navigation in wiki links"
```

---

### Task 6: Manual smoke test

**Steps:**
1. Run: `ng serve`
2. Open http://localhost:4200
3. Create/open a wiki widget with at least two articles

**Test cases:**
- Type `[[ExistingArticle]]` — should navigate to article (unchanged behavior)
- Type `[[ExistingArticle#SomeHeading]]` — should navigate to article AND scroll to heading
- Type `[[#SomeHeading]]` — should scroll to heading in current article
- Type `[[ExistingArticle#NonexistentHeading]]` — should navigate to article, show "Header not found" warning
- Type `[[NonexistentArticle#Heading]]` — should show "Article not found" error
- Paste text containing `[[Article#Header]]` — should create a wiki link with correct attributes
- Verify old wiki links (without `#`) still work correctly

**Step 2: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix(wiki): address issues found during smoke test"
```
