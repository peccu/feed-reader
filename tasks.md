# やりたいこと、変えたいところ

## 評価と読了の分離（今回合意）

- [x] 評価とステータスを分離する。Like / Dislike は**嗜好ベクトル更新のフィードバック送信のみ**で、既読化もキュー除去もしない（未読のまま残す）
- [x] 「既読（Done）」アクションを追加する。読み切ったときに押すと `read` にして未読キューから除去（legacy の Read/Unread トグル相当）
- [x] ActionBar を再構成する: Like / Dislike / 既読 / Skip / Note（将来: シェア=読了記録＋公開 / この路線でもっと / Claude対話）
- [x] 再読ライブラリ画面を追加する。既読（read）記事などをステータス別に一覧し、タップでリーダーを開いて再読できる
- [x] お気に入り（★ ブックマーク）を追加する。Like とは独立した「保存して見返す」フラグ。お気に入りのみの一覧参照も可能にする（学習には影響しない）
- [x] トレーニングモード `/train`（TrainingView）を追加する。スコアが際どい記事を評価してベクトル精度を上げる専用画面。評価のみで既読にしない

## 以前からのメモ

- [x] 画面上の操作をした時、コンテナ側でログが出るようにして欲しいです。bun run devの時に。操作した後正しくそれぞれの処理が進んでいるのか把握したいです
- [x] スマホでダブルタップしてもズームしないようにする
- [x] 横幅が記事よりも大きく、横スワイプで余白が表示される。どうやら画面最下部のURL部分が画面幅をはみ出している。折り返す必要がある。
- [x] skipボタンの意味がわからない（各アクションボタンに説明ツールチップを追加）
- [x] 画面の上端と下端に操作可能なボタンがあり、スマホだと操作しにくい。上部のナビリンク群を下から開くメニュー（ボトムシート）に集約し、上端は位置表示のみに
- [x] submitしたURLがどうなったのか確認できる場所が欲しい。何件登録されたとか、それがどういうランキングづけされたのか、もしくは低スコアだけどここにいる、など（Admin/Status画面 + Library のスコア表示で対応）
- [x] ingest側をパイプラインにするまでは、truncate : trueのオプションをつけてください。パイプラインとは、前処理でclaude -pでようやくするとか、キーワードだけ抽出するとかの処理を並べられるようにするところです。(エラーメッセージへの対処です error: Jina API error 400: {"detail":{"message":"Input text exceeds the model's maximum of 8194 tokens. Use 'truncate: true' to automatically truncate, or split into smaller chunks.","request_id":"4a4e16aef8876f22c1a04dda9e5e638e","code":"INPUT_TOKEN_LIMIT_EXCEEDED"}})
- [x] admin画面のようなものを用意して欲しいです。DBの登録数やバッチジョブの状態、コンテナの状態、デバッグ用クエリを投入できるフォームなど。
  - [x] Admin/Status画面（DB登録数・キュー状態・ingestジョブ状態・最近のジョブ一覧）
  - [x] コンテナの状態表示（app/ingester/claude-worker のヘルス。ingesterはheartbeat、workerは/health probe）
  - [x] デバッグ用クエリ投入フォーム（読み取り専用SELECTのみ許可・200行上限・変更系キーワード拒否）
- [x] ヘッダーのハンバーガーメニューも画面下部に移動してください。（下部に浮かせたフローティングボタンに変更。空キュー時も操作可能）
- [x] ライブラリ画面のフィルタ？も画面下部に移動してください。最近のiOS26で導入された丸いタブバーみたいなのがいいと思います（下部フローティングのカプセル型タブバーに変更）
- [x] 既読を未読に戻す方法を用意してください（Library の各行に「↩ Unread」ボタン。read→unread 遷移を許可）
- [x] ライブラリからどれかの記事を開くと表示されるキューのボタンの意味を教えて。（ReaderView。各ボタンに説明ツールチップを追加。意味は下記回答参照）
- [x] 左右切り替えはUIも左右入れ替えます。（カルーセルの端矢印・タップ方向・スワイプ、下部メニューボタンの左右を direction に合わせて反転）
- [x] ライブラリ画面から戻るボタンが画面上端にあるので、メニューのように右下または左下にボタンをおいてもらえますか（左下にフローティング戻るボタン、上端の←は撤去）
- [x] likeは後でじっくり読む可能性はありますが dislikeは好みでない、もう読まないとの判断なので既読処理も一緒に実施してもらえますか（dislike＝評価＋既読化。likeは評価のみで未読維持）
- [x] ライブラリなどの一覧表示にもスコアを表示してもらえますか、私のフィードバック(like, dislikeもマーク等で表現できていると嬉しいです)（一覧にスコア%＋like/dislikeアイコン＋★を表示）
- [ ] VRTベースのスクリーンショットを取ろうとmacのdockerで実行すると以下のようなエラーがたくさん出ていました。
```
 26) [Desktop Chrome] › e2e/settings.spec.ts:17:7 › Settings View › shows feed URL input and add button

    Error: expect(locator).toBeVisible() failed

    Locator: locator('input[placeholder*=\'URL\']')
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 5000ms
      - waiting for locator('input[placeholder*=\'URL\']')


      17 |   test("shows feed URL input and add button", async ({ page }) => {
      18 |     const input = page.locator("input[placeholder*='URL']");
    > 19 |     await expect(input).toBeVisible();
         |                         ^
      20 |   });
      21 |
      22 |   test("can navigate back to queue", async ({ page }) => {
        at /work/e2e/settings.spec.ts:19:25

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results/settings-Settings-View-shows-feed-URL-input-and-add-button-Desktop-Chrome/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/settings-Settings-View-shows-feed-URL-input-and-add-button-Desktop-Chrome/error-context.md
```
- [ ] カテゴリ追加のUIにテキスト入力欄が二つありますがそれぞれ何を入れるのかわかりませんでした
- [ ] デバッグ用のクエリ入力欄にはグラフDBのクエリする場所も用意してください。SQLとそれの実行結果はなにがでてきますか？デフォルトで全検索かつ上限10件ほど、というようなサンプルを入れておいて欲しいです。もしくはいくつかサンプルを用意して、プルダウンで挿入して再利用したいです。
- [ ] スコアが全部0%で更新されていないようなのですが、bun run devでは採点されないのでしょうか。like何件、dislike何件、のような私のフィードバックの登録状況もアドミンパネルで確認したいです。未読数、既読数、スキップ数なども。
- [ ] ヘッダーの左右矢印は、右手モードか左手モードかを示したいので、右手モードの時は数字の右側に右手アイコンを、左手モードの時は左側に左手アイコンを表示して欲しいです
- [ ] ノートなど、画面上部に戻るUIがある画面は全て、画面下部のボタンにしてください
- [ ] ノートの再編集や削除の操作を追加してください
- [ ] requirements.mdの図もAAじゃなくて描画できる図にしてください
- [ ] JINAとCLAUDEの環境変数は.envファイルが必要なので、.env.sampleのようなファイルを作ってコミットしておいてください
- [ ] アーキテクチャとrequirements, tasksはdocsに移動しましょう
- [ ] DDDとはいえ非エンジニア向けのドキュメントを用意したいです。何かしら書類にする仕組みを入れてもらえますか。docsフォルダに出力するか、actionsで生成して、github上で何か確認できるフォーマット、場所に出力するとか。playwrightの画面設計図も同様にgithub上で参照できると嬉しいです。今はactionsを探して特定してダウンロードしてunzipしてindex.htmlを開く必要があるのが手間です
- [ ] PWAでiPhoneのホーム画面に追加できるようにしてください。アイコンの設定と、ステータスバーの色が白色になっていて、メインの黒っぽい背景とずれています(もしかしてこれOSのダークモードに合わせて黒くしていて、ライトモードだとアプリも白いんでしょうか？)
- [ ] 設定画面に、feed別に取り込み済みの記事の数を表示して欲しいです
- [ ] 設定画面のフィードはフィードメタ情報を載せきれていないです。フィードURLが2行表示されているので、発行元とフィードの名前など、その辺りフィード取得次に取得可能な情報を表示できるようにして欲しいです
- [ ] 設定画面で、URLをサブミットした履歴を表示して欲しいです。もしくは、件数を表示して、過去にsubmitしたURLの一覧に遷移できるUIを追加して欲しいです。それには、フィードバックがあればそのフィードバックも表示したいです。例えばサイト(ドメイン名)単位でのlike/dislike率などの統計情報が得られても嬉しいです

---

## 未実装機能の計画（WBS）

要件（requirements.md §3/§9）・設計（architecture.md）と現状実装の差分から洗い出した、機能単位の未実装項目。
凡例: ☐ 未着手 / ◑ 部分実装（backendのみ等） / ✖ 現状スコープ外

### Epic A. コンテンツ取り込みの拡張
- [ ] ◑ A1a. Settings に「HTML貼り付け投入」フォーム（`POST /articles/ingest/html` は実装済み・UI無し）
- [ ] ☐ A1b. メール → HTML POST ブリッジ（受信メール本文HTMLを `/ingest/html` へ）※方式決定/受口/送信元ホワイトリスト
- [ ] ☐ A2. Gmail ポーリング（送信元ホワイトリスト）※フェーズ2
- [ ] ☐ A3. IMAP 対応 ※フェーズ2
- [ ] ☐ A4. SNS（Bluesky / AT Protocol）取込 ※フェーズ2

### Epic B. 取り込みパイプライン化（前処理の連結）
- [ ] ☐ B1. パイプライン基盤（前処理ステップを配列で連結できる構造）
- [ ] ◑ B2. Claude 前処理（要約・キーワード/カテゴリ抽出）を有効化し**結果を永続化**（現状 `claudeEnricher` は無効＋結果破棄）
- [ ] ☐ B3. 長文チャンク分割（Jina 8194トークン超の恒久対応。現状 `truncate:true` で暫定）
- [ ] ☐ B4. 埋め込み対象テキストの設計（タイトル/冒頭/全文のトークン最適化）

### Epic C. 嗜好ベクトル・スコアリング
- [ ] ☐ C1. スコア0%問題の調査/修正（採点タイミング・初期プロファイル・dev反映）※上のメモと同一
- [ ] ☐ C2. フィードバック可視化（Admin に like/dislike 件数、未読/既読/スキップ数）※上のメモと同一
- [ ] ☐ C3. 複数嗜好ベクトル（preference/shareable/knowledge）の目的別活用（スキーマ・EMAは対応済み、用途未接続）
- [ ] ✖ C4. 嗜好プロファイル初期生成（ブックマークHTMLインポート）※現状スコープ外

### Epic D. ナレッジ / グラフDB（Kuzu）
- [ ] ☐ D1. Kuzu 導入（`packages/db/src/kuzu` は現状 `export {}` のみ）
- [ ] ☐ D2. 関係の書き込み（記事⇄ノート⇄カテゴリ）
- [ ] ☐ D3. `/articles/:id/related`（グラフトラバーサル）実装＋UI（現状は空返し）
- [ ] ☐ D4. ノートのベクトル化（類似ノート探索）
- [ ] ☐ D5. カテゴリ自動クラスタリング（`centroid_vector` 算出・自動ラベル。現状は手動CRUDのみ）

### Epic E. Claude 連携 UI
- [ ] ◑ E1. 記事からClaude対話UI（`POST /claude/chat` は実装済み・UI無し）
- [ ] ◑ E2. 記事要約の表示（`POST /claude/summarize` 実装済み・UI無し）
- [ ] ◑ E3. 対話→ノート保存（`POST /claude/note` 実装済み・UI無し）
- [ ] ☐ E4. claude-worker セッション継続バグ修正（`--resume` はID／`/sessions/:id` が常に404）

### Epic F. 発見・共有
- [ ] ◑ F1. 「この路線でもっと」= 類似記事UI（`GET /articles/:id/similar` は実装済み・導線無し）
- [ ] ☐ F2. SNSシェア（`navigator.share` ＋ 読了記録＋外部公開）
- [ ] ☐ F3. Discover のカテゴリ探索

### Epic G. 品質 / 運用 / ドキュメント
- [ ] ☐ G1. E2E/VRT を新UIに更新＋ベースライン再生成（上の VRT メモと同一）
- [ ] ☐ G2. デバッグクエリ強化（グラフDBクエリ欄＋SQLサンプル/プルダウン）※上のメモと同一
- [ ] ☐ G3. 非エンジニア向けドキュメント生成（docs出力 or Actionsで参照可能に）＋画面設計図をGitHub上で参照

