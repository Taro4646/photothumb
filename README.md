# THUMB FORGE

写真から色と質感を解析して、Instagram・YouTube 用のサムネイルを組むブラウザツール。
判定はすべて**実寸プレビュー**で行う。大きい画面で作って現場で潰れる、を防ぐための道具。

すべてクライアントサイドで完結する。写真はどこにもアップロードされない。

## できること

- **4フォーマット** — Instagram 4:5 / 1:1、ストーリーズ 9:16、YouTube 16:9。切り替えると出力解像度ごと変わる
- **実寸プレビュー** — 各フォーマットが実際に見られるサイズ（YouTube なら 168px と 246px、Instagram なら 120px と 184px）で常時表示
- **セーフゾーン表示** — YouTube の再生時間バッジ、Instagram グリッドの正方形トリミング、ストーリーズの上下 UI 帯。書き出し時は自動で消える
- **色の抽出** — k-means で写真から 5 色を取り、彩度と中間輝度からアクセント 1 色を自動選定
- **可読性の警告** — 明るすぎる／情報量が多すぎる写真には、沈めや縁取りを具体的に助言
- **文字数カウンタ** — メイン 12 文字、サブ 22 文字を超えると赤くなる
- **字間調整** — ブロックごとにトラッキングを指定できる
- **自由配置** — メイン / サブ / タグの 3 ブロックをプレビュー上でドラッグして配置。縦書き・横書き、揃え、色を個別に指定
- **書体 79 種** — 和文（明朝 / ゴシック / デザイン）・欧文（サンセリフ / セリフ / ディスプレイ）に分類したプルダウン。太さは細 / 中 / 太
- **センターガイド** — ドラッグ中に上下左右の中心に近づくとスナップし、赤いラインが出る
- **書き出し** — PNG / JPEG（画質指定可）。iOS では共有シート経由で写真アプリに直接保存できる
- **フレーム** — 写真を切り取らずに余白で辻褄を合わせるモード。余白はぼかした写真 / 白 / 黒 / アクセント色から選択。4:3 の写真を正方形で投稿するときなど
- **オフライン動作** — Service Worker で app shell と Web フォントをキャッシュ

## 使う

<https://YOUR-NAME.github.io/thumb-forge/>

ローカルで動かすなら、`file://` だと Service Worker が動かないので簡易サーバーを立てる。

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## GitHub Pages に置く

1. このリポジトリを push する
2. Settings → Pages → Source を **GitHub Actions** にする
3. `main` に push すると `.github/workflows/pages.yml` が走って公開される

ビルド工程はない。静的ファイルをそのまま配信している。

Actions を使わず Branch 配信にする場合は、Source を `main` / `root` に設定する。`.nojekyll` が
入っているので Jekyll の処理は走らない。

## ファイル構成

```
index.html              全部入り（HTML / CSS / 解析・組版・書き出しロジック）
sw.js                   Service Worker（変更を出したら CACHE を上げる）
manifest.webmanifest    PWA マニフェスト
icons/                  192 / 512 / 1024px
.github/workflows/      Pages デプロイ
```

意図的に単一ファイルにしてある。`index.html` をダブルクリックすればどこでもそのまま動くので、
サーバーを立てずに手元で確認できる（Service Worker だけは `http://` でないと動かない）。

## 手を入れるところ

**書体を足す** — `index.html` 内の `FONTS` に 1 要素追加し、`<link>` の Google Fonts URL に
family を足す。`g` がプルダウンのグループ名になる。

**フォーマットを足す** — `RATIOS` に追加する。`small` と `mid` は実寸プレビューの表示幅なので、
そのプラットフォームで実際に表示されるピクセル幅を入れること。ここを適当にすると道具の意味がなくなる。

## 書体

同梱ではなく Google Fonts から読んでいる。すべて SIL Open Font License。

Bodoni Moda / Anton / Archivo Black / Zen Old Mincho / Shippori Mincho / Noto Sans JP

## ライセンス

MIT。
