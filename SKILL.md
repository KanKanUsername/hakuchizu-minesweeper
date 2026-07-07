# SKILL.md — 白地図マインスイーパ 引き継ぎ資料

> 対象: このリポジトリを引き継ぐ開発者(人間・AIエージェント問わず)。
> 目的: システム構成の選定理由、棄却済み代替案、運用の暗黙ルール、技術的負債を
> 「退職するシニアエンジニアの引き継ぎ」水準で残す。
> 最終更新: 2026-07-07(PR #1 マージ直後)

---

## 1. プロジェクト概要

- **プロダクト**: 白地図マインスイーパ — 実際の地理データ(GeoJSON)を盤面にしたマインスイーパ。
  都道府県・国の「実際の隣接関係」で地雷数を推理する。ポートフォリオ兼、個人開発プロダクト。
- **確定済みUSP**(2026-07 premortem で固定。勝手に変えないこと):
  **「本物の地図がそのまま盤面になるマインスイーパ」**。パズルが主役。
  「地理が学べる」は副次価値であり、コピーやUIの主語にしない。
- **市場方針**: 当面**日本市場に集中**。英語UIは実装済みだが、英語圏への投資
  (マーケ・コンテンツ拡充)は世界地図モードの完成度向上後。
- **本番URL**: https://hakuchizu-minesweeper.vercel.app/ (Vercel、`main` ブランチから自動デプロイ)
- **開発体制**: 個人開発、予算ほぼゼロ(すべて無料枠)。AIマルチエージェント
  (Gemini=市場調査 / ChatGPT=コピー / Claude=技術)を併用。指示文は
  `docs/multi-agent-prompts.json`(v3)。

---

## 2. システム構成と選定理由

| 技術 | 選定理由 | 補足 |
| --- | --- | --- |
| React 19 + TypeScript | 複雑なゲーム状態(開閉・フラグ・地雷)の宣言的管理と型安全 | tsconfig に `strict` は無いが `verbatimModuleSyntax`・`erasableSyntaxOnly`・`noUnusedLocals` 有効。**型は `import type` で読むこと** |
| Vite 8 | 高速HMRとビルド | 設定は素の `vite.config.ts`(react + tailwind プラグインのみ)。ビルドは `tsc -b && vite build` |
| D3.js (d3-geo / d3-zoom) | GeoJSON の投影・SVG path 描画、ピンチズーム/パン | ズーム倍率は CSS 変数 `--zoom-scale` に流し込み、地名テキストの opacity を CSS calc で制御(ReactレンダリングなしでFPS維持) |
| Tailwind CSS v4 | 高速なスタイリング、ダークモード | **生パレット(gray-500等)禁止**。プロジェクト固有トークンを使う: `bg-surface / bg-paper / bg-paper-deep / text-ink / text-ink-soft / border-line / border-paper-deep / bg-amber / text-danger / text-safe`。ダークモードは `data-theme="dark"` 属性で切替 |
| Vercel | `main` push だけで本番デプロイ、ゼロ設定CI/CD | `vercel.json` なし(全デフォルト)。**Production Branch = main** |
| **バックエンドなし** | 予算ゼロ・個人運用のため、意図的にサーバーレス(サーバー無し)構成 | すべて localStorage 完結。外部送信ゼロがプレイヤーへの約束 |

### アーキテクチャの核心思想

1. **重い計算は事前生成**: 隣接判定(どの県とどの県が接するか)は実行時にやらない。
   Turf.js (`booleanIntersects`) でビルド前に計算し、JSON としてコミット済み
   (`src/data/adjacency/`)。実行時は単なる `Record<string, string[]>` のルックアップ。
2. **機能は疎結合モジュールで足す**: ゲームコア(`useGame.ts`)は聖域。コレクション・統計・
   シェア・ランキングはすべて「終局ステータスを observe する」か「localStorage を読む」だけで、
   ゲームロジック内部には手を入れていない。
3. **検証より先に機能を作らない**: 後述のリテンション検証ゲート(§6)。

---

## 3. データパイプライン(地図データの作り方)

リポジトリ直下の `.mjs` / `.py` 群は**一回限りの生成スクリプト**(アプリからは import されない)。

- `fetch_japan.py` / `download_all_prefs.py`: 国土数値情報等から GeoJSON を取得
- `generateAdjacency.mjs` / `generateAllAdjacencies.mjs`: Turf.js の `booleanIntersects` で
  隣接リストを生成 → `src/data/adjacency/*.json`
- `generateJapan.mjs` / `generateRegions.mjs`: 都道府県/地方マップの GeoJSON 生成
  → `src/data/prefectures/*.json`(59ファイル: 47都道府県 + R01-R09地方 + WORLD/EUROPE/USA)
- `scripts/add_maritime_borders.cjs`: **海上境界の追加**。世界/ヨーロッパマップで
  「孤島(隣接ゼロ)は運ゲーになる」問題を解決するため、海を挟んだ国同士に人工的な隣接を
  張っている(例: 日本↔韓国)。**孤島の扱いはゲーム性の根幹**なので、マップ追加時は必ず
  隣接ゼロのセルが無いか確認すること(`useGame.ts` は隣接ゼロセルに地雷を置かない防御もある)

**罠**: 地方マップ(R01-R09)は都道府県の集合に見えるが、実際のセルは**市区町村**
(95〜194セル)。「小さいマップ」は存在しない(最小は鳥取県の19市区町村)。

---

## 4. コードベースの地図(どこに何があるか)

```
src/
  hooks/
    useGame.ts        ← ゲームコア(聖域)。盤面生成・No-Guess保証・開放BFS・コード(chord)
    useCollection.ts  ← 開放コレクション集計(playStats を読むだけ)
    usePlayStats.ts   ← プレイ統計集計(同上)
    useRanking.ts     ← Firebase ランキング(凍結中、§6)
  lib/
    playStats.ts      ← ローカル計測の心臓部。全機能がここのデータに依存
    share.ts          ← 絵文字シェア(Wordle型ブロック生成)
    firebase.ts       ← Firebase 初期化(env 無ければ isRankingEnabled=false で完全無効)
    rankingRepository.ts ← Firestore アクセス層(凍結中)
  components/
    MapBoard.tsx      ← D3 描画・タッチ操作。タッチ競合解決のノウハウが詰まっている(§9)
    CollectionModal.tsx / StatsModal.tsx / RankingBoard.tsx ← 機能UI
    MenuModal.tsx     ← モーダルの「作法」の基準。新モーダルはこれを複製して作る
  data/
    prefList.ts       ← PREFECTURES(コード↔名前↔市区町村数)と getMapName()。名前解決はここ一択
    adjacency/ prefectures/ ← 事前生成データ(手で編集しない)
  i18n.ts             ← フラットキーの t(lang, key, replacements?)。ドット記法キーは存在しない
docs/
  multi-agent-prompts.json  ← AI外注用指示文 v3(実型定義埋め込み済み)
  retention-metrics.md      ← ★最重要。ランキング解禁の判断ゲート
  ranking-requirements.md   ← ランキング技術要件(Phase 2)
  research/                 ← 市場調査の受領記録・外部AI出力の検証記録・スクショ4枚
SKILL.md              ← 本書
```

### ドメイン知識: コード体系(暗記必須)

- **mapId**: `'JAPAN' | 'WORLD' | 'EUROPE' | 'USA'` | JIS都道府県コード `'01'〜'47'`(市区町村モード) | `'R01'〜'R09'`(地方)
- **セルコード**: JAPAN盤面 = JIS都道府県コード2桁。市区町村/地方盤面 = 5桁市区町村コード
- **playStats の maps キー**: `` `${mapId}:${difficulty}` ``(例 `JAPAN:normal`)。
  mapId 側にコロンは来ない前提(現状安全)だが、パースは `lastIndexOf(':')` で実装済み
- **localStorage キー**(**改名禁止** — 既存プレイヤーのデータが飛ぶ):
  - `hakuchizu-play-stats-v1` … 計測データ(スキーマ変更時は version を上げてマイグレーション)
  - `hakuchizu-best-{prefCode}-{difficulty}` … ベストタイム(useGame が直接管理。playStats 側の bestTimeSec と**二重管理**、§8参照)
  - `theme` / `language` / `difficulty` / `longPress` / `hakuchizu-ranking-name`

---

## 5. ゲームコアの不変条件(壊すと即バグる)

`useGame.ts` の暗黙の保証:

1. **初手は絶対安全**: 最初にクリックしたセル+その隣接には地雷を置かない
2. **No-Guess 保証(ベストエフォート)**: 盤面生成後に制約伝播ソルバー(`isSolvable`)で
   「論理だけで解ける」ことを検証し、ダメなら再生成。**200回試行で妥協してフォールバック**
   (console.warn が出る)。10回ごとに `setTimeout(0)` でメインスレッドに譲る —
   これを外すと市区町村モードでUIがフリーズする
3. **孤島(隣接ゼロ)には地雷を置かない**: 運ゲー防止。ソルバー上も孤島は自明に安全扱い
4. **タイマーは status==='playing' の間だけ** 1秒刻み。時間単位は全システムで「秒(整数)」

---

## 6. 意図的に凍結されている機能: Firebase ランキング

**存在するが動いていない。これはバグではなく経営判断。**

- コード一式は実装・コミット済み(`firebase.ts` / `rankingRepository.ts` / `useRanking.ts` /
  `RankingBoard.tsx` / `firestore.rules` / `.env.example`)。
- ただし環境変数 `VITE_FIREBASE_*` が未設定のため `isRankingEnabled=false` → UIに一切出ない。
- **解禁条件は `docs/retention-metrics.md` §4 の検証ゲート**(要約):
  計測開始2〜4週間後に (1)テスター過半数が2日以上プレイ、(2)同一マップ×難易度の再挑戦が
  観測される、(3)全体クリア率30〜70%帯 — を満たした場合のみ有効化。
- 解禁手順は `docs/ranking-requirements.md` §7(Firebaseコンソール設定→ルール適用→
  複合インデックス(mapId, difficulty, timeSec)→Vercel環境変数→`RankingBoard` をクリア画面に1行追加)。
- **解禁前の必須作業**: 匿名表示名の重複対策(UID下4桁を `name#a1b2` 形式で併記)と、
  実測トラフィックからの Firestore 読み取り回数再見積もり。

**なぜ凍結か**: 「ランキング→リテンション向上」は未検証仮説であり、プレイヤー数が少ない
段階のランキングは空虚(premortem 指摘)。ゲート判定に使うデータは `playStats` が収集中で、
`hakuchizuStats()`(ブラウザコンソール)でエクスポートできる。テスターにはこのJSONの共有を依頼する運用。

---

## 7. 過去に棄却された代替案(蒸し返さないための記録)

| 代替案 | 棄却理由 |
| --- | --- |
| **ランキングを最初に実装**(初期ロードマップ & Gemini v1 の推奨1位) | リテンション向上の証拠ゼロ。検証ゲート方式に転換。Gemini v2 再調査でも証拠は全件[推定]止まりでゲート維持 |
| **Supabase**(ランキングBaaS) | RLS+RPC の実装コストと、無料枠の非アクティブ停止リスク。Firebase Spark の方が匿名認証+集計クエリが軽い |
| **Vercel KV / Postgres** | API Route(サーバーコード)が必要になり「バックエンドなし」の構成を崩すため |
| **英語圏優先展開**(Gemini v1 推奨2位) | 日本地図コンテンツは英語圏需要が薄い。世界地図モードの完成度が上がるまで日本集中 |
| **未開放地域を「???」で隠す**(外部Claude案) | 実在地名を見せる方が「次にどこを狙うか」の行動喚起になり、地図プロダクトの強みとも整合。ミステリー演出はシルエット素材が用意できたら再検討 |
| **開放済み地域の全列挙UI**(外部Claude案) | 市区町村モードで数百件になりモーダルが破綻。開放数+進捗バーのみ表示 |
| **静的なマップ定義ファイル(MAP_DEFINITIONS)** | 存在しない抽象を新設するより、プレイ時に盤面から総セル数を `playStats.mapTotals` に自己記録する方式を採用(新マップ追加時のメンテ不要) |
| **広告の早期設置**(Gemini v2 推奨3位) | UX毀損リスク。リテンション検証が終わるまで非推奨(オーケストレーター判断として記録済み) |
| **ゲームクリア判定への機能直結**(コレクション等を useGame 内に実装) | ゲームコアの複雑化を避け、App.tsx の status 監視 effect + localStorage 経由の疎結合に統一 |

---

## 8. 技術的負債(正直な台帳)

1. **ESLint ベースライン違反 約20件**(`App.tsx` / `MapBoard.tsx` / `useGame.ts`):
   `no-explicit-any` と `react-hooks/set-state-in-effect`。**lint はビルドゲートに入っていない**
   (`npm run build` = tsc+vite のみ)。新規コードはクリーンを維持する紳士協定。
   既存分を直すなら geoJson の型付け(`Feature<Geometry, {code,name,...}>`)から。
2. **ベストタイムの二重管理**: `useGame` が `hakuchizu-best-*` キーを直接管理し、
   `playStats.maps[key].bestTimeSec` にも同じ情報が入る。表示は前者、統計は後者。
   統合するなら playStats 側に寄せるが、既存キーのマイグレーションが必要。
3. **テストが無い**: 検証は Playwright の使い捨てスクリプト(scratchpad)+実機確認のみ。
   最優先でテスト化すべきは `useGame` のソルバー(`isSolvable`)と `playStats` のマイグレーション。
4. **バンドルサイズ警告**: チャンク500KB超(D3+全国GeoJSON+firebase)。実害はまだ無いが、
   firebase を動的 import にすれば凍結中のコードを本番バンドルから追い出せる(最も費用対効果が高い改善)。
5. **i18n の仮文言**: コレクション/統計画面の文言は ChatGPT 採用セット待ちのプレースホルダ
   (`collectionUnopened: 'まだ見ぬ土地'` 等)。差し替えは i18n.ts の値のみ変更、キー名は変えない。
6. **`hakuchizuStats()` / `__hakuchizuGame` の window 汚染**: 前者は本番にも存在(テスター用に意図的)。
   後者は `import.meta.env.DEV` ガード済みで本番には出ない。
7. **ビルドが遅い**(このリポジトリで約2分、Tailwind生成が72%)。CI導入時はキャッシュ必須。

---

## 9. 運用時の暗黙の前提・ルール

### デプロイ

- **`main` に入った瞬間 Vercel が本番デプロイ**する。`main` への直接 push はしない。
  作業ブランチ → PR → マージが唯一の経路。フィーチャーブランチの push では
  プレビューURL(一意)が自動生成される — 本番確認の前にそこで見るのが正道。
- 反映確認は**ハードリロード必須**(Ctrl+Shift+R)。SPA なのでキャッシュに騙されやすい。
- マージ済みブランチに追いコミットしない。同名ブランチを `origin/main` から作り直す
  (`git fetch origin main && git checkout -B <branch> origin/main`)。

### データの約束(プレイヤーへの暗黙の契約)

- **外部送信ゼロ**(ランキング解禁までは)。計測はすべて端末内。この前提を崩す変更は
  プライバシー文言の追加とセットでしか行わない。
- localStorage キーの改名・スキーマ破壊は禁止。`playStats` を変えるときは
  `version` を上げて `getPlayStats()` 内でマイグレーション(現在は v1、
  `mapTotals` は後付けフィールドなので `?? {}` で防御済み — このパターンを踏襲)。

### UI/UX

- 新しいモーダルは `MenuModal.tsx` をコピーして作る(オーバーレイ `z-[100]`、
  `bg-ink/60 backdrop-blur-sm`、カード `bg-surface rounded-2xl border border-paper-deep`)。
- **盤面(MapBoard)へのオーバーレイ追加は避ける**。タップ/ロングタップ/ドラッグ/ピンチの
  イベント競合が極めて繊細(2本指検知でロングタップタイマー破棄、ドラッグ閾値で
  クリックキャンセル等)。新機能はモーダル・クリア画面・メニューに隔離する。
- ボタン・トースト文言は全角20字以内目安。トーンは「知的だがカジュアル、絵文字OK」
  (実例: 「⛏️ 探索」「💡 今日のプチ雑学」)。

### AIエージェント運用(このプロジェクト特有)

- 外部AI(Gemini/ChatGPT/Claude)への指示文は `docs/multi-agent-prompts.json` v3 を使う。
  **v3 の最重要改善は「実型定義の埋め込み」**。v2 で型を渡さなかった結果、外部Claudeが
  存在しないAPI(`openedRegionsByMap`, `MAP_DEFINITIONS`)を幻覚した実害記録が
  `docs/research/claude-output-review.md` にある。プロンプトを更新したら実コードの型と同期させること。
- 市場調査の受領物は `docs/research/` に記録し、**証拠等級([確認済み]/[推定]/[不明])で
  仕分けてから採用判断**する。[推定]だけでロードマップを変えない。
- ChatGPT へのコピー依頼はスクショ4枚(`docs/research/screenshots/`)添付が必須。
  UI変更したら撮り直す(下記スクリプト)。

### 検証の作法

- 機能追加後は Playwright で実機検証する。使い捨てスクリプトの定石:
  - `playwright-core` を**一時的に** `npm i -D` → 検証 → **必ず `npm uninstall`**(依存を汚さない)
  - Chromium は `/opt/pw-browsers/chromium`、起動引数 `--no-proxy-server --no-sandbox --disable-dev-shm-usage`
    (サンドボックス環境ではプロキシが localhost を殺すため `--no-proxy-server` 必須)
  - Vite dev の初回アクセスはコンパイルで遅い。`page.setDefaultNavigationTimeout(60000)` +
    事前に curl でウォームアップ
  - メニューボタンの「メニュー」ラベルはモバイル幅で `hidden sm:inline`。
    セレクタは `getByText('≡')` を使う
  - クリア画面が要るときは dev 限定フック `window.__hakuchizuGame` で全安全マスを開けて
    **本物のクリア**を作る(モック画像を作らない)
- 計測データの検証は seed 用 JSON を localStorage に注入 → 画面表示と `hakuchizuStats()` の一致を確認。

---

## 10. 現在地とロードマップ(2026-07-07 時点)

**完了**: ローカル計測 / 開放コレクション画面(全体達成率・🏆・チップ+N畳み) /
プレイ統計画面 / 絵文字シェア(コレクション進捗バー同梱) / ランキング実装(凍結) /
AI指示文 v3 / 本番リリース(PR #1)

**待ち(外部入力)**:
- ChatGPT 採用セット(スクショ4枚+v3プロンプトで実行)→ i18n 仮文言の一斉差し替え
- Gemini v3 再調査 → retention_mechanics の[確認済み]証拠

**ゲート判定(2〜4週間後)**:
- テスターの `hakuchizuStats()` JSON を回収 → `docs/retention-metrics.md` §4 で判定
- 通過 → ランキング解禁(§6の手順) / 不通過 → コレクション強化+人気マップ(topMaps)への
  コンテンツ(雑学)追加に投資

**その先の候補**: プレイ統計のゲート判定ダッシュボード化、絵文字シェアのマップ形状版、
firebase の動的 import 化、useGame ソルバーのユニットテスト。

---

## 11. 最初の1時間でやるべきこと(新任者向け)

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # tsc + vite。これが通れば型は健全(約2分)
npx eslint src/        # 既存エラー約20件は仕様(§8-1)。増やさなければOK
```

1. 遊ぶ(初級で1クリア)→ メニューから開放コレクションとプレイ統計を開く
2. コンソールで `hakuchizuStats()` を実行し、計測データの形を見る
3. `docs/retention-metrics.md` を読む(このプロダクトの意思決定OSはこの文書)
4. `useGame.ts` を読む(ただし変更は最後の手段)
