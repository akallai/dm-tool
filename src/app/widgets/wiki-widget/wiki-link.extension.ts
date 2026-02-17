import { Mark, mergeAttributes } from '@tiptap/core';
import { InputRule } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export interface WikiLinkOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    wikiLink: {
      setWikiLink: (attributes: { title: string; header?: string }) => ReturnType;
      unsetWikiLink: () => ReturnType;
    };
  }
}

export const WikiLink = Mark.create<WikiLinkOptions>({
  name: 'wikiLink',

  priority: 1000,

  inclusive: false,

  excludes: 'link',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'wiki-link',
      },
    };
  },

  addAttributes() {
    return {
      title: {
        default: null,
        parseHTML: element => element.getAttribute('data-wiki-title') || element.textContent,
        renderHTML: attributes => {
          if (!attributes['title']) {
            return {};
          }
          return {
            'data-wiki-title': attributes['title'],
          };
        },
      },
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
    };
  },

  parseHTML() {
    return [
      {
        tag: 'a[data-wiki-title]',
      },
      {
        tag: 'a.wiki-link',
        getAttrs: element => {
          const el = element as HTMLElement;
          const title = el.getAttribute('data-wiki-title') || el.textContent;
          const header = el.getAttribute('data-wiki-header') || null;
          return { title, header };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['a', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setWikiLink: attributes => ({ commands }) => {
        return commands.setMark(this.name, attributes);
      },
      unsetWikiLink: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
    };
  },

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
});
