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
