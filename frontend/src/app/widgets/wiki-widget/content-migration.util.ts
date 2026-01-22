import { marked } from 'marked';

/**
 * Detects if content appears to be markdown format rather than HTML
 */
export function isMarkdownContent(content: string): boolean {
  if (!content || content.trim() === '') {
    return false;
  }

  const trimmed = content.trim();

  // If content starts with HTML tag, it's likely already HTML
  if (trimmed.startsWith('<') && !trimmed.startsWith('<<')) {
    return false;
  }

  // Check for common markdown patterns
  const markdownPatterns = [
    /^#{1,6}\s/m,              // Headings: # ## ### etc.
    /\*\*[^*]+\*\*/,           // Bold: **text**
    /(?<!\*)\*(?!\*)[^*]+(?<!\*)\*(?!\*)/, // Italic: *text*
    /__[^_]+__/,               // Bold: __text__
    /_[^_]+_/,                 // Italic: _text_
    /^\s*[-*+]\s/m,            // Unordered lists: - item, * item
    /^\s*\d+\.\s/m,            // Ordered lists: 1. item
    /```[\s\S]*?```/,          // Code blocks: ```code```
    /`[^`]+`/,                 // Inline code: `code`
    /^\s*>/m,                  // Blockquotes: > text
    /\[([^\]]+)\]\([^)]+\)/,   // Links: [text](url)
    /\[\[([^\]]+)\]\]/,        // Wiki links: [[text]]
  ];

  return markdownPatterns.some(pattern => pattern.test(content));
}

/**
 * Converts markdown content to HTML, preserving wiki links in TipTap format
 */
export async function migrateMarkdownToHtml(content: string): Promise<string> {
  if (!content) {
    return '';
  }

  // First convert wiki links to HTML anchors with data attributes
  // This preserves them through the markdown conversion
  let processedContent = content.replace(
    /\[\[([^\]]+)\]\]/g,
    '<a class="wiki-link" data-wiki-title="$1" href="#">$1</a>'
  );

  // Parse markdown to HTML
  const html = await marked.parse(processedContent);

  return html;
}
