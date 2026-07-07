import { usePlayStats } from '../hooks/usePlayStats';
import { getMapName } from '../data/prefList';
import { t, type Language } from '../i18n';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

function formatTime(timeSec: number | null): string {
  if (timeSec === null) return '—';
  const m = Math.floor(timeSec / 60);
  const s = timeSec % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-line bg-paper">
      <span className="text-lg font-black text-ink">{value}</span>
      <span className="text-[10px] text-ink-soft text-center mt-0.5">{label}</span>
    </div>
  );
}

export default function StatsModal({ isOpen, onClose, language }: StatsModalProps) {
  const { summary, mapRows, hasAnyPlays } = usePlayStats();

  if (!isOpen) return null;

  const difficultyLabel = (d: 'easy' | 'normal' | 'hard' | 'extreme') => t(language, d);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface w-full max-w-sm max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-paper-deep" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-paper-deep flex justify-between items-center bg-paper">
          <h2 className="text-xl font-bold text-ink flex items-center gap-2">
            📊 {t(language, 'statsTitle')}
          </h2>
          <button onClick={onClose} className="text-ink-soft hover:text-ink w-8 h-8 rounded-full hover:bg-paper-deep transition-colors flex items-center justify-center border border-line">✕</button>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto">
          {!hasAnyPlays && (
            <p className="text-sm text-ink-soft text-center py-6">{t(language, 'statsEmpty')}</p>
          )}

          {hasAnyPlays && (
            <>
              <section>
                <div className="grid grid-cols-3 gap-2">
                  <StatTile label={t(language, 'statsTotalPlays')} value={String(summary.totalPlays)} />
                  <StatTile label={t(language, 'statsClearRate')} value={`${Math.round(summary.clearRate * 100)}%`} />
                  <StatTile label={t(language, 'statsAvgTime')} value={formatTime(summary.avgTimeSec)} />
                  <StatTile label={t(language, 'statsActiveDays')} value={String(summary.activeDays)} />
                  <StatTile label={t(language, 'statsLast7Days')} value={String(summary.playedLast7Days)} />
                  <StatTile label={t(language, 'statsTotalTime')} value={`${Math.round((summary.avgTimeSec * summary.totalPlays) / 60)}m`} />
                </div>
              </section>

              {mapRows.length > 0 && (
                <section>
                  <h3 className="text-xs font-bold text-ink-soft uppercase tracking-wider mb-3 px-2">
                    {t(language, 'statsByMap')}
                  </h3>
                  <div className="rounded-lg border border-line bg-paper overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-ink-soft uppercase tracking-wider border-b border-line">
                      <span className="min-w-0 flex-1">{t(language, 'statsColMap')}</span>
                      <span className="w-10 text-right">{t(language, 'statsColPlays')}</span>
                      <span className="w-10 text-right">{t(language, 'statsColClears')}</span>
                      <span className="w-12 text-right">{t(language, 'best')}</span>
                    </div>
                    {mapRows.map(row => (
                      <div key={`${row.mapId}:${row.difficulty}`} className="flex items-center gap-2 px-3 py-2 text-sm border-b border-line last:border-b-0">
                        <span className="min-w-0 flex-1 truncate text-ink">
                          {getMapName(row.mapId, undefined, language)}
                          <span className="ml-1 text-[10px] text-ink-soft">{difficultyLabel(row.difficulty)}</span>
                        </span>
                        <span className="w-10 text-right font-mono text-ink-soft">{row.plays}</span>
                        <span className="w-10 text-right font-mono text-ink-soft">{row.clears}</span>
                        <span className="w-12 text-right font-mono font-bold text-ink">{formatTime(row.bestTimeSec)}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
