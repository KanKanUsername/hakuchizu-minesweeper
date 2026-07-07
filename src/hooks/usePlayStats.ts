import { getPlayStats, getPlayStatsSummary } from '../lib/playStats';
import type { PlayStatsSummary } from '../lib/playStats';
import type { Difficulty } from './useGame';

export interface MapStatRow {
  mapId: string;
  difficulty: Difficulty;
  plays: number;
  clears: number;
  bestTimeSec: number | null;
}

export interface PlayStatsView {
  summary: PlayStatsSummary;
  mapRows: MapStatRow[];
  hasAnyPlays: boolean;
}

function parseMapKey(key: string): { mapId: string; difficulty: Difficulty } {
  const idx = key.lastIndexOf(':');
  return {
    mapId: key.slice(0, idx),
    difficulty: key.slice(idx + 1) as Difficulty,
  };
}

export function usePlayStats(): PlayStatsView {
  const summary = getPlayStatsSummary();
  const stats = getPlayStats();

  const mapRows: MapStatRow[] = Object.entries(stats.maps)
    .map(([key, m]) => {
      const { mapId, difficulty } = parseMapKey(key);
      return { mapId, difficulty, plays: m.plays, clears: m.clears, bestTimeSec: m.bestTimeSec };
    })
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 10);

  return {
    summary,
    mapRows,
    hasAnyPlays: summary.totalPlays > 0,
  };
}
