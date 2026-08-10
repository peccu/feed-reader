# やりたいこと、変えたいところ

## 評価と読了の分離（今回合意）

- [x] 評価とステータスを分離する。Like / Dislike は**嗜好ベクトル更新のフィードバック送信のみ**で、既読化もキュー除去もしない（未読のまま残す）
- [x] 「既読（Done）」アクションを追加する。読み切ったときに押すと `read` にして未読キューから除去（legacy の Read/Unread トグル相当）
- [x] ActionBar を再構成する: Like / Dislike / 既読 / Skip / Note（将来: シェア=読了記録＋公開 / この路線でもっと / Claude対話）
- [x] 再読ライブラリ画面を追加する。既読（read）記事などをステータス別に一覧し、タップでリーダーを開いて再読できる
- [x] お気に入り（★ ブックマーク）を追加する。Like とは独立した「保存して見返す」フラグ。お気に入りのみの一覧参照も可能にする（学習には影響しない）
- [x] トレーニングモード `/train`（TrainingView）を追加する。スコアが際どい記事を評価してベクトル精度を上げる専用画面。評価のみで既読にしない
- [x] トレーニングキューは**評価済み（like/dislike のフィードバックがある）記事を除外**する。訓練は判断が未確定の記事にベクトルを教える用途なので、一度評価した記事は再提示しない（`findBorderline` に `NOT EXISTS(feedback)` を追加）
  - 補足（今回合意した2軸の整理）: **status（未読/既読/skip＝読書進捗）** と **feedback（like/neutral/dislike＝訓練シグナル）** は直交する2軸。UI は画面（モード）で分離する＝ Home `/`＝享受モード（読む。主役は Done/Skip）、`/train`＝訓練モード（評価する。主役は Like/Dislike）。
  - Home 未読カルーセルの結線は現状維持で確定: **like は評価のみで未読に残す**（＝「後でじっくり読む」）、**dislike は評価＋既読化で未読から抜く**（＝「もう読まない」）。「評価済みは再提示しない」は訓練キューのみで担保する。

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

# ユーザフィードバック

- [x] VRTベースのスクリーンショットを取ろうとmacのdockerで実行すると以下のようなエラーがたくさん出ていました。（原因: E2E spec が旧UI前提で古い＝日本語ラベル・上部ナビリンク・.snap-x・input[placeholder*='URL'] 等が現行UIに存在しない。4つの spec を現行UIに合わせ role/testid/英語テキストで書き直し。data-testid=carousel/empty-state/position-indicator を追加。旧VRTベースラインは削除し、CI(linux)でベースラインを再生成→コミットする手動ワークフロー .github/workflows/vrt-baselines.yml を追加。※このワークフローを一度実行してベースラインを作れば以降の VRT が通る）
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
- [x] カテゴリ追加のUIにテキスト入力欄が二つありますがそれぞれ何を入れるのかわかりませんでした（名前(必須)・説明(任意)のラベルと例を追加。編集フォームにも）
- [x] デバッグ用のクエリ入力欄にはグラフDBのクエリする場所も用意してください。SQLとそれの実行結果はなにがでてきますか？…（SQLサンプルのプルダウン挿入＋デフォルトクエリ＋結果=列と値の説明を追加。グラフDB=Kuzuは未実装のため「利用不可」と明記）
- [x] スコアが全部0%で更新されていないようなのですが…（原因: **既定の嗜好プロファイルが作成されておらず** findDefault→null で全記事0点。DB初期化時に default プロファイルを自動作成するよう修正。Admin に like/dislike 件数を追加。未読/既読/スキップ数は既存の Queue セクションに表示済み。※既存記事のスコアは取込時に確定するため、フィードバック反映後は `bun run reingest` で再採点）
- [x] ヘッダーの左右矢印は、右手モードか左手モードかを示したい…（数字の左右に Hand アイコンを表示。右手=数字の右、左手=数字の左に左右反転で表示。ハンドネスはグローバル設定として永続化）
- [x] ノートなど、画面上部に戻るUIがある画面は全て、画面下部のボタンにしてください（共通 BackButton を全画面の下部に配置。上端の←は撤去）
- [x] ノートの再編集や削除の操作を追加してください（NoteDetail に Edit/Delete）
- [x] requirements.mdの図もAAじゃなくて描画できる図にしてください（mermaid化。docs/requirements.md）
- [x] JINAとCLAUDEの環境変数は.envファイルが必要なので、.env.sampleのようなファイルを作ってコミットしておいてください
- [x] アーキテクチャとrequirements, tasksはdocsに移動しましょう（docs/ へ移動）
- [x] DDDとはいえ非エンジニア向けのドキュメントを用意したいです。何かしら書類にする仕組みを入れてもらえますか。docsフォルダに出力するか、actionsで生成して、github上で何か確認できるフォーマット、場所に出力するとか。playwrightの画面設計図も同様にgithub上で参照できると嬉しいです。今はactionsを探して特定してダウンロードしてunzipしてindex.htmlを開く必要があるのが手間です（GitHub Pages に自動デプロイする仕組みを追加。①TypeDoc で packages/{domain,types,db} の Domain & API Reference を生成＋docs/domain-model.md を平易な英語のDDDガイドとして表紙に、②画面カタログを英語化して Pages に掲載、③scripts/build-docs-site.ts が英語ランディングで両者を統合。.github/workflows/docs.yml が push(v2) でビルド&デプロイ。`bun run docs` でローカル生成可。※初回のみ GitHub 設定→Pages→Source を "GitHub Actions" にする必要あり）
- [x] PWA対応（manifest＋SVGアイコン＋apple-touch-icon）。theme-color を light/dark で出し分け、status-bar-style=black-translucent。アプリもOSのダーク/ライトに追従（.dark自動適用）するよう修正
- [x] 設定画面に、feed別に取り込み済みの記事の数を表示して欲しいです
- [x] 設定画面のフィードはフィードメタ情報を載せきれていないです。フィードURLが2行表示されているので、発行元とフィードの名前など、その辺りフィード取得次に取得可能な情報を表示できるようにして欲しいです
- [x] 設定画面で、URLをサブミットした履歴を表示して欲しいです。もしくは、件数を表示して、過去にsubmitしたURLの一覧に遷移できるUIを追加して欲しいです。それには、フィードバックがあればそのフィードバックも表示したいです。例えばサイト(ドメイン名)単位でのlike/dislike率などの統計情報が得られても嬉しいです（Submitted URLs 履歴は実装済み＝/admin/jobs?type=ingest_url。加えて GET /admin/feedback-by-domain を追加し、Settings に「Feedback by source」＝ドメイン単位の like/dislike 件数と like率を表示）
- [x] 記事表示ビューで、評価済みのものはその評価がわかるように…（一覧APIの feedback から like/dislike ハイライトを初期化。既読を開いても評価済みが色で分かる）
- [x] ライブラリから記事を開いた時に戻るボタン位置と、ライブラリの戻るボタン位置が異なる。記事側が好み（共通 BackButton に統一＝記事側の位置 下部+4.75rem）
- [x] 右手と左手の切替でメニュー、戻るボタンの位置が変わらないです（グローバル handedness に連動して左右反転するよう修正）
- [x] ライブラリのタブが画面幅を超える／今どのリストか分からない（タブバーを横スクロール可に。カルーセルのヘッダー左に色付きのリスト名ラベルを表示＝Queue/Train/Read/Favorites/Skipped を色分け）
- [x] カテゴリ登録画面の入力欄が背景色と同じで見えない（text-foreground を追加）
- [x] メニューの、左右切替メニューを押しても何も変わらない（グローバル handedness ストア化で解消）
- [x] discoverで検索して見つかった記事を選ぶと真っ白（ReaderView が毎回新配列を渡し watch がループ。安定 computed に修正）
```
[Warning] [Vue warn]: Unhandled error during execution of scheduler flush (19) (vue.runtime.esm-bundler-D8sjMbKj.js, line 1766)
"
"
" at <ArticleFeed"
"key=0"
"items="
[Proxy] (1)
"list-key=\"single\""
" ..."
">"
"
"
" at <ReaderView"
"onVnodeUnmounted=fn<onVnodeUnmounted>"
"ref=Ref<"
Proxy {__v_skip: true}
">"
">"
"
"
" at <RouterView>"
"
"
" at <App>"
[Error] Unhandled Promise Rejection: TypeError: null is not an object (evaluating 'instance.job.flags')
	logError (vue.runtime.esm-bundler-D8sjMbKj.js:1955)
	handleError (vue.runtime.esm-bundler-D8sjMbKj.js:1947)
	callWithErrorHandling (vue.runtime.esm-bundler-D8sjMbKj.js:1905)
	flushJobs (vue.runtime.esm-bundler-D8sjMbKj.js:2052)
```
- [x] legacyの設定画面にある feed url extractor, open rss, genfeedのリンクはこちらの設定画面にも同様に追加してください
- [x] 設定のエクスポートインポートにも対応してください。JSONでダウンロード、アップロードを想定。フィードURL郡の出力と、嗜好ベクトルの出力をイメージしています
- [x] ヘッダーの矢印は不要です手のアイコンがついたので
- [x] ライブラリのreadタブにunreadボタンは不要です。開いたら変更できるので
- [x] ノートをつけているかどうかも記事を開いた時、一覧でのアイコンともにわかるようにしたい（記事ヘッダーのメタと Library 行に StickyNote アイコンを表示。API に hasNote を追加）
- [x] ノートの編集削除アクションがヘッダにある。アクションはボトムがきほん
- [x] adminパネルのサービス一覧のラベルが黒い文字で読めない(ダークモードの時)
- [x] adminパネルのrefreshボタンがヘッダにある。操作ようボタンは全てボトム
- [x] 戻るボタンとメニューボタン(ボトムから少し浮いたボタン)はもう少し目立たせたい（BackButton をカード＋影＋リングで強調、メニュー FAB を primary 色に。押下フィードバック追加）
- [x] 全体的に、インプットフォームなどがダークモードの時に黒い文字で読めない
- [x] ノートはmarkdownで記述します。maeked.jsでレンダリングしてもらえますか？他にいいものがあれば私に聞いて欲しいです（marked.js でパース→DOMPurify でサニタイズして NoteDetail 表示モードにレンダリング。marked は軽量・実績十分で採用）
- [x] ライブラリなど、記事を一覧する場所では記事のドメイン名を記載して欲しいです。情報源のカテゴリとして視認したいです（Library 行・Discover 結果・記事ヘッダーに hostname を表示）
- [x] dislike, readのように操作すると消えるものはundoするためのバナーか何かを一定時間表示してもらえますか。可能ならiphoneをshakeしてundoできるとさらに良いです（dislike/read/skip で記事が消えた直後に Undo バナーを約6秒表示。ステータス＋フィードバックを元に戻し、元の位置に復帰。端末のモーションセンサーがあればシェイクでも undo＝iOS は初回操作時に許可要求）
- [x] discoverの検索フォームにフォーカスするとズームしてしまったので文字が小さすぎるかもしれません。iphone safariでズームしないようなフォームにして欲しいです。この画面に限らず全体に適用して
- [x] ホーム画面に追加するとボトムのボタンの下に無駄に余白があります（原因: standalone で env(safe-area-inset-bottom)≈34px が下パディングに丸ごと入り、ボタン下に空帯。ActionBar の下パディングを inset−0.75rem（下限0.5rem）に縮小。ブラウザ表示は不変。※iPhone 実機で要確認）
- [x] スワイプできなくなってる
- [x] RSSの場合、記事のメタデータ表示領域にホスト名、フィードの名前などフィードのメタデータも表示して欲しいです。どのフィードから出てきた記事か、という情報も欲しいです（記事ヘッダーに RSS バッジ＋feedTitle＋host を表示。API に feedTitle を追加）
- [x] discoverで検索して記事を見て戻ると検索ワードが消えているので、復元してリストを再表示して欲しいです。（検索語を URL クエリ ?q= に保存し、mount 時に復元して再検索）
- [x] 日本語変換を確定した時のEnterキーでsubmitされないようにして欲しいです(discoverの検索て見つけましたが同様のものがあれば一緒に修正したい)（Discover の Enter ハンドラで e.isComposing / keyCode===229 を判定して確定中は無視）
- [x] note入力時、command + enterでsaveしたい（ArticleFeed のノート入力と NoteDetail 編集の textarea に Cmd/Ctrl+Enter で保存を追加）
- [x] vrtでこけるものが残っている。エラーは以下の通り（上のVRT項目と同一。spec を現行UIに書き直し＋ベースライン再生成ワークフローで対応）
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
- [x] discoverの検索フォームもios26のようにボトムに移動してもらえますか。丸い感じで（検索入力をヘッダから撤去し、ボトムの丸いカプセル型フローティングバーに移動。結果リストは下部余白を確保）
- [x] 記事を見ている時に、その記事についているノートを確認するための動線が欲しいです。（記事メタのノートインジケータを「Note」リンク化＝タップでその記事のノートだけを表示する Notes 画面へ遷移＝`/notes?article=<id>`＝`GET /notes?articleId=`。全件へ戻る導線付き）
- [x] 記事中のaタグがアプリを上書きしてしまうので新しいタブで開くようにできますか（sanitize.ts の DOMPurify afterSanitizeAttributes フックで、記事HTML・ノートMarkdown 内の全リンクに target=_blank / rel=noopener noreferrer を付与）
- [x] カテゴリの追加ボタンが上にあるので、ボトムに移動してください。ヘッダ行にあるボタンを全て調査してください（Categories の「+ Add」をボトム中央 FAB に移動。全ビュー調査結果＝ヘッダに独立アクションボタンが残っていたのは Categories のみ。Admin refresh・NoteDetail 編集/削除・Library タブは既にボトム、Settings の各ボタンはフォーム内、Discover の検索ボタンは入力欄とセットで別タスク「検索フォームをボトムへ」で対応予定）


---

## 未実装機能の計画（WBS）

要件（requirements.md §3/§9）・設計（architecture.md）と現状実装の差分から洗い出した、機能単位の未実装項目。
凡例: ☐ 未着手 / ◑ 部分実装（backendのみ等） / ✖ 現状スコープ外

### Epic A. コンテンツ取り込みの拡張
- [x] ☑ A1a. Settings に「HTML貼り付け投入」フォーム（`POST /articles/ingest/html` は実装済み・UI無し）→ Settings に「Submit HTML」セクション（URL＋任意タイトル＋HTML本文）を追加して投入可能に
- [ ] ☐ A1b. メール → HTML POST ブリッジ（受信メール本文HTMLを `/ingest/html` へ）※方式決定/受口/送信元ホワイトリスト
- [ ] ☐ A2. Gmail ポーリング（送信元ホワイトリスト）※フェーズ2
- [ ] ☐ A3. IMAP 対応 ※フェーズ2
- [ ] ☐ A4. SNS（Bluesky / AT Protocol）取込 ※フェーズ2

### Epic B. 取り込みパイプライン化（前処理の連結）
- [ ] ☐ B1. パイプライン基盤（前処理ステップを配列で連結できる構造）
- [ ] ◑ B2. Claude 前処理（要約・キーワード/カテゴリ抽出）を有効化し**結果を永続化**（現状 `claudeEnricher` は無効＋結果破棄）
- [x] ☑ B3. 長文チャンク分割（Jina 8194トークン超の恒久対応。現状 `truncate:true` で暫定）→ 段落境界でチャンク分割（超過段落はハード分割）→バッチ埋め込み→mean-pool→normalize。truncate はチャンク単位の安全網として維持。chunkText/meanPool は純関数で単体テスト済み
- [x] ☑ B4. 埋め込み対象テキストの設計（タイトル/冒頭/全文のトークン最適化）→ buildEmbeddingInput が本文とリンクのみでタイトルを含めていなかったので、タイトルを先頭に付与（3呼び出し元で title を渡す）。本文の語数上限＋B3チャンク分割と併用。単体テスト追加。※冒頭重み付けの更なる最適化は将来課題

### Epic C. 嗜好ベクトル・スコアリング
- [x] ☐ C1. スコア0%問題の調査/修正（採点タイミング・初期プロファイル・dev反映）※上のメモと同一
- [x] ☐ C2. フィードバック可視化（Admin に like/dislike 件数、未読/既読/スキップ数）※上のメモと同一
- [ ] ☐ C3. 複数嗜好ベクトル（preference/shareable/knowledge）の目的別活用（スキーマ・EMAは対応済み、用途未接続）
- [ ] ✖ C4. 嗜好プロファイル初期生成（ブックマークHTMLインポート）※現状スコープ外

### Epic D. ナレッジ / グラフDB（Kuzu）
- [ ] ☐ D1. Kuzu 導入（`packages/db/src/kuzu` は現状 `export {}` のみ）
- [ ] ☐ D2. 関係の書き込み（記事⇄ノート⇄カテゴリ）
- [ ] ☐ D3. `/articles/:id/related`（グラフトラバーサル）実装＋UI（現状は空返し）
- [ ] ☐ D4. ノートのベクトル化（類似ノート探索）
- [ ] ☐ D5. カテゴリ自動クラスタリング（`centroid_vector` 算出・自動ラベル。現状は手動CRUDのみ）

### Epic E. Claude 連携 UI
- [x] ☑ E1. 記事からClaude対話UI（`POST /claude/chat` は実装済み・UI無し）→ 記事下部の ClaudePanel にインラインチャット（sessionId をフォローアップに引き継ぎ）を追加。※worker 未起動時はエラー表示、multi-turn 文脈継続は E4 の未修正バグ依存
- [x] ☑ E2. 記事要約の表示（`POST /claude/summarize` 実装済み・UI無し）→ ClaudePanel の「Summarize」ボタンで要約取得＋表示（article.summary にも永続化）
- [x] ☑ E3. 対話→ノート保存（`POST /claude/note` 実装済み・UI無し）→ 各 Claude 返信に「Save as note」を追加（claude_conversation ノートとして保存）
  - ※これらは claude-worker が必要。開発環境で未起動のため runtime 検証は未実施（build/型/テストは green）
- [x] ☑ E4. claude-worker セッション継続バグ修正（`--resume` はID／`/sessions/:id` が常に404）→ `claude -p --output-format json` で CLI の実 session_id を取得して返し、次ターンは `--resume <id>` で継続。既知 sessionId を Set で保持し `/sessions/:id` が実在を返すように。パース処理は parseClaudeResult() に切り出し単体テスト追加。※claude CLI 実行の end-to-end は未検証（環境に CLI 無し）

### Epic F. 発見・共有
- [x] ☑ F1. 「この路線でもっと」= 類似記事UI（`GET /articles/:id/similar` は実装済み・導線無し）→ エンドポイントに title/url を追加し、記事下部に「More like this」（ベクトル類似 top5・リンク付き）を表示。埋め込み無し記事では非表示
- [~] ◑ F2. SNSシェア（`navigator.share` ＋ 読了記録＋外部公開）→ 記事下部に Share ボタンを追加（Web Share API、非対応時はリンクをクリップボードにコピー）。残: 読了記録との連動、外部公開（"公開"の意味＝shareable ベクトル/公開ページ等の方針決定が必要）
- [ ] ☐ F3. Discover のカテゴリ探索

### Epic G. 品質 / 運用 / ドキュメント
- [x] ☑ G1. E2E/VRT を新UIに更新＋ベースライン再生成（上の VRT メモと同一。spec 書き直し＋ vrt-baselines.yml で再生成）
- [ ] ☐ G2. デバッグクエリ強化（グラフDBクエリ欄＋SQLサンプル/プルダウン）※上のメモと同一
- [x] ☑ G3. 非エンジニア向けドキュメント生成（docs出力 or Actionsで参照可能に）＋画面設計図をGitHub上で参照（GitHub Pages に TypeDoc＋画面カタログを自動デプロイ。docs.yml）

---

## 検討事項（未定・要決定） — 記入用

> 残りWBSのうち「方針決定」「外部インフラ」「大型実装」が必要なもの。各項目に
> **決めること / 質問 / 判断材料（現状・選択肢・トレードオフ）** を整理した。
> ここに回答・追記していただければ、その方針で着手します。

### A1b. メール → HTML POST ブリッジ
- **決めること**: 受信メール本文HTMLを `/ingest/html` に流し込む「受け口」の方式。
- **質問**:
  - Q1. 受信方式は？ ①専用アドレス宛のメール転送を受ける Webhook（例: Cloudflare Email Routing / SendGrid Inbound Parse）、②自分で Gmail/IMAP をポーリング（＝A2/A3）、③手動転送先の簡易エンドポイント。
  - Q2. 送信元ホワイトリスト（許可アドレス/ドメイン）はどこで管理？ 環境変数 or DB設定。
  - Q3. 認証は？ 共有シークレット（ヘッダ/クエリトークン）で十分か。
  - Q4. HTML本文の抽出は「メールのHTMLパートそのまま」でよいか、`@postlight/parser` 等で本文抽出するか。
- **判断材料（現状）**: `POST /articles/ingest/html`（URL＋HTML）は実装済み・UIも追加済み（Settings）。ブリッジは「メールを受けて同エンドポイントを叩く」薄い層でよい。SaaS Webhook 方式が最短。運用ホスト（zimaboard, Tailscale）は外部から直接受けにくいので、Cloudflare Email Routing→Worker→Tailscale funnel か、②のポーリング方式が現実的かも。

### A2 / A3 / A4. Gmail ポーリング / IMAP / SNS(Bluesky) 取込（フェーズ2）
- **決めること**: フェーズ2着手可否と優先順位。
- **質問**:
  - Q1. まず着手するのはどれ？（想定ユースケース＝どの情報源を一番取り込みたいか）
  - Q2. Gmail は OAuth（API）か、アプリパスワード＋IMAP か。
  - Q3. Bluesky は自分のタイムライン取込か、特定フィード/リスト購読か。
- **判断材料**: いずれも常時稼働のポーラー（ingester にジョブ追加）＋認証情報の保管が必要。A1b の Webhook 方式が動けば Gmail ポーリングは不要になる可能性。

### B1 / B2. 取り込みパイプライン基盤 + Claude 前処理
- **決めること**: 前処理を「配列で連結できる基盤（B1）」として作るか、B2（Claude要約・キーワード/カテゴリ抽出の永続化）を先に直書きで入れるか。
- **質問**:
  - Q1. パイプラインで差し込みたい前処理は具体的に何？（例: 本文クリーニング→Claude要約→キーワード抽出→カテゴリ提案→埋め込み）。実際に欲しいステップが2〜3個なら基盤化は後回しでもよい。
  - Q2. B2 の Claude 前処理は**取込時に毎回**走らせる？（コスト・レイテンシ増）それとも任意/バッチ？
  - Q3. 抽出結果（要約・キーワード・カテゴリ）の保存先: `articles.summary` は既存。キーワード/カテゴリ候補用のカラム/テーブルを追加してよいか。
- **判断材料（現状）**: `claudeEnricher` は無効化され結果破棄。`POST /claude/analyze`（keywords/categories/summary）は claude-worker 側に実装済み。E4 修正で worker 連携は健全化済み。取込時に analyze を呼び、結果を保存すれば B2 は成立。B1（抽象基盤）は over-engineering になりがちなので、欲しいステップが固まってからが安全。

### C3. 複数嗜好ベクトル（preference / shareable / knowledge）の用途接続
- **決めること**: preference 以外の2ベクトルを「何の入力で学習し、どの機能で使うか」。
- **質問**:
  - Q1. `shareable` は何で学習？（案: Share アクションした記事を +）。用途は？（案: 「他人に薦めたい」観点の Discover 並べ替え／公開ページのおすすめ）。
  - Q2. `knowledge` は何で学習？（案: ノート作成・カテゴリ付け・Claude対話した記事を +）。用途は？（案: 「学び用」Discover、関連ノート探索の土台）。
  - Q3. スコアリング（未読キューの並び）は今後も preference 単独でよいか、混合するか。
- **判断材料（現状）**: スキーマ・EMA更新は3ベクトル対応済み（[[architecture]] §8）。現在 UI/スコアは preference のみ使用。学習トリガー（Share/ノート等）は既にイベントとして存在するので、`vectorTarget` を指定して feedback を積むだけで学習は回せる。

### D1〜D5. ナレッジ / グラフDB（Kuzu）
- **決めること**: Kuzu を本当に導入するか（大型）。代替（SQLite だけで関連機能を実現）で足りるか。
- **質問**:
  - Q1. 「関連記事(D3)」「類似ノート(D4)」は sqlite-vec のベクトル近傍で十分か、グラフ探索（共有カテゴリ/引用リンクの多段）が本当に要るか。
  - Q2. カテゴリ自動クラスタリング(D5)は欲しいか。欲しい場合、クラスタ数は固定/自動、ラベルは Claude 生成でよいか。
  - Q3. Kuzu 導入の運用コスト（別ボリューム・スキーマ・バックアップ）を許容するか。
- **判断材料（現状）**: `packages/db/src/kuzu` は空。`/articles/:id/related` は空返し。カテゴリは手動CRUDのみ・記事への割当UIも無い。
  - **軽量代替案**: D3「関連」は sqlite-vec 近傍（=F1 の /similar）で代替可。D4「類似ノート」はノートを埋め込んで sqlite-vec に載せれば Kuzu 不要。D5 は記事埋め込みの k-means＋Claude ラベルで SQLite だけでも可能。→ **まず Kuzu 無しで D3/D4/D5 の“軽量版”を作り、本当にグラフ探索が要るか見極める**のが低リスク。この方針でよいか？

### F2（残り）. 読了記録 + 外部公開
- **決めること**: 「シェア」に何を伴わせるか。
- **質問**:
  - Q1. Share したら自動で既読(read)にする？（今は分離。Share＝読了扱いにするか）。
  - Q2. 「外部公開」の具体像は？ ①単に OS 共有シート（実装済み・完了扱いでよい）、②公開URL/ページを自前で生成して誰かに見せる、③`shareable` ベクトルの学習トリガーとしてのみ使う。
  - Q3. ②の場合、公開先（静的ページ？ 認証は？）と対象（記事メタのみ？ 本文は著作権的にNG）。
- **判断材料（現状）**: OS 共有シート（navigator.share）＋リンクコピーは実装済み。②はホスティング/権利面の設計が必要でスコープ大。

### F3. Discover のカテゴリ探索
- **決めること**: 実装順（前提が未整備）。
- **質問**:
  - Q1. カテゴリへの記事割当をどう発生させる？（手動割当UI／B2の自動カテゴリ提案／D5自動クラスタリング）。
  - Q2. Discover でのカテゴリ表示は「タグチップで絞り込み」でよいか。
- **判断材料（現状）**: `GET /categories` と repo の `findByCategoryId` はある。ただし記事割当UIも自動割当も無く、今作っても中身が空。**B2 か D5 で割当が発生してから**着手が妥当。`GET /categories/:id/articles` の追加は小さい。

### G2. デバッグクエリ強化（グラフDBクエリ欄）
- **判断材料**: SQL クエリ欄・サンプルは実装済み。グラフDB欄は **D1(Kuzu) 次第**。Kuzu を入れない方針なら本項目は不要（クローズ）でよいか？

### B4 追補（任意）. 埋め込み入力の重み付け最適化
- **判断材料**: 現状はタイトル＋本文（語数上限）＋リンク文言。将来案＝タイトルを繰り返して重み付け／本文は冒頭+要約優先。効果測定が難しいので、スコア品質に不満が出たら再検討。

