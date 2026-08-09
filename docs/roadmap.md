# 未実装機能ロードマップ（WBS）

要件（`requirements.md` §3/§9）・設計（`architecture.md`）と現状実装の差分から、**まだ実装していない/部分的な機能**を洗い出したもの。日々の細かな調整は `tasks.md` を、機能単位の計画はこちらを参照する。

凡例: ☐ 未着手 / ◑ 部分実装（backendのみ等） / ✖ 現状スコープ外

---

## Epic A. コンテンツ取り込みの拡張

- ◑ **A1. HTML汎用投入（メルマガ/任意HTML）**
  - ☐ A1a. Settings に「HTML貼り付け投入」フォーム（`POST /articles/ingest/html` は実装済み・UI無し）
  - ☐ A1b. **メール → HTML POST ブリッジ**（受信メール本文HTMLを `/ingest/html` に送る経路）
    - ☐ 方式決定: メール転送→Webhook受口 / 受信箱ポーリング のどちらか
    - ☐ 受口エンドポイント or 取り込みワーカー
    - ☐ 送信元ホワイトリスト
- ☐ **A2. Gmail ポーリング**（送信元ホワイトリストで自動取込）※フェーズ2
- ☐ **A3. IMAP 対応** ※フェーズ2
- ☐ **A4. SNS（Bluesky / AT Protocol）取込** ※フェーズ2

## Epic B. 取り込みパイプライン化（前処理の連結）

- ☐ **B1. パイプライン基盤**: 前処理ステップ（関数）を配列で連結できる構造（ユーザーの好むパイプ/合成スタイル）
- ◑ **B2. Claude 前処理の有効化**: `claude -p` で要約・キーワード/カテゴリ抽出 → **結果を永続化**
  （現状 `claudeEnricher` は `ENABLE_CLAUDE_ENRICHMENT` 未設定で無効＋結果を保存していない）
- ☐ **B3. 長文チャンク分割**（Jina 8194トークン超の恒久対応。現状は `truncate:true` で暫定回避）
- ☐ **B4. 埋め込み対象テキストの設計**（タイトル/冒頭/全文のトークン最適化）

## Epic C. 嗜好ベクトル・スコアリング

- ☐ **C1. スコア0%問題の調査/修正**（`tasks.md` #66）: 採点タイミング・初期プロファイル・dev反映の確認
- ☐ **C2. フィードバック可視化**: Admin に like/dislike 件数、未読/既読/スキップ数（`tasks.md` #66後半）
- ☐ **C3. 複数嗜好ベクトル**（`preference`/`shareable`/`knowledge`）を目的別に活用（スキーマ・EMAは対応済み、UI/用途が未接続）
- ✖ **C4. 嗜好プロファイル初期生成（ブックマークHTMLインポート）** ※ユーザー判断で現状スコープ外

## Epic D. ナレッジ / グラフDB（Kuzu）

- ☐ **D1. Kuzu 導入**（埋め込み型グラフDB、共有ボリューム）— 現状 `packages/db/src/kuzu` は `export {}` のみ
- ☐ **D2. 関係の書き込み**（記事⇄ノート⇄カテゴリ、「この記事から生成されたノート」等）
- ☐ **D3. `/articles/:id/related`（グラフトラバーサル）実装 ＋ UI**（現状は空配列返し）
- ☐ **D4. ノートのベクトル化**（保存ノートを埋め込み → 類似ノート探索）
- ☐ **D5. カテゴリ自動クラスタリング**（k-means等で `centroid_vector` を算出・自動ラベル。現状は手動CRUDのみ）

## Epic E. Claude 連携 UI

- ◑ **E1. 記事からClaude対話UI**（`POST /claude/chat` は実装済み・UI無し）
- ◑ **E2. 記事要約の表示**（`POST /claude/summarize` 実装済み・UI無し）
- ◑ **E3. 対話→ノート保存**（`POST /claude/note` 実装済み・UI無し）
- ☐ **E4. claude-worker セッション継続バグ修正**（`--resume` はセッションIDを取る／`/sessions/:id` が常に404。[[deferred-known-defects]]）

## Epic F. 発見・共有

- ◑ **F1. 「この路線でもっと」= 類似記事UI**（`GET /articles/:id/similar` は sqlite-vec KNN で実装済み・UI導線無し）
- ☐ **F2. SNSシェア**（`navigator.share` ＋ 読了記録＋外部公開＝アイデンティティ表明）
- ☐ **F3. Discover のカテゴリ探索**（検索は実装済み、カテゴリ起点の探索は未）

## Epic G. 品質 / 運用 / ドキュメント

- ☐ **G1. E2E/VRT を新UIに更新**（統合リファクタで旧セレクタが崩れている。`tasks.md` #33）＋ ベースライン再生成
- ☐ **G2. デバッグクエリ強化**: グラフDBクエリ欄＋SQLサンプル/プルダウン（`tasks.md` #65）
- ☐ **G3. 非エンジニア向けドキュメント生成**（docs出力 or GitHub Actionsで参照可能な形式）＋画面設計図(Playwright)をGitHub上で参照

---

### 補足
- 「backend実装済み・UI無し」系（A1a, E1–E3, F1）は比較的短工数で価値が出る。次に着手するなら E（Claude対話UI）と F1（もっと見る）が候補。
- グラフDB系（Epic D）は Kuzu 導入が前提で最も重い。
- フェーズ2以降（A2/A3/A4）は要件でも後回し指定。
