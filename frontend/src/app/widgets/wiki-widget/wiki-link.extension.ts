import { Mark, mergeAttributes } from '@tiptap/core';
import { InputRule } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export interface WikiLinkOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    wikiLink: {
      setWikiLink: (attributes: { title: string }) => ReturnType;
      unsetWikiLink: () => ReturnType;
    };
  }
}

export const WikiLink = Mark.create<WikiLinkOptions>({
  name: 'wikiLink',

  priority: 1000,

  inclusive: false,

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
          return { title };
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
    // Custom input rule: when user types [[text]] and closes with ]],
    // replace with linked text
    const wikiLinkInputRegex = /\[\[([^\]]+)\]\]$/;

    return [
      new InputRule({
        find: wikiLinkInputRegex,
        handler: ({ state, range, match, chain }) => {
          const title = match[1];
          if (!title) return;

          const start = range.from;
          const end = range.to;

          chain()
            .deleteRange({ from: start, to: end })
            .insertContentAt(start, {
              type: 'text',
              text: title,
              marks: [{ type: 'wikiLink', attrs: { title } }],
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
            // Convert [[text]] to wiki link HTML in pasted content
            return html.replace(
              /\[\[([^\]]+)\]\]/g,
              '<a class="wiki-link" data-wiki-title="$1">$1</a>'
            );
          },
          transformPastedText: (text) => {
            // This handles plain text paste - convert to HTML with links
            if (text.includes('[[')) {
              return text.replace(
                /\[\[([^\]]+)\]\]/g,
                '<a class="wiki-link" data-wiki-title="$1">$1</a>'
              );
            }
            return text;
          },
        },
      }),
    ];
  },
});
