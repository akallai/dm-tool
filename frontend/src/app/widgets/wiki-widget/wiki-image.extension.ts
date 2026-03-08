import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export interface WikiImageOptions {
  HTMLAttributes: Record<string, any>;
  onImageUpload?: (file: File) => Promise<string>;
  resolveImageUrl?: (src: string) => Promise<string | null>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    wikiImage: {
      setWikiImage: (options: { src: string; alt?: string; title?: string }) => ReturnType;
    };
  }
}

export const WikiImage = Node.create<WikiImageOptions>({
  name: 'wikiImage',

  group: 'block',

  draggable: true,

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      onImageUpload: undefined,
      resolveImageUrl: undefined,
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[data-wiki-image]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      'data-wiki-image': 'true',
    })];
  },

  addNodeView() {
    const resolveImageUrl = this.options.resolveImageUrl;

    return ({ node, getPos, editor }) => {
      // Container wrapping the image and resize handle
      const container = document.createElement('div');
      container.classList.add('wiki-image-container');

      const img = document.createElement('img');

      // Merge attributes
      const attrs = mergeAttributes(this.options.HTMLAttributes, {}, {
        'data-wiki-image': 'true',
      });

      Object.entries(attrs).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          img.setAttribute(key, String(value));
        }
      });

      // Set alt and title from node attrs
      if (node.attrs['alt']) img.setAttribute('alt', node.attrs['alt']);
      if (node.attrs['title']) img.setAttribute('title', node.attrs['title']);

      // Apply saved width
      if (node.attrs['width']) {
        img.style.width = node.attrs['width'] + 'px';
      }

      // Handle wiki-image:// URLs
      const src = node.attrs['src'] as string | null;
      if (src?.startsWith('wiki-image://') && resolveImageUrl) {
        // Show loading state
        img.style.minHeight = '100px';
        img.style.backgroundColor = '#f0f0f0';

        resolveImageUrl(src).then((blobUrl) => {
          if (blobUrl) {
            img.src = blobUrl;
            img.style.minHeight = '';
            img.style.backgroundColor = '';
          } else {
            // Image not found - show alt text
            img.alt = node.attrs['alt'] || 'Image not found';
          }
        });
      } else if (src) {
        img.src = src;
      }

      container.appendChild(img);

      // Resize handle
      const handle = document.createElement('div');
      handle.classList.add('wiki-image-resize-handle');
      container.appendChild(handle);

      handle.addEventListener('mousedown', (startEvent: MouseEvent) => {
        startEvent.preventDefault();
        startEvent.stopPropagation();

        const startX = startEvent.clientX;
        const startWidth = img.getBoundingClientRect().width;
        container.classList.add('wiki-image-resizing');

        const onMouseMove = (moveEvent: MouseEvent) => {
          const newWidth = Math.max(50, startWidth + (moveEvent.clientX - startX));
          img.style.width = newWidth + 'px';
        };

        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
          container.classList.remove('wiki-image-resizing');

          const finalWidth = Math.round(img.getBoundingClientRect().width);
          const pos = getPos();
          if (pos !== undefined && editor && editor.view) {
            const tr = editor.view.state.tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              width: String(finalWidth),
            });
            editor.view.dispatch(tr);
          }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });

      return {
        dom: container,
      };
    };
  },

  addCommands() {
    return {
      setWikiImage: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },

  addProseMirrorPlugins() {
    const onImageUpload = this.options.onImageUpload;

    return [
      new Plugin({
        key: new PluginKey('wikiImagePasteDrop'),
        props: {
          handlePaste: (view, event) => {
            if (!onImageUpload) return false;

            const items = event.clipboardData?.items;
            if (!items) return false;

            for (const item of Array.from(items)) {
              if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                  event.preventDefault();
                  onImageUpload(file).then((src) => {
                    const { schema } = view.state;
                    const node = schema.nodes['wikiImage'].create({
                      src,
                      alt: file.name,
                    });
                    const transaction = view.state.tr.replaceSelectionWith(node);
                    view.dispatch(transaction);
                  });
                  return true;
                }
              }
            }
            return false;
          },

          handleDrop: (view, event) => {
            if (!onImageUpload) return false;

            const files = event.dataTransfer?.files;
            if (!files || files.length === 0) return false;

            const imageFiles = Array.from(files).filter(file =>
              file.type.startsWith('image/')
            );

            if (imageFiles.length === 0) return false;

            event.preventDefault();

            const coordinates = view.posAtCoords({
              left: event.clientX,
              top: event.clientY,
            });

            // Use an async IIFE with sequential processing to avoid race conditions
            (async () => {
              let pos = coordinates?.pos ?? view.state.selection.from;
              for (const file of imageFiles) {
                const src = await onImageUpload(file);
                const { schema } = view.state;
                const node = schema.nodes['wikiImage'].create({
                  src,
                  alt: file.name,
                });

                const transaction = view.state.tr.insert(pos, node);
                view.dispatch(transaction);
                // Update position for next image (node size + 1 for the position after)
                pos = pos + node.nodeSize;
              }
            })();

            return true;
          },
        },
      }),
    ];
  },
});
