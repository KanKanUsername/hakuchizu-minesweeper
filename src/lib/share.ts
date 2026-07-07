import { getPlayStats } from './playStats';
import { PREFECTURES } from '../data/prefList';
import { t, type Language } from '../i18n';

const BAR_SEGMENTS = 10;

function staticTotal(mapId: string): number | null {
  if (mapId === 'JAPAN') return PREFECTURES.length;
  const pref = PREFECTURES.find(p => p.code === mapId);
  return pref ? pref.municipalityCount : null;
}

export interface CollectionProgress {
  opened: number;
  total: number | null;
}

export function getCollectionProgress(mapId: string): CollectionProgress {
  const stats = getPlayStats();
  const opened = (stats.openedCodes[mapId] ?? []).length;
  const total = stats.mapTotals[mapId] ?? staticTotal(mapId);
  return { opened, total };
}

export function buildEmojiBar(ratio: number, segments: number = BAR_SEGMENTS): string {
  const clamped = Math.max(0, Math.min(1, ratio));
  const filled = Math.floor(clamped * segments);
  const hasPartial = filled < segments && clamped * segments - filled >= 0.5;
  let bar = '';
  for (let i = 0; i < segments; i++) {
    if (i < filled) bar += '🟩';
    else if (i === filled && hasPartial) bar += '🟨';
    else bar += '⬜';
  }
  return bar;
}

export interface ShareParams {
  mapId: string;
  mapName: string;
  timeSec: number;
  isNewRecord: boolean;
  language: Language;
}

export function buildShareText(params: ShareParams): string {
  const { mapId, mapName, timeSec, isNewRecord, language } = params;
  const progress = getCollectionProgress(mapId);

  const lines: string[] = [];
  lines.push(t(language, 'shareTitle'));
  lines.push(
    t(language, 'shareResult', { map: mapName, time: timeSec }) + (isNewRecord ? ' 🏆' : ''),
  );
  if (progress.total !== null && progress.total > 0) {
    const bar = buildEmojiBar(progress.opened / progress.total);
    lines.push(`${bar} ${progress.opened}/${progress.total}`);
  }
  return lines.join('\n');
}

export function buildShareUrlText(params: ShareParams): string {
  return `${buildShareText(params)}\n\n#白地図マインスイーパ\n${window.location.href}`;
}
