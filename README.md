# THUMB FORGE

写真から色と質感を解析して、Instagram・YouTube 用のサムネイルを組むブラウザツール。
判定はすべて**実寸プレビュー**で行う。大きい画面で作って現場で潰れる、を防ぐための道具。

すべてクライアントサイドで完結する。写真はどこにもアップロードされない。

## できること

- **4フォーマット** — Instagram 4:5 / 1:1、ストーリーズ 9:16、YouTube 16:9。切り替えると出力解像度ごと変わる
- **実寸プレビュー** — 各フォーマットが実際に見られるサイズ（YouTube なら 168px と 246px、Instagram なら 120px と 184px）で常時表示
- **セーフゾーン表示** — YouTube の再生時間バッジ、Instagram グリッドの正方形トリミング、ストーリーズの上下 UI 帯。書き出し時は自動で消える
- **色の抽出** — k-means で写真から 5 色を取り、彩度と中間輝度からアクセント 1 色を自動選定
- **組版の提案** — 平均輝度・彩度・エッジ密度の 3 指標で 3 つの書体ペアをスコアリングして順位付け
- **可読性の警告** — 明るすぎる／情報量が多すぎる写真には、帯や縁取りを具体的に提案
- **文字数カウンタ** — メイン 12 文字、サブ 22 文字を超えると赤くなる
- **3 レイアウト** — 下ベタ帯 / 中央抜き（被写体を文字の前に出せる）/ 左寄せ縦
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
index.html              マークアップ
css/style.css           UI のスタイル
js/app.js               解析・組版・書き出しの全ロジック
sw.js                   Service Worker（変更を出したら CACHE を上げる）
manifest.webmanifest    PWA マニフェスト
icons/                  192 / 512 / 1024px
.github/workflows/      Pages デプロイ
```

## 手を入れるところ

**書体ペアを足す** — `js/app.js` の `TYPES` に 1 要素追加する。`score(a)` が写真の特徴
（`a.luma` 明るさ / `a.sat` 彩度 / `a.edge` 情報量、いずれも 0–1）を受け取って数値を返し、
その大きい順に提案される。提案がしっくりこないときは、まずここを触るのが一番効く。

**レイアウトを足す** — `LAYOUTS` に定義を足し、`render()` の分岐と描画関数を 1 つ書く。

**フォーマットを足す** — `RATIOS` に追加する。`small` と `mid` は実寸プレビューの表示幅なので、
そのプラットフォームで実際に表示されるピクセル幅を入れること。ここを適当にすると道具の意味がなくなる。

## 書体

同梱ではなく Google Fonts から読んでいる。すべて SIL Open Font License。

Bodoni Moda / Anton / Archivo Black / Zen Old Mincho / Shippori Mincho / Noto Sans JP

## ライセンス

MIT。
