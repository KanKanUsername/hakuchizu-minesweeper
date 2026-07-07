# ChatGPT 用スクリーンショット

ChatGPT(コピー/UXライティング担当)への入力用。プロンプト v3
(`docs/multi-agent-prompts.json` の chatgpt)は、これら4枚の添付を必須としている。

| ファイル | 画面 | 用途 |
| --- | --- | --- |
| `1-main.png` | メイン画面(地図盤面+操作バー) | ボタンサイズ・ラベル文字量・全体トーンの把握 |
| `2-menu.png` | メニューモーダル | メニュー項目の文言・情報密度 |
| `3-clear.png` | クリア画面(GAME CLEAR / NEW RECORD / 各ボタン) | 祝福・シェア・リトライ文言の実文字量 |
| `4-collection.png` | 開放コレクション画面 | 差し替え対象の i18n 文言(見出し・リード・未開放ラベル)の実表示 |

いずれも 430×880(deviceScaleFactor 2)のモバイル相当ビューで撮影。
再撮影は `useGame.ts` の dev限定フック `window.__hakuchizuGame` を用いた
ソルバーで自動生成している(クリア画面は実際に盤面を解いて取得)。
