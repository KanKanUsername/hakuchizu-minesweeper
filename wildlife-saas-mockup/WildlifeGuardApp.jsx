"use client";

/**
 * AI獣害対策SaaS「ケモノガード」フロントエンドモックアップ
 *
 * 単一ファイルで動作するSPA。サイドバーで3画面を切り替えます。
 *   ① 総合ダッシュボード
 *   ② リアルタイム検知履歴（検索・CSVエクスポート）
 *   ③ 獣害データ分析レポート（罠設置支援）
 *
 * バックエンドAPI開発中のため、全データはシード固定の擬似乱数で
 * 生成したリアルなダミーデータです（リロードしても同じ値になります）。
 *
 * 依存パッケージ: react / recharts / lucide-react / Tailwind CSS
 */

import { useMemo, useState } from "react";
import {
  LayoutDashboard,
  History,
  BarChart3,
  Camera,
  Clock,
  PawPrint,
  AlertTriangle,
  Bell,
  Download,
  Moon,
  Activity,
  TrendingUp,
  MapPin,
  Siren,
  Search,
  Leaf,
  Target,
  CircleDot,
  ArrowUpDown,
  BatteryLow,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  LabelList,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

/* ------------------------------------------------------------------ */
/* カラーパレット（CVD検証済み・コントラスト重視）                        */
/* ------------------------------------------------------------------ */

const COLORS = {
  // 動物種別（カテゴリカル・固定割り当て）
  サル: "#2a78d6",
  イノシシ: "#1baf7a",
  シカ: "#eda100",
  ハクビシン: "#008300",
  // 状態色（警戒レベルなど・系列色とは別枠）
  critical: "#d03b3b",
  warning: "#fab219",
  serious: "#ec835a",
  good: "#0ca30c",
  // チャートの地色
  grid: "#e1e0d9",
  axisText: "#52514e",
  muted: "#898781",
  // 単一系列（数量）用の青ランプ
  seqLight: "#9ec5f4",
  seqMid: "#3987e5",
  seqDark: "#1c5cab",
};

const ANIMALS = ["サル", "イノシシ", "シカ", "ハクビシン"];
const CAMERAS = ["CAM-01", "CAM-02", "CAM-03", "CAM-04", "CAM-05", "CAM-06"];
const CAMERA_PLACES = {
  "CAM-01": "北側農道",
  "CAM-02": "果樹園 東",
  "CAM-03": "山際フェンス",
  "CAM-04": "水田 南",
  "CAM-05": "竹林入口",
  "CAM-06": "倉庫裏",
};
const ACTIONS = ["音声威嚇", "ライト点灯", "威嚇（音＋光）", "通知のみ"];

/* ------------------------------------------------------------------ */
/* ダミーデータ生成（シード固定でリロードしても同一）                     */
/* ------------------------------------------------------------------ */

function mulberry32(seed) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function generateLog() {
  const rand = mulberry32(20260707);
  const records = [];
  const start = new Date(2026, 4, 1); // 2026-05-01
  const DAYS = 68; // 5/1 〜 7/7

  const pickAnimal = () => {
    const r = rand();
    if (r < 0.34) return "イノシシ";
    if (r < 0.64) return "サル";
    if (r < 0.86) return "シカ";
    return "ハクビシン";
  };

  let id = 0;
  for (let d = 0; d < DAYS; d++) {
    const date = new Date(start);
    date.setDate(start.getDate() + d);
    const perDay = 1 + Math.floor(rand() * 4); // 1〜4件/日
    for (let i = 0; i < perDay; i++) {
      // 検知の約7割は夜間（18時〜翌4時）に集中させる
      const hour =
        rand() < 0.7
          ? [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4][Math.floor(rand() * 11)]
          : 5 + Math.floor(rand() * 13);
      const minute = Math.floor(rand() * 60);
      const animal = pickAnimal();
      const maxCount =
        animal === "サル"
          ? 1 + Math.floor(rand() * 11)
          : animal === "イノシシ"
            ? 1 + Math.floor(rand() * 5)
            : 1 + Math.floor(rand() * 3);
      id += 1;
      records.push({
        id: `DET-${String(id).padStart(4, "0")}`,
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hour,
        minute,
        dateKey: `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`,
        datetimeLabel: `${date.getFullYear()}/${pad2(date.getMonth() + 1)}/${pad2(date.getDate())} ${pad2(hour)}:${pad2(minute)}`,
        cameraId: CAMERAS[Math.floor(rand() * CAMERAS.length)],
        animal,
        maxCount,
        action: ACTIONS[Math.floor(rand() * ACTIONS.length)],
        staySec: 15 + Math.floor(rand() * 420),
      });
    }
  }
  records.sort((a, b) =>
    `${b.dateKey} ${pad2(b.hour)}:${pad2(b.minute)}` <
    `${a.dateKey} ${pad2(a.hour)}:${pad2(a.minute)}`
      ? -1
      : 1,
  );
  return records;
}

const DETECTION_LOG = generateLog();
const TODAY_KEY = "2026-07-07";
const TODAY_LABEL = "2026年7月7日（火）";
const LATEST = DETECTION_LOG[0];

/* 時間帯別集計（夜間/日中を色分け） */
const HOURLY_DATA = (() => {
  const bins = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    label: `${h}時`,
    検知数: 0,
    isNight: h >= 18 || h <= 4,
  }));
  DETECTION_LOG.forEach((r) => {
    bins[r.hour].検知数 += 1;
  });
  return bins;
})();

/* 曜日別集計 */
const WEEKDAY_DATA = (() => {
  const names = ["日", "月", "火", "水", "木", "金", "土"];
  const bins = names.map((n) => ({ label: n, 検知数: 0 }));
  DETECTION_LOG.forEach((r) => {
    const dow = new Date(r.year, r.month - 1, r.day).getDay();
    bins[dow].検知数 += 1;
  });
  return bins;
})();

/* 滞在時間の週次推移（撃退慣れ検知付き）
   Warn=true の点は「滞在時間が3週連続で増加＝撃退慣れの兆候」 */
const WEEKLY_STAY_DATA = [
  { week: "4/27週", サル: 34, イノシシ: 52 },
  { week: "5/4週", サル: 31, イノシシ: 48 },
  { week: "5/11週", サル: 38, イノシシ: 55 },
  { week: "5/18週", サル: 36, イノシシ: 61 },
  { week: "5/25週", サル: 44, イノシシ: 58 },
  { week: "6/1週", サル: 52, イノシシ: 64 },
  { week: "6/8週", サル: 61, イノシシ: 60, サルWarn: true },
  { week: "6/15週", サル: 75, イノシシ: 72, サルWarn: true },
  { week: "6/22週", サル: 88, イノシシ: 79, サルWarn: true },
  { week: "6/29週", サル: 96, イノシシ: 91, サルWarn: true, イノシシWarn: true },
  { week: "7/6週", サル: 104, イノシシ: 98, サルWarn: true, イノシシWarn: true },
];

/* 月次比較（前月比増減率と季節バースト） */
const MONTHLY_DATA = [
  { month: "2月", 検知数: 96, delta: null },
  { month: "3月", 検知数: 118, delta: 23 },
  { month: "4月", 検知数: 131, delta: 11 },
  { month: "5月", 検知数: 189, delta: 44, burst: true },
  { month: "6月", 検知数: 214, delta: 13 },
  { month: "7月", 検知数: 42, delta: null, partial: true },
];

/* カメラ別分析（罠設置支援）: 各指標は0〜100のリスクスコア */
const CAMERA_ANALYSIS = {
  "CAM-01": { 検知頻度: 55, 増加傾向: 40, 慣れ度: 30, 夜間比率: 72, 滞在時間: 45 },
  "CAM-02": { 検知頻度: 68, 増加傾向: 58, 慣れ度: 47, 夜間比率: 60, 滞在時間: 55 },
  "CAM-03": { 検知頻度: 88, 増加傾向: 81, 慣れ度: 79, 夜間比率: 92, 滞在時間: 84 },
  "CAM-04": { 検知頻度: 34, 増加傾向: 22, 慣れ度: 18, 夜間比率: 48, 滞在時間: 26 },
  "CAM-05": { 検知頻度: 74, 増加傾向: 66, 慣れ度: 61, 夜間比率: 81, 滞在時間: 70 },
  "CAM-06": { 検知頻度: 42, 増加傾向: 35, 慣れ度: 24, 夜間比率: 55, 滞在時間: 38 },
};

/* カメラ機器の稼働状態（電池残量%・電波強度0〜4・オンライン可否）
   現場の設置機器が正常に動いているかをひと目で把握するためのデータ */
const CAMERA_STATUS = {
  "CAM-01": { battery: 92, signal: 4, online: true },
  "CAM-02": { battery: 68, signal: 3, online: true },
  "CAM-03": { battery: 41, signal: 4, online: true },
  "CAM-04": { battery: 17, signal: 2, online: true }, // 電池残量わずか
  "CAM-05": { battery: 74, signal: 3, online: true },
  "CAM-06": { battery: 0, signal: 0, online: false }, // オフライン
};

/* ------------------------------------------------------------------ */
/* 共通UI部品                                                          */
/* ------------------------------------------------------------------ */

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function CardHeader({ icon: Icon, title, sub, right }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
      <div className="flex items-center gap-2.5">
        {Icon && <Icon className="h-5 w-5 shrink-0 text-emerald-700" aria-hidden />}
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          {sub && <p className="mt-0.5 text-sm text-gray-500">{sub}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

/** 夜間警戒レベルバッジ（高=赤 / 中=黄 / 低=青） */
function AlertLevelBadge({ level, large = false }) {
  const conf = {
    高: { bg: "bg-red-600", label: "警戒レベル：高" },
    中: { bg: "bg-amber-500", label: "警戒レベル：中" },
    低: { bg: "bg-blue-600", label: "警戒レベル：低" },
  }[level];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full font-bold text-white ${conf.bg} ${
        large ? "px-5 py-2.5 text-xl" : "px-3.5 py-1.5 text-base"
      }`}
    >
      <Siren className={large ? "h-6 w-6" : "h-4 w-4"} aria-hidden />
      {conf.label}
    </span>
  );
}

function AnimalChip({ animal }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-base font-semibold text-gray-800">
      <span
        className="h-3 w-3 rounded-full"
        style={{ backgroundColor: COLORS[animal] }}
        aria-hidden
      />
      {animal}
    </span>
  );
}

const CHART_TOOLTIP_STYLE = {
  backgroundColor: "#ffffff",
  border: "1px solid #e1e0d9",
  borderRadius: 8,
  fontSize: 14,
  color: "#0b0b0b",
};

/** 電池残量バッジ（20%未満=赤 / 50%未満=橙 / それ以上=緑、0=グレー） */
function BatteryBadge({ level, online }) {
  if (!online) {
    return (
      <span className="inline-flex items-center gap-1 text-base font-bold text-gray-400">
        <BatteryLow className="h-5 w-5" aria-hidden />
        —
      </span>
    );
  }
  const color =
    level < 20 ? COLORS.critical : level < 50 ? COLORS.serious : COLORS.good;
  return (
    <span
      className="inline-flex items-center gap-1 text-base font-bold tabular-nums"
      style={{ color }}
    >
      <BatteryLow className="h-5 w-5" aria-hidden />
      {level}%
    </span>
  );
}

/** 電波強度（0〜4本）を4本のバーで表示 */
function SignalBars({ level }) {
  return (
    <span className="inline-flex items-end gap-0.5" aria-label={`電波強度 ${level}/4`}>
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="w-1.5 rounded-sm"
          style={{
            height: `${i * 3 + 3}px`,
            backgroundColor: i <= level ? COLORS.good : "#d6d5cf",
          }}
        />
      ))}
    </span>
  );
}

/** 検知1件の詳細モーダル（履歴テーブルの行クリックで表示） */
function DetectionModal({ record, onClose }) {
  if (!record) return null;
  const status = CAMERA_STATUS[record.cameraId];
  const rows = [
    ["検知ID", record.id],
    ["検知日時", record.datetimeLabel],
    ["カメラID", `${record.cameraId}（${CAMERA_PLACES[record.cameraId]}）`],
    ["動物の種類", record.animal],
    ["最大同時検知頭数", `${record.maxCount} 頭`],
    ["実行アクション", record.action],
    ["滞在時間", `${record.staySec} 秒`],
    ["時間帯", record.hour >= 18 || record.hour <= 4 ? "夜間（18時〜翌4時）" : "日中（5時〜17時）"],
  ];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="検知詳細"
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between rounded-t-xl px-6 py-4 text-white"
          style={{ backgroundColor: COLORS[record.animal] }}
        >
          <div className="flex items-center gap-2.5">
            <PawPrint className="h-6 w-6" aria-hidden />
            <div>
              <p className="text-xl font-bold">{record.animal} を検知</p>
              <p className="text-sm opacity-90">{record.datetimeLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-white/20"
            aria-label="閉じる"
          >
            <X className="h-6 w-6" aria-hidden />
          </button>
        </div>
        <dl className="divide-y divide-gray-100 px-6 py-2">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 py-2.5">
              <dt className="text-base font-semibold text-gray-500">{k}</dt>
              <dd className="text-right text-base font-bold text-gray-900">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="flex items-center justify-between gap-4 border-t border-gray-100 bg-gray-50 px-6 py-3.5">
          <span className="text-base font-semibold text-gray-500">検知時の機器状態</span>
          <span className="flex items-center gap-4">
            <BatteryBadge level={status.battery} online={status.online} />
            <SignalBars level={status.signal} />
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-bold ${
                status.online
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {status.online ? "オンライン" : "オフライン"}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ① 総合ダッシュボード                                                */
/* ------------------------------------------------------------------ */

function DashboardScreen() {
  const todayRecords = DETECTION_LOG.filter((r) => r.dateKey === TODAY_KEY);
  const todayByAnimal = ANIMALS.map((a) => ({
    animal: a,
    count: todayRecords.filter((r) => r.animal === a).length,
  }));
  const recent5 = DETECTION_LOG.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* ライブステータス + 警戒レベル */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            icon={Activity}
            title="ライブステータス"
            sub="最新の検知情報とシステム稼働状況"
            right={
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-base font-bold text-emerald-800">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-600" />
                </span>
                システム稼働中
              </span>
            }
          />
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-500">
                <Camera className="h-4 w-4" aria-hidden />
                最新検知カメラ
              </p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {LATEST.cameraId}
              </p>
              <p className="mt-1 flex items-center gap-1 text-base text-gray-600">
                <MapPin className="h-4 w-4" aria-hidden />
                {CAMERA_PLACES[LATEST.cameraId]}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-500">
                <PawPrint className="h-4 w-4" aria-hidden />
                動物種別
              </p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {LATEST.animal}
              </p>
              <p className="mt-1 text-base text-gray-600">
                最大 {LATEST.maxCount} 頭を同時検知
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-500">
                <Clock className="h-4 w-4" aria-hidden />
                検知日時
              </p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {pad2(LATEST.hour)}:{pad2(LATEST.minute)}
              </p>
              <p className="mt-1 text-base text-gray-600">{LATEST.datetimeLabel}</p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader icon={Moon} title="夜間警戒レベル" sub="今夜の出没リスク予測" />
          <div className="flex flex-col items-center gap-4 p-6">
            <AlertLevelBadge level="高" large />
            <p className="text-center text-base leading-relaxed text-gray-700">
              直近3日間の夜間（18時〜翌4時）に
              <span className="font-bold text-red-700"> 12件 </span>
              の検知が発生。イノシシの活動が活発です。
            </p>
            <div className="flex w-full items-center justify-center gap-3 border-t border-gray-100 pt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-red-600" />高
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />中
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />低
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* 本日のクイック統計 */}
      <Card>
        <CardHeader
          icon={TrendingUp}
          title="本日のクイック統計"
          sub={`${TODAY_LABEL} の検知サマリー`}
        />
        <div className="grid grid-cols-2 gap-4 p-5 md:grid-cols-5">
          <div className="rounded-lg border-2 border-emerald-600 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-800">総検知数</p>
            <p className="mt-1 text-4xl font-bold tabular-nums text-emerald-900">
              {todayRecords.length}
              <span className="ml-1 text-lg font-semibold">件</span>
            </p>
          </div>
          {todayByAnimal.map(({ animal, count }) => (
            <div key={animal} className="rounded-lg border border-gray-200 p-4">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-500">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: COLORS[animal] }}
                  aria-hidden
                />
                {animal}
              </p>
              <p className="mt-1 text-4xl font-bold tabular-nums text-gray-900">
                {count}
                <span className="ml-1 text-lg font-semibold text-gray-500">件</span>
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* カメラ機器の稼働状態 */}
      <Card>
        <CardHeader
          icon={Camera}
          title="カメラ機器の稼働状態"
          sub="現場に設置した6台の電池残量・電波・オンライン状況"
          right={
            <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-base font-bold text-red-700">
              <AlertTriangle className="h-4 w-4" aria-hidden />
              要対応 2台
            </span>
          }
        />
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {CAMERAS.map((c) => {
            const s = CAMERA_STATUS[c];
            const alert = !s.online || s.battery < 20;
            return (
              <div
                key={c}
                className={`rounded-lg border-2 p-4 ${
                  alert ? "border-red-300 bg-red-50/60" : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-bold text-gray-900">{c}</p>
                    <p className="flex items-center gap-1 text-base text-gray-600">
                      <MapPin className="h-4 w-4" aria-hidden />
                      {CAMERA_PLACES[c]}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${
                      s.online
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        s.online ? "bg-emerald-600" : "bg-gray-400"
                      }`}
                    />
                    {s.online ? "オンライン" : "オフライン"}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                  <BatteryBadge level={s.battery} online={s.online} />
                  <span className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                    電波
                    <SignalBars level={s.signal} />
                  </span>
                </div>
                {alert && (
                  <p className="mt-2 flex items-center gap-1 text-sm font-bold text-red-700">
                    <AlertTriangle className="h-4 w-4" aria-hidden />
                    {!s.online ? "通信途絶：現地確認が必要です" : "電池残量わずか：交換をご検討ください"}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* リアルタイム速報 */}
      <Card>
        <CardHeader
          icon={Bell}
          title="リアルタイム速報"
          sub="最新5件の検知履歴"
        />
        <ul className="divide-y divide-gray-100 p-2">
          {recent5.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border-l-4 px-4 py-3.5 hover:bg-gray-50"
              style={{ borderLeftColor: COLORS[r.animal] }}
            >
              <span className="min-w-[7.5rem] text-lg font-bold tabular-nums text-gray-900">
                {r.month}/{r.day} {pad2(r.hour)}:{pad2(r.minute)}
              </span>
              <AnimalChip animal={r.animal} />
              <span className="inline-flex items-center gap-1 text-base text-gray-700">
                <Camera className="h-4 w-4 text-gray-400" aria-hidden />
                {r.cameraId}（{CAMERA_PLACES[r.cameraId]}）
              </span>
              <span className="text-base text-gray-700">
                最大 <b className="tabular-nums">{r.maxCount}</b> 頭
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-orange-50 px-2 py-0.5 text-base font-semibold text-orange-800">
                <Siren className="h-4 w-4" aria-hidden />
                {r.action}
              </span>
              <span className="ml-auto text-base text-gray-500">
                滞在 <b className="tabular-nums text-gray-700">{r.staySec}</b> 秒
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ② リアルタイム検知履歴                                               */
/* ------------------------------------------------------------------ */

function selectClass() {
  return "rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base font-medium text-gray-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200";
}

const PAGE_SIZE = 12;

function HistoryScreen() {
  const [cameraFilter, setCameraFilter] = useState("all");
  const [animalFilter, setAnimalFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [exportYear, setExportYear] = useState("2026");
  const [exportMonth, setExportMonth] = useState("6");
  const [exportAnimal, setExportAnimal] = useState("サル");

  // 並び替え・ページ・詳細モーダルの状態
  const [sortKey, setSortKey] = useState("datetime");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(
    () =>
      DETECTION_LOG.filter((r) => {
        if (cameraFilter !== "all" && r.cameraId !== cameraFilter) return false;
        if (animalFilter !== "all" && r.animal !== animalFilter) return false;
        if (dateFrom && r.dateKey < dateFrom) return false;
        if (dateTo && r.dateKey > dateTo) return false;
        return true;
      }),
    [cameraFilter, animalFilter, dateFrom, dateTo],
  );

  // フィルター条件が変わったら1ページ目に戻す
  const filterSig = `${cameraFilter}|${animalFilter}|${dateFrom}|${dateTo}`;
  const [lastSig, setLastSig] = useState(filterSig);
  if (filterSig !== lastSig) {
    setLastSig(filterSig);
    setPage(1);
  }

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    const val = (r) =>
      sortKey === "datetime"
        ? `${r.dateKey} ${pad2(r.hour)}:${pad2(r.minute)}`
        : sortKey === "camera"
          ? r.cameraId
          : sortKey === "animal"
            ? r.animal
            : sortKey === "count"
              ? r.maxCount
              : r.staySec;
    return [...filtered].sort((a, b) => {
      const va = val(a);
      const vb = val(b);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageClamped = Math.min(page, totalPages);
  const pageRows = sorted.slice(
    (pageClamped - 1) * PAGE_SIZE,
    pageClamped * PAGE_SIZE,
  );

  // フィルター結果のサマリー（総件数・のべ頭数・平均滞在時間）
  const summary = useMemo(() => {
    const totalHeads = filtered.reduce((s, r) => s + r.maxCount, 0);
    const avgStay = filtered.length
      ? Math.round(filtered.reduce((s, r) => s + r.staySec, 0) / filtered.length)
      : 0;
    return { count: filtered.length, totalHeads, avgStay };
  }, [filtered]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "datetime" ? "desc" : "asc");
    }
    setPage(1);
  };

  const handleExport = () => {
    const rows = DETECTION_LOG.filter(
      (r) =>
        String(r.year) === exportYear &&
        String(r.month) === exportMonth &&
        (exportAnimal === "all" || r.animal === exportAnimal),
    );
    const header = "検知日時,カメラID,動物の種類,最大同時検知頭数,実行アクション,滞在時間秒";
    const body = rows
      .map((r) =>
        [r.datetimeLabel, r.cameraId, r.animal, r.maxCount, r.action, r.staySec].join(","),
      )
      .join("\n");
    // Excelで文字化けしないようBOM付きUTF-8で出力
    const blob = new Blob(["﻿" + header + "\n" + body], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `検知履歴_${exportYear}年${exportMonth}月_${exportAnimal === "all" ? "全種別" : exportAnimal}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* 検索・絞り込み */}
      <Card>
        <CardHeader icon={Search} title="検索・絞り込み" sub="条件を指定して検知ログを検索" />
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-gray-600">カメラID</span>
            <select
              className={selectClass()}
              value={cameraFilter}
              onChange={(e) => setCameraFilter(e.target.value)}
            >
              <option value="all">すべてのカメラ</option>
              {CAMERAS.map((c) => (
                <option key={c} value={c}>
                  {c}（{CAMERA_PLACES[c]}）
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-gray-600">動物種別</span>
            <select
              className={selectClass()}
              value={animalFilter}
              onChange={(e) => setAnimalFilter(e.target.value)}
            >
              <option value="all">すべての動物</option>
              {ANIMALS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-gray-600">開始日</span>
            <input
              type="date"
              className={selectClass()}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-gray-600">終了日</span>
            <input
              type="date"
              className={selectClass()}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </label>
        </div>
      </Card>

      {/* 高機能エクスポート */}
      <Card>
        <CardHeader
          icon={Download}
          title="データエクスポート"
          sub="年月・動物種別を指定してCSVをダウンロード"
        />
        <div className="flex flex-wrap items-end gap-4 p-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-gray-600">年</span>
            <select
              className={selectClass()}
              value={exportYear}
              onChange={(e) => setExportYear(e.target.value)}
            >
              <option value="2025">2025年</option>
              <option value="2026">2026年</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-gray-600">月</span>
            <select
              className={selectClass()}
              value={exportMonth}
              onChange={(e) => setExportMonth(e.target.value)}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={String(i + 1)}>
                  {i + 1}月
                </option>
              ))}
            </select>
          </label>
          <fieldset className="flex flex-col gap-1.5">
            <legend className="text-sm font-bold text-gray-600">動物種別</legend>
            <div className="flex gap-2 rounded-lg border border-gray-300 bg-white p-1.5">
              {["サル", "イノシシ", "all"].map((a) => (
                <label
                  key={a}
                  className={`cursor-pointer rounded-md px-4 py-1.5 text-base font-bold ${
                    exportAnimal === a
                      ? "bg-emerald-700 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <input
                    type="radio"
                    name="exportAnimal"
                    value={a}
                    checked={exportAnimal === a}
                    onChange={() => setExportAnimal(a)}
                    className="sr-only"
                  />
                  {a === "all" ? "全種別" : a}
                </label>
              ))}
            </div>
          </fieldset>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-6 py-3 text-lg font-bold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            <Download className="h-5 w-5" aria-hidden />
            CSVダウンロード
          </button>
        </div>
      </Card>

      {/* フィルター結果のサマリー */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-500">
            <History className="h-4 w-4" aria-hidden />
            該当検知件数
          </p>
          <p className="mt-1 text-4xl font-bold tabular-nums text-gray-900">
            {summary.count}
            <span className="ml-1 text-lg font-semibold text-gray-500">件</span>
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-500">
            <PawPrint className="h-4 w-4" aria-hidden />
            のべ検知頭数
          </p>
          <p className="mt-1 text-4xl font-bold tabular-nums text-gray-900">
            {summary.totalHeads}
            <span className="ml-1 text-lg font-semibold text-gray-500">頭</span>
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-500">
            <Clock className="h-4 w-4" aria-hidden />
            平均滞在時間
          </p>
          <p className="mt-1 text-4xl font-bold tabular-nums text-gray-900">
            {summary.avgStay}
            <span className="ml-1 text-lg font-semibold text-gray-500">秒</span>
          </p>
        </div>
      </div>

      {/* 履歴データテーブル */}
      <Card>
        <CardHeader
          icon={History}
          title="検知履歴一覧"
          sub="列見出しで並び替え・行クリックで詳細表示"
          right={
            <span className="text-base text-gray-500">
              全 <b className="tabular-nums text-gray-700">{sorted.length}</b> 件
            </span>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50 text-base text-gray-600">
                <SortableTh label="検知日時" col="datetime" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableTh label="カメラID" col="camera" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableTh label="動物の種類" col="animal" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableTh label="最大同時検知頭数" col="count" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="right" />
                <th className="px-5 py-3 font-bold">実行アクション</th>
                <SortableTh label="滞在時間（秒）" col="stay" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="right" />
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r, i) => (
                <tr
                  key={r.id}
                  onClick={() => setSelected(r)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelected(r);
                    }
                  }}
                  className={`cursor-pointer border-b border-gray-100 text-base text-gray-800 ${
                    i % 2 === 1 ? "bg-gray-50/60" : ""
                  } hover:bg-emerald-50/60 focus:bg-emerald-50 focus:outline-none`}
                >
                  <td className="px-5 py-3 font-medium tabular-nums">
                    {r.datetimeLabel}
                  </td>
                  <td className="px-5 py-3">
                    {r.cameraId}
                    <span className="ml-1 text-sm text-gray-500">
                      {CAMERA_PLACES[r.cameraId]}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <AnimalChip animal={r.animal} />
                  </td>
                  <td className="px-5 py-3 text-right font-bold tabular-nums">
                    {r.maxCount}
                  </td>
                  <td className="px-5 py-3">{r.action}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{r.staySec}</td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-base text-gray-500">
                    条件に一致する検知履歴はありません。フィルターを変更してください。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ページネーション */}
        {sorted.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-3.5">
            <p className="text-base text-gray-500">
              {(pageClamped - 1) * PAGE_SIZE + 1}〜
              {Math.min(pageClamped * PAGE_SIZE, sorted.length)} 件目 / 全{" "}
              {sorted.length} 件
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pageClamped <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-base font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden />
                前へ
              </button>
              <span className="px-3 text-base font-bold tabular-nums text-gray-700">
                {pageClamped} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={pageClamped >= totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-base font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                次へ
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </div>
        )}
      </Card>

      <DetectionModal record={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

/** 並び替え可能なテーブル見出しセル */
function SortableTh({ label, col, sortKey, sortDir, onSort, align = "left" }) {
  const active = sortKey === col;
  return (
    <th className={`px-5 py-3 font-bold ${align === "right" ? "text-right" : ""}`}>
      <button
        type="button"
        onClick={() => onSort(col)}
        className={`inline-flex items-center gap-1 font-bold hover:text-emerald-700 ${
          active ? "text-emerald-700" : "text-gray-600"
        } ${align === "right" ? "flex-row-reverse" : ""}`}
      >
        {label}
        {active ? (
          sortDir === "asc" ? (
            <ChevronRight className="h-4 w-4 -rotate-90" aria-label="昇順" />
          ) : (
            <ChevronRight className="h-4 w-4 rotate-90" aria-label="降順" />
          )
        ) : (
          <ArrowUpDown className="h-4 w-4 text-gray-400" aria-hidden />
        )}
      </button>
    </th>
  );
}

/* ------------------------------------------------------------------ */
/* ③ 獣害データ分析レポート                                             */
/* ------------------------------------------------------------------ */

/** 撃退慣れの警告ドット（3週連続で滞在時間が増加した点を赤く強調） */
function HabituationDot(props) {
  const { cx, cy, payload, dataKey, stroke, index } = props;
  if (cx == null || cy == null) return null;
  const warn = payload[`${dataKey}Warn`];
  if (warn) {
    return (
      <g key={`dot-${dataKey}-${index}`}>
        <circle cx={cx} cy={cy} r={8} fill={COLORS.critical} stroke="#ffffff" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={3} fill="#ffffff" />
      </g>
    );
  }
  return (
    <circle
      key={`dot-${dataKey}-${index}`}
      cx={cx}
      cy={cy}
      r={3.5}
      fill={stroke}
      stroke="#ffffff"
      strokeWidth={1.5}
    />
  );
}

/** 前月比の増減率ラベル（増加=赤 / 減少=緑） */
function DeltaLabel(props) {
  const { x, y, width, index } = props;
  const d = MONTHLY_DATA[index];
  if (d.delta == null) {
    return d.partial ? (
      <text
        x={x + width / 2}
        y={y - 8}
        textAnchor="middle"
        fontSize={13}
        fill={COLORS.muted}
      >
        集計中
      </text>
    ) : null;
  }
  const up = d.delta >= 0;
  return (
    <text
      x={x + width / 2}
      y={y - 8}
      textAnchor="middle"
      fontSize={14}
      fontWeight={700}
      fill={up ? COLORS.critical : "#006300"}
    >
      {up ? `+${d.delta}%` : `${d.delta}%`}
    </text>
  );
}

function RiskBar({ label, value }) {
  const color =
    value >= 70 ? COLORS.critical : value >= 45 ? COLORS.serious : COLORS.good;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-base">
        <span className="font-bold text-gray-700">{label}</span>
        <span className="font-bold tabular-nums" style={{ color }}>
          {value}
          <span className="text-sm font-semibold text-gray-500"> /100</span>
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full"
          style={{ width: `${value}%`, backgroundColor: color }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        />
      </div>
    </div>
  );
}

function AnalysisScreen() {
  const [selectedCamera, setSelectedCamera] = useState("CAM-03");
  const metrics = CAMERA_ANALYSIS[selectedCamera];
  const radarData = Object.entries(metrics).map(([axis, value]) => ({
    axis,
    value,
  }));
  const trapScore = Math.round(
    (metrics.検知頻度 + metrics.増加傾向 + metrics.慣れ度) / 3,
  );
  const trapLevel = trapScore >= 70 ? "高" : trapScore >= 45 ? "中" : "低";
  const trapColor =
    trapScore >= 70 ? COLORS.critical : trapScore >= 45 ? COLORS.serious : COLORS.good;

  return (
    <div className="space-y-6">
      {/* 検知頻度グラフ（時間帯別・曜日別） */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            icon={Clock}
            title="時間帯別の検知頻度"
            sub="過去約2ヶ月・夜間（18時〜翌4時）を濃色で表示"
          />
          <div className="p-5">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={HOURLY_DATA} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke={COLORS.grid} vertical={false} />
                  <XAxis
                    dataKey="label"
                    interval={2}
                    tick={{ fontSize: 13, fill: COLORS.axisText }}
                    axisLine={{ stroke: COLORS.grid }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 13, fill: COLORS.axisText }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    cursor={{ fill: "rgba(0,0,0,0.04)" }}
                    formatter={(v) => [`${v} 件`, "検知数"]}
                  />
                  <Bar dataKey="検知数" radius={[4, 4, 0, 0]}>
                    {HOURLY_DATA.map((d) => (
                      <Cell
                        key={d.hour}
                        fill={d.isNight ? COLORS.seqDark : COLORS.seqLight}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex items-center gap-5 text-sm text-gray-600">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: COLORS.seqDark }} />
                夜間（18〜4時）
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: COLORS.seqLight }} />
                日中（5〜17時）
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader icon={BarChart3} title="曜日別の検知頻度" sub="過去約2ヶ月の合計" />
          <div className="p-5">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={WEEKDAY_DATA} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke={COLORS.grid} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 14, fill: COLORS.axisText }}
                    axisLine={{ stroke: COLORS.grid }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 13, fill: COLORS.axisText }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    cursor={{ fill: "rgba(0,0,0,0.04)" }}
                    formatter={(v) => [`${v} 件`, "検知数"]}
                  />
                  <Bar dataKey="検知数" fill={COLORS.seqMid} radius={[4, 4, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              棒にカーソルを合わせると件数を表示します
            </p>
          </div>
        </Card>
      </div>

      {/* 滞在時間の週次推移（撃退慣れ検知） */}
      <Card>
        <CardHeader
          icon={AlertTriangle}
          title="滞在時間の週次推移（撃退慣れ分析）"
          sub="平均滞在時間（秒）の推移。赤い点は撃退慣れの兆候"
          right={
            <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3.5 py-1.5 text-base font-bold text-red-700">
              <AlertTriangle className="h-4 w-4" aria-hidden />
              撃退慣れの兆候あり
            </span>
          }
        />
        <div className="p-5">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={WEEKLY_STAY_DATA}
                margin={{ top: 12, right: 16, left: -8, bottom: 0 }}
              >
                <CartesianGrid stroke={COLORS.grid} vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 13, fill: COLORS.axisText }}
                  axisLine={{ stroke: COLORS.grid }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 13, fill: COLORS.axisText }}
                  axisLine={false}
                  tickLine={false}
                  unit="秒"
                />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  formatter={(v, name) => [`${v} 秒`, name]}
                />
                <Legend
                  wrapperStyle={{ fontSize: 15, paddingTop: 8 }}
                  iconType="plainline"
                />
                <Line
                  type="monotone"
                  dataKey="サル"
                  stroke={COLORS.サル}
                  strokeWidth={2.5}
                  dot={<HabituationDot />}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="イノシシ"
                  stroke={COLORS.イノシシ}
                  strokeWidth={2.5}
                  dot={<HabituationDot />}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
            <p className="text-base leading-relaxed text-red-900">
              <b className="text-red-700">赤い点</b>
              は滞在時間が3週連続で増加した「撃退慣れ」の兆候です。
              サルは6月上旬から、イノシシは6月末から威嚇への反応が鈍化しています。
              威嚇パターンの変更、または罠の設置をご検討ください。
            </p>
          </div>
        </div>
      </Card>

      {/* 月次比較 */}
      <Card>
        <CardHeader
          icon={TrendingUp}
          title="月次比較（前月比・季節バースト）"
          sub="月間検知数と前月比増減率。オレンジは季節バースト（急増）月"
        />
        <div className="p-5">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_DATA} margin={{ top: 28, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={COLORS.grid} vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 14, fill: COLORS.axisText }}
                  axisLine={{ stroke: COLORS.grid }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 13, fill: COLORS.axisText }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  formatter={(v) => [`${v} 件`, "月間検知数"]}
                />
                <Bar dataKey="検知数" radius={[4, 4, 0, 0]} barSize={48}>
                  {MONTHLY_DATA.map((d) => (
                    <Cell
                      key={d.month}
                      fill={
                        d.burst
                          ? "#eb6834"
                          : d.partial
                            ? COLORS.seqLight
                            : COLORS.seqMid
                      }
                    />
                  ))}
                  <LabelList content={<DeltaLabel />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-5 text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: COLORS.seqMid }} />
              月間検知数
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: "#eb6834" }} />
              季節バースト（前月比+40%以上）
            </span>
            <span className="text-gray-500">
              ※ 数値ラベルは前月比増減率（<span className="font-bold text-red-700">赤=増加</span>／
              <span className="font-bold" style={{ color: "#006300" }}>緑=減少</span>）
            </span>
          </div>
        </div>
      </Card>

      {/* カメラ詳細分析（罠設置支援） */}
      <Card>
        <CardHeader
          icon={Target}
          title="カメラ詳細分析（罠設置支援）"
          sub="カメラを選択して「頻度」「増加傾向」「慣れ」を確認"
        />
        <div className="p-5">
          <div className="mb-5 flex flex-wrap gap-2">
            {CAMERAS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCamera(c)}
                className={`rounded-lg border-2 px-4 py-2 text-base font-bold transition ${
                  selectedCamera === c
                    ? "border-emerald-700 bg-emerald-700 text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:border-emerald-600 hover:text-emerald-700"
                }`}
              >
                {c}
                <span className="ml-1 hidden text-sm font-semibold sm:inline">
                  {CAMERA_PLACES[c]}
                </span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="h-80 rounded-lg bg-gray-50 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="72%">
                  <PolarGrid stroke={COLORS.grid} />
                  <PolarAngleAxis
                    dataKey="axis"
                    tick={{ fontSize: 14, fill: COLORS.axisText, fontWeight: 700 }}
                  />
                  <PolarRadiusAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: COLORS.muted }}
                    axisLine={false}
                  />
                  <Radar
                    name={selectedCamera}
                    dataKey="value"
                    stroke={COLORS.seqMid}
                    strokeWidth={2}
                    fill={COLORS.seqMid}
                    fillOpacity={0.3}
                  />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    formatter={(v) => [`${v} /100`, "リスクスコア"]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-col gap-5">
              <div className="space-y-4">
                <RiskBar label="検知頻度" value={metrics.検知頻度} />
                <RiskBar label="増加傾向" value={metrics.増加傾向} />
                <RiskBar label="撃退慣れ度" value={metrics.慣れ度} />
              </div>

              <div
                className="rounded-lg border-2 p-5"
                style={{ borderColor: trapColor, backgroundColor: `${trapColor}12` }}
              >
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 text-lg font-bold text-gray-900">
                    <CircleDot className="h-5 w-5" style={{ color: trapColor }} aria-hidden />
                    罠設置推奨度
                  </p>
                  <span
                    className="rounded-full px-4 py-1.5 text-xl font-bold text-white"
                    style={{ backgroundColor: trapColor }}
                  >
                    {trapLevel}（{trapScore}点）
                  </span>
                </div>
                <p className="mt-3 text-base leading-relaxed text-gray-800">
                  {trapScore >= 70 ? (
                    <>
                      <b>{selectedCamera}（{CAMERA_PLACES[selectedCamera]}）</b>
                      は検知頻度・撃退慣れともに高水準です。威嚇装置の効果が低下しているため、
                      獣道の交差点付近への<b className="text-red-700">箱罠・くくり罠の設置を強く推奨</b>します。
                    </>
                  ) : trapScore >= 45 ? (
                    <>
                      <b>{selectedCamera}（{CAMERA_PLACES[selectedCamera]}）</b>
                      は増加傾向が見られます。今後2週間の推移を注視し、
                      慣れ度が70を超えた場合は罠の設置を検討してください。
                    </>
                  ) : (
                    <>
                      <b>{selectedCamera}（{CAMERA_PLACES[selectedCamera]}）</b>
                      は現在のところ威嚇装置が有効に機能しています。罠の優先度は低めです。
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ルート：サイドバー + 画面切り替え                                     */
/* ------------------------------------------------------------------ */

const PAGES = [
  { key: "dashboard", label: "総合ダッシュボード", icon: LayoutDashboard },
  { key: "history", label: "検知履歴", icon: History },
  { key: "analysis", label: "分析レポート", icon: BarChart3 },
];

export default function WildlifeGuardApp() {
  const [page, setPage] = useState("dashboard");
  const current = PAGES.find((p) => p.key === page);

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900 antialiased">
      {/* サイドバー */}
      <aside className="flex w-20 shrink-0 flex-col bg-emerald-950 text-white lg:w-72">
        <div className="flex items-center gap-3 border-b border-emerald-900 px-4 py-5 lg:px-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600">
            <Leaf className="h-6 w-6" aria-hidden />
          </span>
          <div className="hidden lg:block">
            <p className="text-xl font-bold leading-tight">ケモノガード</p>
            <p className="text-sm text-emerald-300">AI獣害対策クラウド</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 p-3">
          {PAGES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setPage(key)}
              aria-current={page === key ? "page" : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3.5 text-lg font-bold transition lg:px-4 ${
                page === key
                  ? "bg-emerald-700 text-white shadow"
                  : "text-emerald-100 hover:bg-emerald-900 hover:text-white"
              }`}
            >
              <Icon className="h-6 w-6 shrink-0" aria-hidden />
              <span className="hidden lg:inline">{label}</span>
            </button>
          ))}
        </nav>

        <div className="hidden border-t border-emerald-900 p-5 text-sm leading-relaxed text-emerald-300 lg:block">
          <p className="flex items-center gap-2 font-bold text-emerald-200">
            <Activity className="h-4 w-4" aria-hidden />
            カメラ6台 稼働中
          </p>
          <p className="mt-1">最終同期：{TODAY_LABEL} 05:00</p>
        </div>
      </aside>

      {/* メイン */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{current.label}</h1>
            <p className="text-base text-gray-500">{TODAY_LABEL}</p>
          </div>
          <div className="flex items-center gap-4">
            <AlertLevelBadge level="高" />
            <button
              type="button"
              className="relative rounded-full border border-gray-200 bg-white p-2.5 text-gray-600 hover:bg-gray-50"
              aria-label="通知"
            >
              <Bell className="h-6 w-6" aria-hidden />
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                3
              </span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-6">
          {page === "dashboard" && <DashboardScreen />}
          {page === "history" && <HistoryScreen />}
          {page === "analysis" && <AnalysisScreen />}
        </main>

        <footer className="border-t border-gray-200 bg-white px-6 py-3 text-sm text-gray-400">
          ケモノガード — AI獣害対策SaaS（UIモックアップ / ダミーデータ表示中）
        </footer>
      </div>
    </div>
  );
}
