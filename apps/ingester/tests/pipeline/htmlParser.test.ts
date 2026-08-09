import { describe, expect, it } from "bun:test";
import { buildEmbeddingInput, parseHtml } from "../../src/pipeline/htmlParser.ts";

describe("parseHtml", () => {
  it("returns plain text as-is (trimmed)", () => {
    const result = parseHtml("  hello world  ");
    expect(result.text).toBe("hello world");
    expect(result.links).toHaveLength(0);
  });

  it("strips HTML tags", () => {
    const result = parseHtml("<p>Hello <strong>world</strong></p>");
    expect(result.text).toBe("Hello world");
  });

  it("strips style elements entirely", () => {
    const result = parseHtml("<style>body { color: red; }</style><p>content</p>");
    expect(result.text).not.toContain("color");
    expect(result.text).toContain("content");
  });

  it("strips script elements entirely", () => {
    const result = parseHtml("<script>alert('xss')</script><p>safe</p>");
    expect(result.text).not.toContain("alert");
    expect(result.text).toContain("safe");
  });

  it("extracts links with href and text (http/https only)", () => {
    const html = `<a href="https://example.com">Example</a> <a href="ftp://bad.com">Bad</a>`;
    const result = parseHtml(html);
    expect(result.links).toHaveLength(1);
    expect(result.links[0]?.href).toBe("https://example.com");
    expect(result.links[0]?.text).toBe("Example");
  });

  it("computes wordCount correctly", () => {
    const result = parseHtml("<p>one two three</p>");
    expect(result.wordCount).toBe(3);
  });

  it("decodes HTML entities", () => {
    const result = parseHtml("&amp; &lt; &gt; &quot; &nbsp; &#39;");
    expect(result.text).toContain("&");
    expect(result.text).toContain("<");
    expect(result.text).toContain(">");
    expect(result.text).toContain('"');
    expect(result.text).toContain("'");
  });

  it("ignores anchor tags without href or with empty text", () => {
    const html = `<a href="https://ok.com">Valid</a><a href="https://no-text.com">  </a>`;
    const result = parseHtml(html);
    expect(result.links).toHaveLength(1);
  });
});

describe("buildEmbeddingInput", () => {
  it("returns main text when no links", () => {
    const content = { text: "hello world", links: [], wordCount: 2 };
    expect(buildEmbeddingInput(content)).toBe("hello world");
  });

  it("appends Links section when links present", () => {
    const content = {
      text: "article text",
      links: [{ href: "https://a.com", text: "A" }],
      wordCount: 2,
    };
    const result = buildEmbeddingInput(content);
    expect(result).toContain("article text");
    expect(result).toContain("Links: [A]");
  });

  it("truncates text to maxWords", () => {
    const words = Array.from({ length: 100 }, (_, i) => `w${i}`);
    const content = { text: words.join(" "), links: [], wordCount: 100 };
    const result = buildEmbeddingInput(content, 10);
    const resultWords = result.split(/\s+/);
    expect(resultWords).toHaveLength(10);
  });

  it("caps links at 20", () => {
    const links = Array.from({ length: 25 }, (_, i) => ({
      href: `https://example.com/${i}`,
      text: `Link${i}`,
    }));
    const content = { text: "text", links, wordCount: 1 };
    const result = buildEmbeddingInput(content);
    // Count occurrences of "[Link" to verify cap
    const matches = result.match(/\[Link\d+\]/g) ?? [];
    expect(matches.length).toBe(20);
  });

  it("uses default maxWords=4000 (large text stays intact under limit)", () => {
    const words = Array.from({ length: 50 }, (_, i) => `word${i}`);
    const content = { text: words.join(" "), links: [], wordCount: 50 };
    const result = buildEmbeddingInput(content);
    expect(result.split(/\s+/)).toHaveLength(50);
  });
});
