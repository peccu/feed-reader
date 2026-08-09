# Domain Model Guide

This is a plain-language tour of the code under `packages/`. It explains **what
the building blocks are and why they exist**, so you can understand the system
without reading every file. The auto-generated **API reference below** (TypeDoc)
lists every type and signature; this page is the map that gives them meaning.
Use the top navigation for the **Docs home** and the **Screen catalog**.

## How the code is layered

The project follows a Domain-Driven Design (DDD) layering. Each concern lives in
its own workspace package so dependencies only point inward, toward the domain:

| Package | Role | Depends on |
| --- | --- | --- |
| `packages/domain` | The **pure model**: entities, value objects, and *interfaces* for repositories and services. No database, no HTTP, no framework. | nothing |
| `packages/db` | **Infrastructure**: concrete SQLite implementations of the domain's repository interfaces. | `domain` |
| `packages/types` | **API contracts (DTOs)**: the request/response shapes exchanged between the server and the browser client. | nothing |
| `apps/app`, `apps/ingester`, `apps/claude-worker` | **Application & delivery**: HTTP API, background jobs, and the Vue UI that wire everything together. | all of the above |

The golden rule: `domain` describes *what* the system is and *what operations
exist*; `db` and the apps decide *how* those operations actually run. You can
swap SQLite for another store by writing new classes that satisfy the same
domain interfaces, and nothing in `domain` changes.

## Building blocks

- **Entities** have identity and a lifecycle (an `Article`, a `QueueItem`).
  They are created through small factory functions (`createArticle`, …) that
  enforce invariants at construction time.
- **Value objects** are immutable and compared by value, not identity
  (`RelevanceScore`, `Embedding`, `SourceType`). They carry rules — e.g. a
  `RelevanceScore` refuses to exist outside `0..1`.
- **Branded IDs** (`ArticleId`, `FeedId`, …, in `shared.ts`) are `string`s
  tagged with a phantom type so the compiler rejects passing a `FeedId` where an
  `ArticleId` is expected. They cost nothing at runtime.
- **Repositories** are interfaces in `domain` (e.g. `ArticleRepository`) with
  SQLite implementations in `db` (e.g. `ArticleRepo`). They are the only door
  between the model and storage.
- **Domain services** hold logic that does not belong to a single entity
  (`ScoringService`, `PreferenceUpdateService`, `EmbeddingService`,
  `KnowledgeGraphService`).

## Bounded contexts

The domain is split into three areas, matching the three folders under
`packages/domain/src/`.

### 1. Content — `domain/content`

The raw material: where articles come from and how they are represented as
vectors.

- **`Feed`** — a subscribed source (RSS/URL). **`Article`** — a single fetched
  item with title, body, metadata, and its source type (**`SourceType`**:
  `rss`, `url`, `html_post`, …).
- **`Embedding`** — a value object wrapping the numeric vector (1024-dim, from
  Jina) that represents an article's meaning.
- **`EmbeddingService`** — turns text or an `Article` into an `Embedding`.
- Repositories: `FeedRepository`, `ArticleRepository`, `EmbeddingRepository`.

### 2. Reader — `domain/reader`

The heart of the product: personal scoring and the learning of taste. This is
where the two orthogonal axes live — **reading progress** and **preference
feedback** (see also [tasks.md](./tasks.md)).

- **`QueueItem`** — an article placed in your reading queue, carrying a
  **`QueueStatus`** (`unread → reading → read / skipped / archived`; transitions
  are validated) and a `favorited` flag.
- **`RelevanceScore`** — a `0..1` value with a `high/medium/low` label
  (thresholds 0.7 / 0.4).
- **`PreferenceProfile`** — the stored "taste vector" a user is compared
  against.
- **`Feedback`** / **`FeedbackType`** (`like` / `dislike`) with a
  `VectorTarget` — the training signal, kept separate from reading status.
- **`ScoringService`** — `score(embedding, profile) → RelevanceScore`, the
  cosine similarity between an article and the preference vector, computed at
  ingest time.
- **`PreferenceUpdateService`** — applies pending feedback to the preference
  vector (an exponential moving average: `profile*(1-lr) ± vec*lr`).
- Repositories: `QueueRepository`, `FeedbackRepository`, `PreferenceRepository`.

### 3. Knowledge — `domain/knowledge`

Notes, categories, and the relationships between things.

- **`Note`** / **`NoteType`** — free-form or generated notes attached to an
  article. **`Category`** — manual or auto-clustered grouping.
  **`ArticleCategory`** — the many-to-many link between articles and categories.
- **`KnowledgeGraphService`** — the interface for a graph view
  (article ⇄ note ⇄ category, related-article lookup). A Kuzu-backed
  implementation is planned; today the SQLite repos cover the relational needs.
- Repositories: `NoteRepository`, `CategoryRepository`,
  `ArticleCategoryRepository`.

## Following a request end to end

A concrete path, to tie the layers together:

1. The **ingester** fetches an article, calls an `EmbeddingService` to produce
   an `Embedding`, and asks a `ScoringService` to score it against the
   `PreferenceProfile`.
2. It saves the `Article`, `Embedding`, and a new `QueueItem` (status `unread`,
   with its `RelevanceScore`) through the repositories in `packages/db`.
3. The **app** server exposes them via the API using the DTOs in
   `packages/types` (`QueueListItemResponse`, `ArticleDetailResponse`, …).
4. The **Vue client** renders the unread carousel. When you like/dislike an
   article, it records `Feedback`; `PreferenceUpdateService` later folds that
   into the `PreferenceProfile`, so future scores reflect your taste.

## Where to go next

- **The API reference** below on this page — every exported type, class, and
  interface with its signature (generated by TypeDoc from the source).
- **Screen catalog** (top navigation) — a screenshot of every screen and state,
  with a description of each.
- The design documents on GitHub:
  [Architecture](https://github.com/peccu/feed-reader/blob/v2/docs/architecture.md) ·
  [Requirements](https://github.com/peccu/feed-reader/blob/v2/docs/requirements.md) ·
  [Screen flow](https://github.com/peccu/feed-reader/blob/v2/docs/screen-flow.md).
