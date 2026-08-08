# アーキテクチャ設計書

作成日：2026年8月  
ステータス：設計確定 → 詳細設計・実装フェーズへ

---

## 1. システム構成

### コンテナ構成（Docker Compose）

```mermaid
graph TD
  subgraph Docker Compose
    ingester["ingester (Bun)\n- RSSポーリング\n- URL/HTML取込\n- スクレイピング\n- Jina API呼出し\n- ベクトル保存\n- クラスタリング"]
    app["app (Hono / Bun)\n- REST API\n- Vue.js静的ファイル配信\n- スコアリング\n- フィードバック受取\n- 嗜好ベクトル更新\n- カテゴリ管理"]
    claude["claude-worker (Bun)\n- claude -p 呼出し\n- 記事要約・分析\n- ユーザー対話\n- ノート生成"]
    subgraph 共有ボリューム
      db[(feed-reader.db\nSQLite + sqlite-vec)]
      kuzu[(kuzu/\nKuzuグラフ)]
      sessions[(sessions/\nClaude会話履歴 JSONL)]
    end
  end

  jina["Jina AI API（外部）"]
  user["ユーザー（Tailscale経由）"]

  user -->|HTTP| app
  app -->|HTTP| claude
  ingester -->|HTTP| claude
  ingester -->|read/write| db
  ingester -->|read/write| kuzu
  app -->|read/write| db
  app -->|read/write| kuzu
  claude -->|read/write| sessions
  ingester -->|API呼出し| jina
```

### コンテナの役割分担

| | ingester | app | claude-worker |
|---|---|---|---|
| 起動形態 | 常時ループ（HTTPサーバーなし） | 常時待機（HTTPサーバー） | 常時待機（HTTPサーバー） |
| 外部通信 | Jina AI・RSS・スクレイピング | なし（DB + claude-worker） | Claude CLI |
| DB操作 | 読み書き（記事・キュー・ベクトル） | 読み書き（キュー・フィードバック・ノート） | 読み書き（ノート） |
| 障害時 | 次サイクルで回復 | 即座にUI停止 | 対話機能のみ停止 |

### コンテナ間通信

- **ingester ↔ app**: 直接HTTP通信なし。共有DBの `pending_jobs` テーブルを経由
  - app: URLをPOSTされたら `pending_jobs` にINSERT → 即200返却
  - ingester: 常時ループで `pending_jobs` を確認 → 新規あれば処理
- **app → claude-worker**: HTTP（Dockerネットワーク内部）
- **ingester → claude-worker**: HTTP（Dockerネットワーク内部）

---

## 2. モノレポ構成

```
feed-reader/                    # GitHub: peccu/feed-reader
├── apps/
│   ├── app/                    # Hono + Vue.js (Bun)
│   │   ├── src/
│   │   │   ├── server/         # Honoルーター・ミドルウェア
│   │   │   └── client/         # Vue.js フロントエンド
│   │   ├── tests/
│   │   └── package.json
│   ├── ingester/               # バックグラウンドジョブ (Bun)
│   │   ├── src/
│   │   │   └── jobs/
│   │   ├── tests/
│   │   └── package.json
│   └── claude-worker/          # claude -p ラッパー (Bun)
│       ├── src/
│       ├── tests/
│       └── package.json
├── packages/
│   ├── domain/                 # DDDドメインモデル（共有）
│   │   ├── src/
│   │   │   ├── content/
│   │   │   ├── reader/
│   │   │   └── knowledge/
│   │   ├── tests/
│   │   └── package.json
│   ├── db/                     # SQLite + Kuzu アクセス層（共有）
│   │   ├── src/
│   │   │   ├── sqlite/
│   │   │   └── kuzu/
│   │   ├── tests/
│   │   └── package.json
│   └── types/                  # 共有TypeScript型定義（APIのI/O型）
│       ├── src/
│       └── package.json
├── docker-compose.yml
├── .github/
│   └── workflows/
│       └── ci.yml              # PR時: lint・unit test・VRT
├── package.json                # Bun workspacesルート
└── biome.json                  # Linter / Formatter
```

---

## 3. 技術スタック

| レイヤー | 選択 | 補足 |
|---|---|---|
| ランタイム | Bun | 全コンテナ共通 |
| バックエンドAPI | Hono | appコンテナのみ |
| フロントエンド | Vue.js 3 + Vite | Composition API + `<script setup>` |
| スタイリング | TailwindCSS v4 | shadcn/vue風カラーテーマ |
| 状態管理 | Pinia | 8 stores |
| エンベディング | Jina AI（jina-embeddings-v3） | 全文・レート超過後に上限設定 |
| ベクトルDB | sqlite-vec | SQLite拡張 |
| グラフDB | Kuzu | 埋め込み型、共有ボリューム |
| 本文スクレイピング | @postlight/parser | genfeedで実績あり |
| Claude連携 | claude -p（CLIトークン） | APIキーではなくCLI認証 |
| Linter/Formatter | Biome | ESLint + Prettierの代替 |
| テスト（Unit） | Bun test | ビルトイン |
| テスト（E2E/VRT） | Playwright | スクリーンショット比較 |
| CI | GitHub Actions | PR時にテスト・VRT実行 |

---

## 4. DDDドメインモデル

### ドメイン依存関係

```mermaid
graph BT
  content["Content\n（基盤ドメイン）\nArticle / Feed / Embedding"]
  reader["Reader\n（コアドメイン）\nQueueItem / PreferenceProfile / Feedback"]
  knowledge["Knowledge\n（サポートドメイン）\nNote / Category"]

  reader -->|依存| content
  knowledge -->|依存| content
  knowledge -->|依存| reader
```

### Contentドメイン

**Entities:**
- `Article`（集約ルート）: ArticleId, Title, Url, FullText, Summary, SourceType, FeedId
- `Feed`（集約ルート）: FeedId, Url, Title, PollingIntervalSeconds, LastPolledAt, IsActive

**Value Objects:**
- `Embedding`: Float32Array（1024次元）+ `cosineSimilarity(other): number`
- `SourceType`: `'rss' | 'url' | 'html_post' | 'bookmark'`

**Repository Interfaces:** ArticleRepository, FeedRepository, EmbeddingRepository

**Domain Service Interfaces:** EmbeddingService（Jina AI抽象）

### Readerドメイン

**Entities:**
- `QueueItem`（集約ルート）: QueueItemId, ArticleId, QueueStatus, RelevanceScore, timestamps
- `PreferenceProfile`（集約ルート）: 3ベクトル（preference/shareable/knowledge）+ `applyFeedback()`
- `Feedback`（集約ルート）: FeedbackId, ArticleId, FeedbackType

**Value Objects:**
- `QueueStatus`: 6状態 + `canTransitionTo(next): boolean`で遷移ルールを内包
- `RelevanceScore`: 0.0〜1.0 + ラベル（high/medium/low）
- `FeedbackType`: `'like' | 'dislike'`

**QueueStatus 遷移ルール:**

```mermaid
stateDiagram-v2
  [*] --> unread : 記事取込

  unread --> reading : 記事を開く
  unread --> skipped : 開かずスキップ

  reading --> read : Like / Dislike / 読了
  reading --> skipped : スワイプでスキップ

  skipped --> unread : 取り消し

  read --> archived : アーカイブ
  skipped --> archived : アーカイブ

  archived --> [*]
```

**Repository Interfaces:** QueueRepository, PreferenceRepository, FeedbackRepository

**Domain Services:**
- `ScoringService`: `score(embedding, profile): RelevanceScore`
- `PreferenceUpdateService`: EMAアルゴリズム（デバウンス後に実行）
- `QueueScoringService`: 全unreadキューの一括再スコア

### Knowledgeドメイン

**Entities:**
- `Note`（集約ルート）: NoteId, Content(markdown), NoteType, ArticleId, ClaudeSessionId
- `Category`（集約ルート）: CategoryId, Name, IsAutoCluster, CentroidVector, Color

**Value Objects:**
- `NoteType`: `'manual' | 'claude_conversation' | 'quote'`
- `ArticleCategory`: (ArticleId, CategoryId, AssignedBy: `'manual' | 'auto'`)

**Repository Interfaces:** NoteRepository, CategoryRepository, ArticleCategoryRepository

**Domain Service Interface:** KnowledgeGraphService（Kuzu操作の抽象）

---

## 5. データベーススキーマ

### ERダイアグラム

```mermaid
erDiagram
  feeds {
    TEXT id PK
    TEXT url UK
    TEXT title
    INTEGER polling_interval_seconds
    INTEGER last_polled_at
    INTEGER is_active
  }
  articles {
    TEXT id PK
    TEXT feed_id FK
    TEXT url UK
    TEXT title
    TEXT author
    TEXT full_text
    TEXT summary
    TEXT source_type
    INTEGER published_at
    INTEGER word_count
  }
  pending_jobs {
    TEXT id PK
    TEXT job_type
    TEXT payload
    TEXT status
    INTEGER created_at
    TEXT error
  }
  queue_items {
    TEXT id PK
    TEXT article_id FK
    TEXT status
    REAL relevance_score
    INTEGER added_at
    INTEGER read_at
  }
  preference_profiles {
    TEXT id PK
    TEXT name UK
    REAL learning_rate
    REAL decay_rate
    INTEGER article_count
  }
  feedback {
    TEXT id PK
    TEXT article_id FK
    TEXT feedback_type
    TEXT vector_target
    INTEGER created_at
  }
  categories {
    TEXT id PK
    TEXT name UK
    TEXT description
    INTEGER is_auto_cluster
    TEXT color
  }
  article_categories {
    TEXT article_id FK
    TEXT category_id FK
    TEXT assigned_by
    INTEGER assigned_at
  }
  notes {
    TEXT id PK
    TEXT article_id FK
    TEXT content
    TEXT note_type
    TEXT claude_session_id
  }
  actions {
    TEXT id PK
    TEXT article_id FK
    TEXT action_type
    TEXT metadata
    INTEGER created_at
  }

  feeds ||--o{ articles : "has"
  articles ||--o| queue_items : "queued as"
  articles ||--o{ feedback : "receives"
  articles ||--o{ article_categories : "tagged with"
  articles ||--o{ notes : "has"
  articles ||--o{ actions : "logged in"
  categories ||--o{ article_categories : "applied to"
```

### sqlite-vec 仮想テーブル（vec0）

```sql
CREATE VIRTUAL TABLE article_embeddings USING vec0(
  article_id TEXT PRIMARY KEY, embedding FLOAT[1024]
);
CREATE VIRTUAL TABLE note_embeddings USING vec0(
  note_id TEXT PRIMARY KEY, embedding FLOAT[1024]
);
CREATE VIRTUAL TABLE preference_embeddings USING vec0(
  -- キー例: 'default:preference', 'default:shareable', 'default:knowledge'
  profile_key TEXT PRIMARY KEY, embedding FLOAT[1024]
);
```

### Kuzu グラフスキーマ

```mermaid
graph LR
  Article -->|ORIGINATED_FROM| Feed
  Note -->|GENERATED_FROM| Article
  Note -->|REFERENCES| Article
  Article -->|BELONGS_TO| Category
  Note -->|NOTE_CATEGORIZED| Category
  Article -->|"SIMILAR_TO (score)"| Article
```

SQLiteが権威的ストア。Kuzuは補助グラフインデックス。ノードIDはSQLiteのUUIDと一致させる。

---

## 6. APIエンドポイント（app / Hono）

ベースパス: `/api/v1`

### Content系
| Method | Path | 説明 |
|---|---|---|
| GET | `/feeds` | フィード一覧 |
| POST | `/feeds` | フィード追加 |
| PATCH | `/feeds/:id` | フィード更新 |
| DELETE | `/feeds/:id` | フィード削除 |
| GET | `/articles` | 記事一覧（クエリ: status, category, limit, offset） |
| GET | `/articles/:id` | 記事詳細（全文付き） |
| POST | `/articles/ingest/url` | URL投入（pending_jobsにINSERT） |
| POST | `/articles/ingest/html` | HTML投入（pending_jobsにINSERT） |

### Reader系
| Method | Path | 説明 |
|---|---|---|
| GET | `/queue` | キュー取得（クエリ: status, sort, limit） |
| GET | `/queue/stats` | 未読数・スコア分布 |
| PATCH | `/queue/:id/status` | ステータス更新 |
| GET | `/preference` | 嗜好プロファイル統計 |
| POST | `/feedback` | フィードバック送信 |

### Knowledge系
| Method | Path | 説明 |
|---|---|---|
| GET/POST | `/categories` | カテゴリ一覧・作成 |
| PATCH/DELETE | `/categories/:id` | カテゴリ更新・削除 |
| POST/DELETE | `/articles/:id/categories` | カテゴリ割り当て |
| GET/POST/PATCH/DELETE | `/notes` / `/notes/:id` | ノートCRUD |

### Claude系
| Method | Path | 説明 |
|---|---|---|
| POST | `/claude/summarize` | 記事サマリー生成 |
| POST | `/claude/chat` | チャット送信 |
| GET | `/claude/sessions/:id` | セッション取得 |
| POST | `/claude/note` | チャットからノート生成 |

### Discovery系
| Method | Path | 説明 |
|---|---|---|
| GET | `/articles/:id/similar` | 類似記事（vec0 KNN） |
| GET | `/articles/:id/related` | 関連記事（Kuzuトラバーサル） |
| GET | `/search?q=` | ベクトル+全文ハイブリッド検索 |

### claude-worker 内部API（ポート3001）
| Method | Path | 呼び出し元 |
|---|---|---|
| GET | `/health` | Dockerヘルスチェック |
| POST | `/summarize` | ingester, app |
| POST | `/chat` | app（ユーザー対話） |
| POST | `/analyze` | ingester（カテゴリ提案） |

---

## 7. フロントエンド構成（Vue.js）

### UIの重要原則

- **横スクロールカルーセルが最優先**
  - 画面左右端タップ → 前後記事へ移動
  - スワイプ（タッチ・マウス両対応）でも移動
  - `overflow-x-scroll snap-x snap-mandatory`（既存UIと同パターン）
  - 前後±1記事のみレンダリング（パフォーマンス最適化）
- 画面上部の「現在位置/総件数」タップ → 進行方向（左右）切り替え
- アクションボタン群は画面下部固定
- shadcn/vue風カラーテーマ（ダーク/ライト対応）
- モバイルファースト・レスポンシブ

### ルーティング

```mermaid
graph TD
  root["/\nQueueView\n未読キュー"]
  reader["/reader/:id\nReaderView\n全画面リーダー"]
  train["/train\nTrainingView\n際どい記事の評価"]
  discover["/discover\nDiscoverView\nカテゴリ・類似探索"]
  notes["/notes\nNotesView"]
  note_detail["/notes/:id\nNoteDetailView"]
  categories["/categories\nCategoryView"]
  settings["/settings\nSettingsView"]

  root --> reader
  notes --> note_detail
```

### Pinia Stores

| Store | 主な責務 |
|---|---|
| `queue` | キューアイテム・フィルタ・ページネーション |
| `articles` | 記事キャッシュ・現在記事 |
| `preferences` | 嗜好プロファイル統計 |
| `feedback` | フィードバック送信・履歴 |
| `categories` | カテゴリ一覧・割り当て |
| `notes` | ノートCRUD |
| `feeds` | フィード管理 |
| `claude` | チャットセッション・ストリーミング状態 |

---

## 8. ingesterジョブ設計

ingesterはHTTPサーバーを持たない常時ループプロセス。

### ループ構造

```mermaid
flowchart TD
  start([起動]) --> init[DB接続・マイグレーション確認]
  init --> loop{スケジューラループ}
  loop -->|毎30秒| pending[pending_jobs確認\n新規ジョブを処理]
  loop -->|毎60分| rss[RSSフィードポーリング]
  loop -->|毎24時間| cluster[クラスタリングジョブ]
  pending --> loop
  rss --> loop
  cluster --> loop
```

### ジョブ種別

| ジョブ | トリガー | 処理 |
|---|---|---|
| `PendingJobRunner` | 毎30秒 | pending_jobsのURL/HTMLを処理 |
| `RSSPollJob` | 毎60分 | フィードポーリング・記事取込 |
| `PreferenceUpdateJob` | フィードバックデバウンス後 | EMAでベクトル更新・全キュー再スコア |
| `ClusteringJob` | 毎24時間 | k-meansクラスタリング・カテゴリ自動生成 |

### 記事取込フロー（共通）

```mermaid
flowchart TD
  A([URL受取]) --> B{URLが\nDB済みか?}
  B -->|Yes| Z([スキップ])
  B -->|No| C["@postlight/parser\n本文スクレイプ"]
  C --> D{スクレイプ\n成功?}
  D -->|Yes| E[Jina AI\nエンベディング（全文）]
  D -->|No| F[Jina AI\nエンベディング（タイトルのみ）]
  E --> G[articles +\narticle_embeddings 保存]
  F --> G
  G --> H[嗜好ベクトルとの\nコサイン類似度でスコア計算]
  H --> I[queue_items に\nstatus=unread でINSERT]
  I --> J[Kuzu: Articleノード追加]
  J --> K([完了])
  J -.->|非同期・任意| L[claude-worker\nに要約依頼]
```

### 嗜好ベクトル更新（EMAアルゴリズム）

```typescript
// Like の場合
profile = normalize(profile * 0.95 + articleVec * 0.05)
// Dislike の場合
profile = normalize(profile * 0.95 - articleVec * 0.05)

// デバウンス: 最後のフィードバックからN分間操作なし → 実行
// N = 設定可能（デフォルト5分）
```

ベクトルは3種類独立して更新：
- `preference`: Like/Dislike
- `shareable`: SNSシェアアクション
- `knowledge`: カテゴリ付け・メモ・Claude対話

---

## 9. 開発フロー

### TDD方針
- `packages/domain` のドメインモデルから実装開始
- 各エンティティ・VOのテストを先に書いてから実装
- ドメインモデルのテストは外部依存なし（純粋なTypeScript）
- Repositoryの実装は `packages/db` でインメモリ実装をテスト用に用意

### テスト構成

```mermaid
graph TD
  unit["Bun test（ユニット・統合）"]
  domain["packages/domain/tests/\n← 最初に整備"]
  db["packages/db/tests/\nSQLite統合テスト\n（実DBを使用・モック禁止）"]
  app_test["apps/app/tests/\nHonoルーターテスト"]
  ingester_test["apps/ingester/tests/\nジョブユニットテスト"]
  e2e["Playwright（E2E・VRT）"]
  e2e_dir["e2e/\n各画面スクリーンショット\nインタラクション"]

  unit --> domain
  unit --> db
  unit --> app_test
  unit --> ingester_test
  e2e --> e2e_dir
```

### CI（GitHub Actions）

PR時に以下を並列実行：
1. Biome lint・format チェック
2. Type Check（bunx tsc）
3. Bun test（全パッケージ）
4. Docker Build（3コンテナ並列）
5. Playwright VRT

### Docker Composeボリューム

```yaml
volumes:
  db-data:       # sqlite-vec + Kuzu
  session-data:  # Claude会話履歴JSONL
```
