import DOMPurify from "dompurify";

// https://stackoverflow.com/a/60797348
const defaultOptions = {
  ALLOWED_TAGS: [
    "b",
    "i",
    "em",
    "strong",
    "a",
    "img",
    "br",
    "div",
    "p",
    "ul",
    "li",
    "ol",
    "h1",
    "pre",
    "code",
    "blockquote",
    "hr",
    "h2",
    "h3",
    "h4",
    "h5",
  ],
  ALLOWED_ATTR: [
    "href",
    "src",
    "target",
    "rel",
    "title",
    "alt",
    "width",
    "height",
  ],
};

export const sanitize = (dirty: string) => ({
  __html: DOMPurify.sanitize(dirty, { ...defaultOptions }),
  // __html: dirty,
});
