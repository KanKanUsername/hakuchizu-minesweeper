# SKILL.md — 白地図マインスイーパ 引き継ぎ資料

> 対象: このリポジトリを引き継ぐ開発者(人間・AIエージェント問わず)。
> 目的: システム構成の選定理由、棄却済み代替案、運用の暗黙ルール、技術的負債を
> 「退職するシニアエンジニアの引き継ぎ」水準で残す。
> 最終更新: 2026-07-10(v3: P0-1/P1-1実装完了。実装検証で新たな事実誤認を2件発見・修正
> — 海上境界スクリプトの挙動誤記述はv2で修正済みだったが、firebaseがそもそも本番未到達の
> デッドコードだった件と、ESLint内訳の見落とし2件〈react-hooks/refs〉が今回判明)
>
> **この文書自身の運用ルール**: 記述は実コードで裏取りしてから書く(v1 は海上境界の
> 挙動と ESLint 件数を推測で書いて誤っていた — v2 で修正済み)。コードを変えたら
> 対応する節を同じPRで更新する。「たぶんこう」を書かず、確認できないことは
> 「未確認」と明記する。

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
| Tailwind CSS v4 | 高速なスタイリング、ダークモード | **生パレット(gray-500等)禁止**。プロジェクト固有トークンを使う: `bg-surface / bg-paper / bg-paper-deep / text-ink / text-ink-soft / border-line / border-paper-deep / bg-amber / text-danger / text-safe`。**定義は `src/index.css`**(`--theme-*` を Tailwind の `--color-*` にマップ)。ダークモードは `:root[data-theme="dark"]` で `--theme-*` を上書きする方式。色を足すときは index.css に `--theme-xxx` と `--color-xxx` の両方を追加 |
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
- `scripts/add_maritime_borders.cjs`: **海上境界の追加**(対象は `['WORLD', 'EUROPE']` のみ。
  **USA は対象外**)。「盤面が複数の島(連結成分)に分かれていると、島同士を跨ぐ推理ができず
  運ゲーになる」問題を解決する。アルゴリズムは、隣接グラフの連結成分をBFSで求め、
  成分が1つになるまで「component[0] と残り全体の間で**最も近い点ペア**を探して橋渡し(相互に
  隣接追加)」を貪欲に繰り返す(特定の国ペアをハードコードしているわけではない。性能のため
  各国の境界点は最大100点にサンプリング)。**孤島/連結性はゲーム性の根幹**なので、マップ追加時は
  必ずこのスクリプトを通し、隣接ゼロや複数連結成分が残らないか確認すること
  (`useGame.ts` は隣接ゼロセルに地雷を置かない防御もあるが、連結成分跨ぎの運ゲーは防げない)

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

## 8. 問題・改善バックログ(優先度付き)

深刻度(Sev)= ユーザー影響/リスクの大きさ、工数 = 目安。**上から着手する。**
バグ(壊れる可能性)を機能改善より上に置いている。

### P0 — 着手すべき(リスクが実在)

| # | 問題 | Sev | 工数 | 最初の一歩 |
| --- | --- | --- | --- | --- |
| P0-1 | ~~**No-Guess フォールバックの黙認**~~ **✅ 実装済み**: `isSolvable` が200回失敗した回数を `playStats.noGuessFallbacks[mapId]` に記録するようにした(`useGame.ts` の `placeMinesAsync` が `{ board, usedNoGuessFallback }` を返し、`openCell` が `recordNoGuessFallback(mapId)` を呼ぶ)。`getPlayStatsSummary()` に `noGuessFallbackTotal` / `noGuessFallbacksByMap` を追加し `hakuchizuStats()` から確認可能。**意図的にUIには出していない**(「No-Guess」はプレイヤーに見せる用語ではないため、既存のトーン規約に従いデータ層のみ)。次の一歩: テスターのエクスポートを集計し、頻度が高いマップがあれば試行上限を上げるか mine 率を動的に下げる。 | 高 | 中 | 完了 |
| P0-2 | **自動テストがゼロ**: 検証は使い捨て Playwright + 目視のみ。`useGame` のソルバー/BFS開放/クリア判定と `playStats` のマイグレーションは、壊れても誰も気づかない。 | 高 | 中 | Vitest を devDep に追加し、まず純関数の `isSolvable`(既知の盤面で solvable/unsolvable を assert)と `playStats` のマイグレーション(v1→将来 v2)から。UI は後回しでよい |
| P0-3 | **ベストタイムの二重管理**: `useGame` が `hakuchizu-best-*` を直接書き、`playStats.maps[].bestTimeSec` にも別経路で入る。ズレると「統計のベスト」と「クリア画面のベスト」が食い違う。特に片方だけ消えた/移行した端末で不整合。 | 中 | 中 | 単一の情報源(playStats 側)に寄せ、`hakuchizu-best-*` は読み取り時のフォールバックとして残す。移行コードを playStats マイグレーションに同梱 |

### P1 — やる価値が高い(費用対効果◎)

| # | 改善 | Sev | 工数 | 最初の一歩 |
| --- | --- | --- | --- | --- |
| P1-1 | ~~**firebase を動的 import 化**~~ **✅ 実装済み(ただし当初の根拠は誤りだった)**: 実装前に検証したところ、**現状 firebase は本番バンドルに一切含まれていなかった**(`RankingBoard`/`useRanking` が `App.tsx` から一度も import されておらず、到達不能なデッドコードだったため)。つまり「500KB超チャンクの主因」という当初の記述は事実誤認 — 実際の主因は**都道府県/地方のGeoJSONデータ**(`japan-*.js` が2.5MB、`R08`/`R02`/`USA` 等も1MB超。これらは既に `App.tsx` でマップ単位の動的importになっており、設計上は妥当)。それでも、**Phase 2でランキングを解禁した瞬間に firebase(firestore SDKだけで約567KB)が読み込まれるチャンクに同梱される**将来リスクは実在するため、`firebase.ts`/`rankingRepository.ts` を `await import('firebase/*')` 化する対応を先行実施し、`RankingBoard` を一時的に接続してビルド→firebaseが独立チャンク(`index.esm-*.js`)に分離され `index.html` の modulepreload にも入らないこと(=実際に使うまで読み込まれない)を確認した。 | 中 | 小 | 完了 |
| P1-2 | **ESLint ベースライン 23件**(error 22 + warning 1)。内訳の再検証で当初の記述に漏れが判明: `no-explicit-any` 16 / `set-state-in-effect` 4 / `exhaustive-deps` 1 に加えて **`react-hooks/refs` 2件を見落としていた**(P0-1の作業前から `useGame.ts` の dev限定フック `__hakuchizuGame` 実装に存在。`cellsRef.current = cells` をレンダー中に直接代入している箇所。実害は開発ビルドのみで本番には影響しないが、直すなら `useEffect` 内での代入に変更)。`App.tsx`/`MapBoard.tsx`/`useGame.ts` に分布。**lint はビルドゲート外**(`build` は tsc+vite のみ)なので気づかず増える。新規コードはクリーン維持の紳士協定のみが歯止め。 | 中 | 中 | 最大の `any`(16件)から。GeoJSON を `FeatureCollection<Geometry, {code:string; name:string; trivia?:string}>` で型付けすれば大半が消える。片付いたら CI に `npm run lint` を追加してリグレッションを止める |
| P1-3 | **CI が無い**: PR の型/ビルド/lint チェックが自動で走らない。壊れた PR が main=本番に直行しうる。 | 中 | 小 | GitHub Actions で `npm ci && npm run build`(+ P1-2 後に lint)。ビルドは約2分・Tailwind 生成が72%なのでキャッシュ必須 |

### P2 — 余裕があれば/外部入力待ち

| # | 改善 | Sev | 工数 | 最初の一歩 |
| --- | --- | --- | --- | --- |
| P2-1 | **i18n の仮文言**: コレクション/統計画面は ChatGPT 採用セット待ちのプレースホルダ(`collectionUnopened: 'まだ見ぬ土地'` 等)。**値のみ差し替え、キー名は変えない**。 | 低 | 小 | `docs/multi-agent-prompts.json` の chatgpt を実行 → `i18n_replacements` を i18n.ts に反映 |
| P2-2 | **未開放チップの言語追従が JAPAN のみ**: 他マップの地域名は `getMapName` 依存で、市区町村レベルの英語名が無い箇所がある。世界地図の英語圏展開時に表面化(が、日本集中方針なので今は低優先)。 | 低 | 中 | 英語圏に舵を切る判断が出てから。それまで着手しない(§7の方針) |
| P2-3 | **`hakuchizuStats()` の window 汚染**: テスター用に本番にも意図的に露出。将来的にゲート判定 UI(統計画面内のエクスポートボタン)へ移せば window を汚さずに済む。`__hakuchizuGame` は `import.meta.env.DEV` ガード済みで本番には出ない(問題なし)。 | 低 | 小 | StatsModal に「統計をコピー/共有」ボタンを追加し、window 関数は将来削除 |

> **運用メモ**: このバックログは「今わかっている」もの。P0-1 の頻度計測のように、
> **まず計測してから直す**のがこのプロジェクトの流儀(§6 のリテンションゲートと同じ思想)。

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

## 10. 現在地とロードマップ(2026-07-10 時点)

**完了**: ローカル計測 / 開放コレクション画面(全体達成率・🏆・チップ+N畳み) /
プレイ統計画面 / 絵文字シェア(コレクション進捗バー同梱) / ランキング実装(凍結) /
AI指示文 v3 / 本番リリース(PR #1) / No-Guessフォールバック頻度計測(P0-1) /
firebase 動的import化(P1-1)

**待ち(外部入力)**:
- ChatGPT 採用セット(スクショ4枚+v3プロンプトで実行)→ i18n 仮文言の一斉差し替え
- Gemini v3 再調査 → retention_mechanics の[確認済み]証拠

**ゲート判定(2〜4週間後)**:
- テスターの `hakuchizuStats()` JSON を回収 → `docs/retention-metrics.md` §4 で判定
  (`noGuessFallbackTotal` もあわせて確認し、運ゲー化の頻度が高いマップがないかチェック)
- 通過 → ランキング解禁(§6の手順) / 不通過 → コレクション強化+人気マップ(topMaps)への
  コンテンツ(雑学)追加に投資

**その先の候補**: プレイ統計のゲート判定ダッシュボード化、絵文字シェアのマップ形状版、
useGame ソルバーのユニットテスト(P0-2)、`japan-*.js`(2.5MB)など大型GeoJSONチャンクの
軽量化調査(precision削減 or trivia分離)。

---

## 11. 最初の1時間でやるべきこと(新任者向け)

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # tsc + vite。これが通れば型は健全(約2分)
npx eslint src/        # 既存23件(error22+warn1)はベースライン(§8 P1-2)。増やさなければOK
```

1. 遊ぶ(初級で1クリア)→ メニューから開放コレクションとプレイ統計を開く
2. コンソールで `hakuchizuStats()` を実行し、計測データの形を見る
3. `docs/retention-metrics.md` を読む(このプロダクトの意思決定OSはこの文書)
4. `useGame.ts` を読む(ただし変更は最後の手段)
