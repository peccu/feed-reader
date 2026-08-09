/** Host name of a URL (e.g. "www.example.com" → "example.com"), for display. */
export function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
