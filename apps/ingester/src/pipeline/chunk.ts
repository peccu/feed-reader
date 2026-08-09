/**
 * Text chunking + vector pooling for embedding long articles.
 *
 * Jina's model caps input at ~8194 tokens. Rather than truncating (dropping
 * everything past the cap), we split long text into chunks, embed each, and
 * mean-pool the resulting vectors so the whole article contributes to its
 * representation.
 */

/**
 * Split text into chunks of at most `maxChars`, preferring paragraph
 * boundaries. A single oversized paragraph is hard-split. Returns at least one
 * chunk (the text itself when short).
 */
export function chunkText(text: string, maxChars = 6000): string[] {
  if (maxChars <= 0) throw new Error("maxChars must be positive");
  if (text.length <= maxChars) return [text];

  const chunks: string[] = [];
  let current = "";

  const flush = () => {
    if (current.length > 0) {
      chunks.push(current);
      current = "";
    }
  };

  for (const para of text.split(/\n{2,}/)) {
    // A paragraph that alone exceeds the budget is hard-split into slices.
    if (para.length > maxChars) {
      flush();
      for (let i = 0; i < para.length; i += maxChars) {
        chunks.push(para.slice(i, i + maxChars));
      }
      continue;
    }
    // +2 accounts for the "\n\n" join between paragraphs.
    if (current.length + para.length + 2 > maxChars) flush();
    current = current.length > 0 ? `${current}\n\n${para}` : para;
  }
  flush();

  return chunks.length > 0 ? chunks : [text];
}

/**
 * Element-wise mean of equal-length vectors. Throws on an empty list or a
 * length mismatch.
 */
export function meanPool(vectors: Float32Array[]): Float32Array {
  if (vectors.length === 0) throw new Error("meanPool requires at least one vector");
  const dim = vectors[0]?.length ?? 0;
  const out = new Float32Array(dim);
  for (const v of vectors) {
    if (v.length !== dim) throw new Error(`vector length mismatch: ${v.length} !== ${dim}`);
    for (let i = 0; i < dim; i++) out[i] = (out[i] ?? 0) + (v[i] ?? 0);
  }
  for (let i = 0; i < dim; i++) out[i] = (out[i] ?? 0) / vectors.length;
  return out;
}
