declare module "@postlight/parser" {
  interface ParsedContent {
    title?: string;
    content?: string;
    author?: string;
    date_published?: string;
    lead_image_url?: string;
    dek?: string;
    next_page_url?: string;
    url?: string;
    domain?: string;
    excerpt?: string;
    word_count?: number;
    direction?: string;
    total_pages?: number;
    rendered_pages?: number;
  }

  interface ParseOptions {
    contentType?: "html" | "markdown" | "text";
    headers?: Record<string, string>;
    html?: string;
  }

  function parse(url: string, options?: ParseOptions): Promise<ParsedContent>;
  export default { parse };
}
