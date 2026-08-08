import type { Database } from "bun:sqlite";
import type {
  ArticleId,
  Embedding,
  EmbeddingModel,
  EmbeddingRepository,
  SimilarArticle,
} from "@feed-reader/domain";
import { createEmbedding, ArticleId as mkArticleId } from "@feed-reader/domain";

function toBytes(v: Float32Array): Uint8Array {
  return new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
}

function fromBytes(buf: Uint8Array): Float32Array {
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}

type MetaRow = { id: number; article_id: string; model: string };
type EmbRow = { embedding: Uint8Array };
type SimRow = { article_id: string; distance: number };

export class EmbeddingRepo implements EmbeddingRepository {
  constructor(private readonly db: Database) {}

  async findByArticleId(articleId: ArticleId): Promise<Embedding | null> {
    const meta =
      this.db
        .query<MetaRow, [string]>(
          "SELECT id, article_id, model FROM article_embedding_meta WHERE article_id = ?",
        )
        .get(articleId) ?? null;
    if (!meta) return null;

    const row =
      this.db
        .query<EmbRow, [number]>("SELECT embedding FROM article_embeddings WHERE rowid = ?")
        .get(meta.id) ?? null;
    if (!row) return null;

    return createEmbedding(fromBytes(row.embedding), meta.model as EmbeddingModel);
  }

  async save(articleId: ArticleId, embedding: Embedding): Promise<void> {
    this.db.transaction(() => {
      const existing =
        this.db
          .query<{ id: number }, [string]>(
            "SELECT id FROM article_embedding_meta WHERE article_id = ?",
          )
          .get(articleId) ?? null;

      if (existing) {
        this.db.run("DELETE FROM article_embeddings WHERE rowid = ?", [existing.id]);
        this.db.run("UPDATE article_embedding_meta SET model = ?, created_at = ? WHERE id = ?", [
          embedding.model,
          embedding.createdAt.getTime(),
          existing.id,
        ]);
        this.db.run("INSERT INTO article_embeddings(rowid, embedding) VALUES (?, ?)", [
          existing.id,
          toBytes(embedding.vector),
        ]);
      } else {
        this.db.run(
          "INSERT INTO article_embedding_meta(article_id, model, created_at) VALUES (?, ?, ?)",
          [articleId, embedding.model, embedding.createdAt.getTime()],
        );
        const inserted = this.db
          .query<{ id: number }, [string]>(
            "SELECT id FROM article_embedding_meta WHERE article_id = ?",
          )
          .get(articleId);
        if (!inserted) throw new Error(`[EmbeddingRepo] meta not found after insert: ${articleId}`);
        this.db.run("INSERT INTO article_embeddings(rowid, embedding) VALUES (?, ?)", [
          inserted.id,
          toBytes(embedding.vector),
        ]);
      }
    })();
  }

  async findSimilar(embedding: Embedding, limit = 10): Promise<SimilarArticle[]> {
    const rows = this.db
      .query<SimRow, [Uint8Array, number]>(
        `WITH knn AS (
           SELECT rowid, distance
           FROM article_embeddings
           WHERE embedding MATCH ?
             AND k = ?
           ORDER BY distance
         )
         SELECT m.article_id, k.distance
         FROM knn k JOIN article_embedding_meta m ON m.id = k.rowid
         ORDER BY k.distance`,
      )
      .all(toBytes(embedding.vector), limit);

    return rows.map((r) => ({
      articleId: mkArticleId(r.article_id),
      // For unit-length vectors: cosine_similarity = 1 - L2_distance² / 2
      similarity: Math.max(0, 1 - (r.distance * r.distance) / 2),
    }));
  }
}
