import DOMPurify from "dompurify";

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
