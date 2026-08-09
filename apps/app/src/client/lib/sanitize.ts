import DOMPurify from "dompurify";
import { marked } from "marked";

// Allowed tags/attributes ported from the legacy feed-reader (components/utils.ts).
// Keeps article HTML readable while stripping scripts, styles, iframes, event handlers.
const OPTIONS = {
  ALLOWED_TAGS: [
    "b",
    "i",
    "em",
    "strong",
    "a",
    "img",
    "figure",
    "figcaption",
    "br",
    "div",
    "span",
    "p",
    "ul",
    "li",
    "ol",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "pre",
    "code",
    "blockquote",
    "hr",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
  ],
  ALLOWED_ATTR: ["href", "src", "target", "rel", "title", "alt", "width", "height"],
};

/** Sanitize source HTML for rendering via v-html. */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ...OPTIONS });
}

/** Render Markdown (e.g. notes) to sanitized HTML. */
export function renderMarkdown(md: string): string {
  const html = marked.parse(md, { async: false, breaks: true }) as string;
  return sanitizeHtml(html);
}
