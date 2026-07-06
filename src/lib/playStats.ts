import type { Difficulty } from '../hooks/useGame';

const STORAGE_KEY = 'hakuchizu-play-stats-v1';
const MAX_PLAY_DATES = 400;
const MAX_OPENED_CODES_PER_MAP = 5000;

export interface MapPlayStats {
  plays: number;
  clears: number;
  gameovers: number;
  totalTimeSec: number;
  bestTimeSec: number | null;
  lastPlayedAt: number;
}

export interface PlayStats {
  version: 1;
  firstPlayedAt: number | null;
  lastPlayedAt: number | null;
  playDates: string[];
  totals: { plays: number; clears: number; gameovers: number; totalTimeSec: number };
  maps: Record<string, MapPlayStats>;
  openedCodes: Record<string, string[]>;
}

export interface GameEndRecord {
  mapId: string;
  difficulty: Difficulty;
  result: 'cleared' | 'gameover';
  timeSec: number;
  openedCodes: string[];
}

export interface PlayStatsSummary {
  totalPlays: number;
  clearRate: number;
  avgTimeSec: number;
  activeDays: number;
  playedLast7Days: number;
  topMaps: { key: string; plays: number; clears: number }[];
  uniqueOpenedByMap: Record<string, number>;
}

function emptyStats(): PlayStats {
  return {
    version: 1,
    firstPlayedAt: null,
    lastPlayedAt: null,
    playDates: [],
    totals: { plays: 0, clears: 0, gameovers: 0, totalTimeSec: 0 },
    maps: {},
    openedCodes: {},
  };
}

export function getPlayStats(): PlayStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStats();
    const parsed = JSON.parse(raw) as PlayStats;
    if (parsed.version !== 1) return emptyStats();
    return parsed;
  } catch {
    return emptyStats();
  }
}

function save(stats: PlayStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // localStorage full or unavailable: measurement is best-effort
  }
}

function todayKey(now: Date): string {
  const y = now.getFullYear();
  const m = (now.getMonth() + 1).toString().padStart(2, '0');
  const d = now.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function recordGameEnd(record: GameEndRecord): void {
  const stats = getPlayStats();
  const now = Date.now();
  const mapKey = `${record.mapId}:${record.difficulty}`;

  stats.firstPlayedAt = stats.firstPlayedAt ?? now;
  stats.lastPlayedAt = now;

  const date = todayKey(new Date());
  if (!stats.playDates.includes(date)) {
    stats.playDates.push(date);
    if (stats.playDates.length > MAX_PLAY_DATES) {
      stats.playDates = stats.playDates.slice(-MAX_PLAY_DATES);
    }
  }

  stats.totals.plays += 1;
  stats.totals.totalTimeSec += record.timeSec;
  if (record.result === 'cleared') {
    stats.totals.clears += 1;
  } else {
    stats.totals.gameovers += 1;
  }

  const map = stats.maps[mapKey] ?? {
    plays: 0,
    clears: 0,
    gameovers: 0,
    totalTimeSec: 0,
    bestTimeSec: null,
    lastPlayedAt: 0,
  };
  map.plays += 1;
  map.totalTimeSec += record.timeSec;
  map.lastPlayedAt = now;
  if (record.result === 'cleared') {
    map.clears += 1;
    if (map.bestTimeSec === null || record.timeSec < map.bestTimeSec) {
      map.bestTimeSec = record.timeSec;
    }
  } else {
    map.gameovers += 1;
  }
  stats.maps[mapKey] = map;

  const opened = new Set(stats.openedCodes[record.mapId] ?? []);
  record.openedCodes.forEach(code => opened.add(code));
  stats.openedCodes[record.mapId] = [...opened].slice(0, MAX_OPENED_CODES_PER_MAP);

  save(stats);
}

export function getPlayStatsSummary(): PlayStatsSummary {
  const stats = getPlayStats();
  const now = new Date();
  const last7 = new Set<string>();
  for (let i = 0; i < 7; i++) {
    last7.add(todayKey(new Date(now.getTime() - i * 86400000)));
  }

  const topMaps = Object.entries(stats.maps)
    .map(([key, m]) => ({ key, plays: m.plays, clears: m.clears }))
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 10);

  const uniqueOpenedByMap: Record<string, number> = {};
  Object.entries(stats.openedCodes).forEach(([mapId, codes]) => {
    uniqueOpenedByMap[mapId] = codes.length;
  });

  return {
    totalPlays: stats.totals.plays,
    clearRate: stats.totals.plays > 0 ? stats.totals.clears / stats.totals.plays : 0,
    avgTimeSec: stats.totals.plays > 0 ? Math.round(stats.totals.totalTimeSec / stats.totals.plays) : 0,
    activeDays: stats.playDates.length,
    playedLast7Days: stats.playDates.filter(d => last7.has(d)).length,
    topMaps,
    uniqueOpenedByMap,
  };
}

export function exportPlayStats(): string {
  return JSON.stringify({ summary: getPlayStatsSummary(), raw: getPlayStats() }, null, 2);
}

declare global {
  interface Window {
    hakuchizuStats?: () => string;
  }
}

if (typeof window !== 'undefined') {
  window.hakuchizuStats = exportPlayStats;
}
