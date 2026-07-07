import { getPlayStats } from '../lib/playStats';
import { PREFECTURES } from '../data/prefList';

export interface CollectionMapEntry {
  mapId: string;
  openedCount: number;
  totalCount: number | null;
  ratio: number | null;
}

export interface JapanCollection {
  openedCount: number;
  totalCount: number;
  unopened: { code: string; name: string; nameEn: string }[];
}

export interface CollectionOverall {
  openedCount: number;
  totalCount: number;
  ratio: number;
}

export interface CollectionData {
  japan: JapanCollection;
  maps: CollectionMapEntry[];
  overall: CollectionOverall;
  hasAnyProgress: boolean;
}

function staticTotal(mapId: string): number | null {
  if (mapId === 'JAPAN') return PREFECTURES.length;
  const pref = PREFECTURES.find(p => p.code === mapId);
  return pref ? pref.municipalityCount : null;
}

export function useCollection(): CollectionData {
  const stats = getPlayStats();

  const japanOpened = new Set(stats.openedCodes['JAPAN'] ?? []);
  const japan: JapanCollection = {
    openedCount: japanOpened.size,
    totalCount: PREFECTURES.length,
    unopened: PREFECTURES.filter(p => !japanOpened.has(p.code)).map(
      ({ code, name, nameEn }) => ({ code, name, nameEn }),
    ),
  };

  const maps: CollectionMapEntry[] = Object.entries(stats.openedCodes)
    .filter(([mapId]) => mapId !== 'JAPAN')
    .map(([mapId, codes]) => {
      const totalCount = stats.mapTotals[mapId] ?? staticTotal(mapId);
      return {
        mapId,
        openedCount: codes.length,
        totalCount,
        ratio: totalCount ? Math.min(1, codes.length / totalCount) : null,
      };
    })
    .sort((a, b) => b.openedCount - a.openedCount);

  const knownMaps = maps.filter(m => m.totalCount !== null);
  const overallOpened = japan.openedCount + knownMaps.reduce((sum, m) => sum + m.openedCount, 0);
  const overallTotal = japan.totalCount + knownMaps.reduce((sum, m) => sum + (m.totalCount ?? 0), 0);

  return {
    japan,
    maps,
    overall: {
      openedCount: overallOpened,
      totalCount: overallTotal,
      ratio: overallTotal > 0 ? overallOpened / overallTotal : 0,
    },
    hasAnyProgress: japanOpened.size > 0 || maps.length > 0,
  };
}
