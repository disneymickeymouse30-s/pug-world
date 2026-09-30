# パグの世界 ～PUGS OF PUZZLE～

パグたちが暮らすファンタジー世界を、おやつパズルで冒険するRPG（MVP v0.1.0）。
`pug-tetris`（PUG BLOCK CRASH）と `suika-pug`（PUG PUG GARDEN）を融合した新作です。

## 遊び方
- 左右ドラッグで移動、タップで回転、下へはらうと一気に落とす
- 同じおやつが3つくっつくと融合して大きくなる（最大サイズ3つで「バースト」）
- 横一列そろえると、クッキー＝こうげき／ほね＝ガード／キャンディ＝かいふく＋スキルゲージ
- ゲージがたまったらモチのスキル「いただきます！」

## ファイル構成
```
index.html / manifest.json / sw.js
css/style.css
js/config.js      定数・盤面サイズ・表情
js/save.js        localStorage（pugworld.save.v1）
js/audio.js       効果音（suika-pug の sound.js を拡張）
js/pugArt.js      パグ描画エンジン（suika-pug から流用）
js/backgrounds.js 背景（suika-pug から流用）
js/treatArt.js    おやつブロックの絵
js/puzzle.js      盤面エンジン（落下・回転・ライン消去・融合・連鎖）
js/battle.js      パズル結果 → 戦闘・成長
js/story.js       会話と選択肢
js/ui.js          画面・HUD・図鑑
js/main.js        起動・入力・メインループ
data/characters.js  パグ（仲間・敵・図鑑）
data/items.js       おやつ
data/stages.js      地域とステージ
data/story.js       会話シーン・村での会話
```

## パグを増やすには
`data/characters.js` の `PW.DATA.CHARACTERS` に1件追加し、`PW.DATA.PUG_ZUKAN` に ID を足すだけで、
会話（`who: 'ID'`）と図鑑に登場できます。敵にするなら `data/stages.js` の `waves` に `enemy: 'ID'` を書きます。

## 公開
GitHub Pages などにフォルダごと置けば動きます（Service Worker で2回目以降はオフラインでも遊べます）。
既存2作とは別のリポジトリ（例：`pug-world`）に置くのがおすすめです。
