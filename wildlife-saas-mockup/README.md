# ケモノガード — AI獣害対策SaaS UIモックアップ

農家・猟友会向けの獣害対策ダッシュボードのフロントエンドモックアップです。
単一ファイル（`WildlifeGuardApp.jsx`）で動作するSPAで、サイドバーから3画面を切り替えられます。

| 画面 | 内容 |
|---|---|
| ① 総合ダッシュボード | ライブステータス / 夜間警戒レベル / 本日のクイック統計 / リアルタイム速報（最新5件） |
| ② 検知履歴 | カメラID・動物種別・日付範囲フィルター / 履歴テーブル / 年月・動物種別指定のCSVダウンロード |
| ③ 分析レポート | 時間帯別・曜日別の検知頻度 / 滞在時間の週次推移（撃退慣れ警告付き） / 月次比較（季節バースト） / カメラ別レーダーチャート（罠設置支援） |

バックエンドAPIは開発中のため、データはすべてシード固定の擬似乱数で生成した
ダミーデータです（リロードしても同じ値になります）。CSVダウンロードは
ダミーデータから実際にBOM付きUTF-8のCSVを生成します（Excelで文字化けしません）。

## 必要パッケージ

```bash
npm install recharts lucide-react
```

Tailwind CSS（v3/v4どちらでも可）がセットアップ済みであることが前提です。

## 使い方

### Next.js（App Router）

```tsx
// app/page.tsx
import WildlifeGuardApp from "./WildlifeGuardApp";
export default function Page() {
  return <WildlifeGuardApp />;
}
```

ファイル先頭に `"use client"` を記載済みのため、そのままClient Componentとして動作します。

### Vite / CRA

```jsx
// src/main.jsx
import WildlifeGuardApp from "./WildlifeGuardApp";
createRoot(document.getElementById("root")).render(<WildlifeGuardApp />);
```
