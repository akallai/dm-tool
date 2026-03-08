import { Editor } from '@tiptap/core';
import { Document } from '@tiptap/extension-document';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Text } from '@tiptap/extension-text';
import { WikiImage } from './wiki-image.extension';

/**
 * Helper: create a TipTap Editor with the WikiImage extension.
 */
function createEditor(options?: { resolveImageUrl?: (src: string) => Promise<string | null> }) {
  const element = document.createElement('div');
  document.body.appendChild(element);

  const editor = new Editor({
    element,
    extensions: [
      Document,
      Paragraph,
      Text,
      WikiImage.configure({
        resolveImageUrl: options?.resolveImageUrl,
      }),
    ],
    content: '',
  });

  return { editor, element };
}

function insertImage(editor: Editor, attrs: Record<string, any> = {}) {
  editor.commands.setWikiImage({ src: 'https://example.com/test.png', ...attrs });
}

function getContainer(element: HTMLElement): HTMLElement {
  return element.querySelector('.wiki-image-container') as HTMLElement;
}

function getImg(element: HTMLElement): HTMLImageElement {
  return element.querySelector('img[data-wiki-image]') as HTMLImageElement;
}

function getHandle(element: HTMLElement): HTMLElement {
  return element.querySelector('.wiki-image-resize-handle') as HTMLElement;
}

function getNodeAttrs(editor: Editor) {
  const { doc } = editor.state;
  let attrs: Record<string, any> | null = null;
  doc.descendants((node) => {
    if (node.type.name === 'wikiImage') {
      attrs = { ...node.attrs };
      return false;
    }
  });
  return attrs;
}

/**
 * Simulate a full drag sequence on the resize handle.
 */
function simulateDrag(handle: HTMLElement, deltaX: number) {
  const startX = 200;

  handle.dispatchEvent(new MouseEvent('mousedown', {
    clientX: startX,
    bubbles: true,
    cancelable: true,
  }));

  document.dispatchEvent(new MouseEvent('mousemove', {
    clientX: startX + deltaX,
    bubbles: true,
  }));

  document.dispatchEvent(new MouseEvent('mouseup', {
    clientX: startX + deltaX,
    bubbles: true,
  }));
}

describe('WikiImage Extension — Node View', () => {
  let editor: Editor;
  let element: HTMLElement;

  afterEach(() => {
    editor?.destroy();
    element?.remove();
  });

  describe('DOM structure', () => {
    it('should wrap image in a container div', () => {
      ({ editor, element } = createEditor());
      insertImage(editor);

      const container = getContainer(element);
      expect(container).toBeTruthy();
      expect(container.tagName).toBe('DIV');
      expect(container.classList.contains('wiki-image-container')).toBe(true);
    });

    it('should contain an img with data-wiki-image attribute', () => {
      ({ editor, element } = createEditor());
      insertImage(editor);

      const img = getImg(element);
      expect(img).toBeTruthy();
      expect(img.tagName).toBe('IMG');
      expect(img.getAttribute('data-wiki-image')).toBe('true');
    });

    it('should contain a resize handle div', () => {
      ({ editor, element } = createEditor());
      insertImage(editor);

      const handle = getHandle(element);
      expect(handle).toBeTruthy();
      expect(handle.tagName).toBe('DIV');
      expect(handle.classList.contains('wiki-image-resize-handle')).toBe(true);
    });

    it('should set img src for regular URLs', () => {
      ({ editor, element } = createEditor());
      insertImage(editor);

      const img = getImg(element);
      expect(img.src).toContain('example.com/test.png');
    });

    it('should set alt attribute', () => {
      ({ editor, element } = createEditor());
      insertImage(editor, { alt: 'Test image' });

      const img = getImg(element);
      expect(img.getAttribute('alt')).toBe('Test image');
    });

    it('should set title attribute', () => {
      ({ editor, element } = createEditor());
      insertImage(editor, { title: 'My title' });

      const img = getImg(element);
      expect(img.getAttribute('title')).toBe('My title');
    });
  });

  describe('saved width restoration', () => {
    it('should apply saved width from node attributes', () => {
      ({ editor, element } = createEditor());

      // Insert image with pre-set width (simulating loading from saved content)
      editor.commands.insertContent({
        type: 'wikiImage',
        attrs: { src: 'https://example.com/test.png', width: '300' },
      });

      const img = getImg(element);
      expect(img.style.width).toBe('300px');
    });

    it('should not constrain width when no saved width exists', () => {
      ({ editor, element } = createEditor());
      insertImage(editor);

      const img = getImg(element);
      expect(img.style.width).toBe('');
    });
  });

  describe('resize drag interaction', () => {
    it('should add resizing class during drag', () => {
      ({ editor, element } = createEditor());
      insertImage(editor);

      const handle = getHandle(element);
      const container = getContainer(element);

      // mousedown adds class
      handle.dispatchEvent(new MouseEvent('mousedown', {
        clientX: 200,
        bubbles: true,
        cancelable: true,
      }));

      expect(container.classList.contains('wiki-image-resizing')).toBe(true);

      // mouseup removes class
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      expect(container.classList.contains('wiki-image-resizing')).toBe(false);
    });

    it('should update img width on mousemove', () => {
      ({ editor, element } = createEditor());

      // Insert with known width so getBoundingClientRect returns something predictable
      editor.commands.insertContent({
        type: 'wikiImage',
        attrs: { src: 'https://example.com/test.png', width: '200' },
      });

      const handle = getHandle(element);
      const img = getImg(element);

      // Mock getBoundingClientRect to return controlled width
      jest.spyOn(img, 'getBoundingClientRect').mockReturnValue({
        width: 200, height: 150, top: 0, left: 0, bottom: 150, right: 200, x: 0, y: 0, toJSON: () => {},
      });

      const startX = 300;
      handle.dispatchEvent(new MouseEvent('mousedown', {
        clientX: startX,
        bubbles: true,
        cancelable: true,
      }));

      // Drag 100px to the right
      document.dispatchEvent(new MouseEvent('mousemove', {
        clientX: startX + 100,
        bubbles: true,
      }));

      expect(img.style.width).toBe('300px');

      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });

    it('should enforce minimum width of 50px', () => {
      ({ editor, element } = createEditor());
      editor.commands.insertContent({
        type: 'wikiImage',
        attrs: { src: 'https://example.com/test.png', width: '100' },
      });

      const handle = getHandle(element);
      const img = getImg(element);

      jest.spyOn(img, 'getBoundingClientRect').mockReturnValue({
        width: 100, height: 75, top: 0, left: 0, bottom: 75, right: 100, x: 0, y: 0, toJSON: () => {},
      });

      const startX = 300;
      handle.dispatchEvent(new MouseEvent('mousedown', {
        clientX: startX,
        bubbles: true,
        cancelable: true,
      }));

      // Drag far to the left (-200px, which would make it -100px if unclamped)
      document.dispatchEvent(new MouseEvent('mousemove', {
        clientX: startX - 200,
        bubbles: true,
      }));

      expect(img.style.width).toBe('50px');

      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });

    it('should remove document listeners after mouseup', () => {
      ({ editor, element } = createEditor());
      insertImage(editor);

      const handle = getHandle(element);
      const addSpy = jest.spyOn(document, 'addEventListener');
      const removeSpy = jest.spyOn(document, 'removeEventListener');

      handle.dispatchEvent(new MouseEvent('mousedown', {
        clientX: 200,
        bubbles: true,
        cancelable: true,
      }));

      // Two listeners added: mousemove + mouseup
      const moveCallsBefore = addSpy.mock.calls.filter(c => c[0] === 'mousemove').length;
      const upCallsBefore = addSpy.mock.calls.filter(c => c[0] === 'mouseup').length;
      expect(moveCallsBefore).toBe(1);
      expect(upCallsBefore).toBe(1);

      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

      // Both listeners removed
      const moveRemoved = removeSpy.mock.calls.filter(c => c[0] === 'mousemove').length;
      const upRemoved = removeSpy.mock.calls.filter(c => c[0] === 'mouseup').length;
      expect(moveRemoved).toBe(1);
      expect(upRemoved).toBe(1);

      addSpy.mockRestore();
      removeSpy.mockRestore();
    });
  });

  describe('persisting width to node attributes', () => {
    it('should update node attrs with final width on mouseup', () => {
      ({ editor, element } = createEditor());
      editor.commands.insertContent({
        type: 'wikiImage',
        attrs: { src: 'https://example.com/test.png', width: '200' },
      });

      const handle = getHandle(element);
      const img = getImg(element);

      // Mock getBoundingClientRect for both the drag start and end
      jest.spyOn(img, 'getBoundingClientRect').mockReturnValue({
        width: 200, height: 150, top: 0, left: 0, bottom: 150, right: 200, x: 0, y: 0, toJSON: () => {},
      });

      const startX = 300;
      handle.dispatchEvent(new MouseEvent('mousedown', {
        clientX: startX,
        bubbles: true,
        cancelable: true,
      }));

      // Drag right
      document.dispatchEvent(new MouseEvent('mousemove', {
        clientX: startX + 150,
        bubbles: true,
      }));

      // After mousemove, img width is set via style
      // Now getBoundingClientRect should reflect the new width
      jest.spyOn(img, 'getBoundingClientRect').mockReturnValue({
        width: 350, height: 263, top: 0, left: 0, bottom: 263, right: 350, x: 0, y: 0, toJSON: () => {},
      });

      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

      // Check the ProseMirror node attrs were updated
      const attrs = getNodeAttrs(editor);
      expect(attrs).toBeTruthy();
      expect(attrs!['width']).toBe('350');
    });

    it('should preserve other node attributes after resize', () => {
      ({ editor, element } = createEditor());
      editor.commands.insertContent({
        type: 'wikiImage',
        attrs: { src: 'https://example.com/cat.png', alt: 'A cat', title: 'Cat photo', width: '400' },
      });

      const handle = getHandle(element);
      const img = getImg(element);

      jest.spyOn(img, 'getBoundingClientRect').mockReturnValue({
        width: 400, height: 300, top: 0, left: 0, bottom: 300, right: 400, x: 0, y: 0, toJSON: () => {},
      });

      handle.dispatchEvent(new MouseEvent('mousedown', { clientX: 500, bubbles: true, cancelable: true }));

      jest.spyOn(img, 'getBoundingClientRect').mockReturnValue({
        width: 250, height: 188, top: 0, left: 0, bottom: 188, right: 250, x: 0, y: 0, toJSON: () => {},
      });

      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

      const attrs = getNodeAttrs(editor);
      expect(attrs!['src']).toBe('https://example.com/cat.png');
      expect(attrs!['alt']).toBe('A cat');
      expect(attrs!['title']).toBe('Cat photo');
      expect(attrs!['width']).toBe('250');
    });
  });

  describe('renderHTML / parseHTML roundtrip', () => {
    it('should persist width through HTML serialization', () => {
      ({ editor, element } = createEditor());
      editor.commands.insertContent({
        type: 'wikiImage',
        attrs: { src: 'https://example.com/test.png', width: '350' },
      });

      // Get HTML output
      const html = editor.getHTML();
      expect(html).toContain('width="350"');
      expect(html).toContain('data-wiki-image');

      // Recreate editor with that HTML content to test parseHTML
      editor.destroy();
      element.remove();

      const element2 = document.createElement('div');
      document.body.appendChild(element2);

      const editor2 = new Editor({
        element: element2,
        extensions: [Document, Paragraph, Text, WikiImage],
        content: html,
      });

      // Check that the parsed node has the width attribute
      // (parseHTML may return width as number or string depending on TipTap internals)
      const attrs = getNodeAttrs(editor2);
      expect(attrs).toBeTruthy();
      expect(String(attrs!['width'])).toBe('350');
      expect(attrs!['src']).toBe('https://example.com/test.png');

      // Check that the node view applied the width to img style
      const img2 = element2.querySelector('img[data-wiki-image]') as HTMLImageElement;
      expect(img2.style.width).toBe('350px');

      editor2.destroy();
      element2.remove();
    });
  });

  describe('wiki-image:// URL handling', () => {
    it('should call resolveImageUrl for wiki-image:// sources', async () => {
      const resolveImageUrl = jest.fn().mockResolvedValue('blob:resolved-url');
      ({ editor, element } = createEditor({ resolveImageUrl }));

      editor.commands.insertContent({
        type: 'wikiImage',
        attrs: { src: 'wiki-image://widget1/img1' },
      });

      expect(resolveImageUrl).toHaveBeenCalledWith('wiki-image://widget1/img1');

      // Wait for async resolve
      await new Promise(r => setTimeout(r, 10));

      const img = getImg(element);
      expect(img.src).toContain('blob:resolved-url');
    });

    it('should show loading state while resolving wiki-image URL', () => {
      const resolveImageUrl = jest.fn().mockReturnValue(new Promise(() => {})); // never resolves
      ({ editor, element } = createEditor({ resolveImageUrl }));

      editor.commands.insertContent({
        type: 'wikiImage',
        attrs: { src: 'wiki-image://widget1/img1' },
      });

      const img = getImg(element);
      expect(img.style.minHeight).toBe('100px');
      expect(img.style.backgroundColor).toBe('rgb(240, 240, 240)');
    });
  });
});
