# roscolle（ロスコレ） サイト実装

全国の小さな自家焙煎コーヒー販売事業者を紹介する、ビルド不要の静的サイトです。
GitHub Pages（`https://roastia.github.io/roscolle/`）で公開しています。

## ファイル構成

```text
/
├── index.html               # トップページ（SPAの外枠。中身は app.js が描画）
├── recruit.html              # 焙煎者募集ランディングページ
├── terms.html                 # 利用規約
├── privacy.html               # プライバシーポリシー
├── assets/
│   ├── css/
│   │   ├── site.css          # index.html 用スタイル
│   │   └── recruit.css       # recruit.html 用スタイル
│   └── js/
│       ├── app.js            # トップページのロジック本体（診断・一覧・詳細表示など）
│       └── recruit.js        # 焙煎者登録フォームの送信処理（写真アップロード→Googleフォーム送信）
├── data/
│   └── roasters.json         # 掲載中の焙煎所データ（ファイル名・配置・スキーマは変更しない）
└── images/
    └── roasters/              # 焙煎所写真の固定配置先
```

`terms.html`・`privacy.html`は、それぞれ独立したページとして埋め込みスタイルを持っています（`site.css`は参照していません）。

## ローカル確認

`fetch()` でJSONを読むため、`index.html` を直接ダブルクリックせず、HTTPサーバーから開いてください。

```bash
python3 -m http.server 8000
```

ブラウザで `http://localhost:8000/` を開きます。

## データの更新フロー

`data/roasters.json` は手動編集せず、以下の登録・承認フローを通じて更新します。

1. `recruit.html` の登録フォームから焙煎者が申し込む（Googleフォームに送信）
2. 回答が溜まるスプレッドシートに紐づいたGoogle Apps Script（`code.gs` / `Index.html` / `Edit.html`）で内容を確認し、承認・却下する
3. 承認すると、GAS が GitHub API 経由で `data/roasters.json` と `images/roasters/` を自動更新する
4. 掲載中の焙煎所には、内容編集・掲載停止ができる専用リンク（`Edit.html`）がメールで届く

このため、`data/roasters.json` を直接編集する場合は、GAS側の処理と競合しないよう注意してください（GASは`LockService`で更新処理を直列化していますが、手動編集とは競合し得ます）。

## 実装済みの機能（index.html / app.js）

- 診断を主役にしたトップページ
- 専門用語を使わない4問の味の好み診断
- 焙煎度合い・味タグ・任意サービス条件によるブラウザ内スコアリング
- 同点圏内に小さなランダム性を持たせたおすすめ表示
- 味タグからのおすすめ理由自動生成
- タグ絞り込み、キーワード検索、新着順・価格順・店名順
- `roasters.json` の全フィールドに対応した焙煎所詳細
- 空文字・`null`・`false` の任意項目を不自然に表示しない処理
- レスポンシブ表示、キーボード操作、フォーカス表示、代替画像

## ダミーデータについて

`data/roasters.json` には動作確認用の3件を収録しています。店名はすべて「ROSCOLLE DEMO」で始まる架空店で、EC URLは `example.com` です。実運用では、上記の登録・承認フローで追加された本物の焙煎所データに置き換わっていきます（テスト用に追加したエントリは都度削除してください）。

## デザイン変更について

サイトのデザイン・UI変更は、現在このリポジトリを直接操作できるツール（Claude等）を通じてのみ行っています。外部のデザインツール（ChatGPT等）は経由しない運用にしています。
