# グローバルランキング機能 技術要件定義書

対象: 白地図マインスイーパ / 次期機能「タイムアタックのグローバルランキング」

> **ステータス: Phase 2(保留)** — premortem レビューにより、ランキングがリテンション向上要因である
> ことは未検証と判断。先にローカル計測(`src/lib/playStats.ts`)で「翌日戻ってくる理由」を検証し、
> `docs/retention-metrics.md` §4 の判断ゲートを満たした場合のみ本機能を有効化する。
> コードは疎結合モジュールとして実装済みだが、環境変数未設定のため本番では無効(UIは表示されない)。
> 匿名表示名の重複対応(UID下4桁の併記)と読み取り回数の再見積もりを有効化前に行うこと。

> **前提と仮定**: 本書は前工程(市場調査サマリー・コピー採用セット)の成果物が未着の状態で作成している。
> そのため以下の一般的な仮定を置く。
> - 差別化仮定: 「実在地図×マインスイーパ」は競合が薄く、リテンション向上にはスコア比較(ランキング)が有効。
> - コピー仮定: UI文言は既存の i18n (`src/i18n.ts`) のトーン(短く・カジュアル・絵文字許容)を踏襲する。
> 前工程の成果物が届き次第、表示名ポリシーやCTA文言を差し替える。

## 1. 機能要件

| ID | 要件 |
| --- | --- |
| F-1 | クリア時に「マップID(`prefCode`)×難易度」ごとのタイム(秒)をランキングへ送信できる |
| F-2 | ランキングはマップ別・難易度別に上位N件(既定20件)を閲覧できる |
| F-3 | ユーザーは匿名(Firebase Anonymous Auth)。表示名は送信時に入力するニックネーム(1〜20文字) |
| F-4 | 自己ベストのみ保持する(同一ユーザー×マップ×難易度で1レコード。より速いタイムのみ上書き) |
| F-5 | 送信後に自分の順位(自分より速い記録数+1)を表示する |
| F-6 | Firebase 未設定環境(環境変数なし)ではランキングUIを表示せず、ゲーム本体は従来どおり動作する |

## 2. 非機能要件

- **無料枠見積もり (Spark)**: Firestore 無料枠は読み取り5万/日・書き込み2万/日。
  - 閲覧1回 = 最大N(20)読み取り + 順位取得は集計クエリ(`getCountFromServer`)で1読み取り扱い。
  - 1日あたり約2,300回のランキング閲覧まで無料枠内(読み取り換算)。現状のトラフィック規模では十分。
  - 超過リスクが出た段階で、上位N件を1ドキュメントに非正規化したスナップショット方式へ移行する。
- **チート対策(現実的な範囲)**: クライアント完結型のため完全防止は不可能。緩和策として
  (1) セキュリティルールでスキーマ・値域(1秒〜86400秒)・本人ドキュメントのみ書き込み可を強制、
  (2) 自己ベスト更新時のみ update 許可(タイム改悪・改ざんの抑止)、
  (3) 表示名の文字数制限。サーバー検証(Cloud Functions)は有料化しない範囲で将来検討。
- **個人情報**: 収集するのはニックネームと匿名UIDのみ。メール・実名は扱わない。ニックネームに個人情報を入れないよう注記を表示する。

## 3. データモデル (Firestore)

コレクション: `scores`
ドキュメントID: `{uid}_{mapId}_{difficulty}` (1ユーザー1記録を構造的に保証)

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `uid` | string | 匿名認証のUID |
| `name` | string | 表示名 (1〜20文字) |
| `mapId` | string | マップ識別子 (`prefCode` と同一体系。全国=`japan` 等) |
| `difficulty` | string | `easy` / `normal` / `hard` / `extreme` |
| `timeSec` | number(int) | クリアタイム秒 |
| `createdAt` | timestamp | サーバー時刻 |

必要な複合インデックス: `scores(mapId ASC, difficulty ASC, timeSec ASC)`

## 4. セキュリティルールの方針

- read: 全公開(ランキングは公開情報のみ)
- create: 認証済み、かつ `uid` = 自分のUID、かつドキュメントIDが `{uid}_{mapId}_{difficulty}` に一致、かつスキーマ・値域検証を通過
- update: 上記に加え「新タイム < 既存タイム」のときのみ許可
- delete: 不可

実体は `firestore.rules` を参照。

## 5. アーキテクチャ比較と判断

| 候補 | 無料枠 | 実装コスト | 判断 |
| --- | --- | --- | --- |
| **Firebase (Firestore + Anonymous Auth)** ← 採用 | 読5万/日・書2万/日、匿名認証無制限 | SDKのみでサーバー不要。集計クエリで順位取得も1クエリ | クライアント完結・匿名認証・順位集計の3要件を無料で満たす唯一の構成 |
| Supabase | 500MB DB・月5万MAU | RLS+RPC実装が必要。匿名認証は別途設定 | 高機能だが本件には過剰。無料枠は1週間非アクティブで一時停止のリスク |
| Vercel KV / Postgres | KVは従量、Hobbyは制限が厳しい | API Route(サーバーコード)の追加が必要 | 「バックエンドなし」の現行構成を崩すため不採用 |

## 6. 実装ファイル(第一歩・本コミットに含む)

- `src/lib/firebase.ts` — 初期化。設定は `VITE_FIREBASE_*` 環境変数から。未設定なら `isRankingEnabled = false`
- `src/types/ranking.ts` — 型定義
- `src/lib/rankingRepository.ts` — スコア送信・上位N件取得・自己順位取得 (Firestore modular API)
- `src/hooks/useRanking.ts` — ローディング/エラー状態つきフック
- `src/components/RankingBoard.tsx` — ランキング一覧+登録フォーム (Tailwind, `dark:` 対応)
- `firestore.rules` — セキュリティルール
- `.env.example` — 必要な環境変数の雛形
- `src/i18n.ts` — ランキング用文言キーの追加(既存キーは不変更)

### 統合ポイント(既存ロジックは未改変)

クリア画面(`src/App.tsx` の `status === 'cleared'` オーバーレイ内)に以下を1行追加するだけで組み込める:

```tsx
<RankingBoard mapId={prefCode ?? 'japan'} difficulty={difficulty} myTimeSec={time} language={language} />
```

## 7. 導入手順

1. `npm install firebase` (本ブランチで導入済み)
2. [Firebase コンソール](https://console.firebase.google.com/)でプロジェクト作成 → Webアプリ追加 → 表示された設定値を控える
3. Authentication → ログイン方法 → 「匿名」を有効化
4. Firestore Database を本番モードで作成 → `firestore.rules` の内容をルールに貼り付けて公開
5. インデックス作成: `scores` に複合インデックス `(mapId ASC, difficulty ASC, timeSec ASC)`(初回クエリ実行時のエラーメッセージのリンクからでも作成可)
6. ローカル: `.env.example` を `.env.local` にコピーし設定値を記入
7. Vercel: Project Settings → Environment Variables に同じ `VITE_FIREBASE_*` を登録して再デプロイ

## 8. 次のイテレーション提案

1. クリア画面への `RankingBoard` 組み込みと実機QA(スマホでの入力体験)
2. 上位スナップショットの非正規化(読み取り回数の削減、無料枠の余裕拡大)
3. プレイ履歴・学習進捗の可視化(ローカル保存から着手し、同じ匿名UIDでFirestoreに拡張)
