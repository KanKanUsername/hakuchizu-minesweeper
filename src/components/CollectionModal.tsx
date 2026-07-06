import { useCollection } from '../hooks/useCollection';
import { getMapName } from '../data/prefList';
import { t, type Language } from '../i18n';

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

function ProgressBar({ ratio }: { ratio: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-paper-deep overflow-hidden">
      <div
        className="h-full rounded-full bg-amber transition-all"
        style={{ width: `${Math.round(ratio * 100)}%` }}
      />
    </div>
  );
}

export default function CollectionModal({ isOpen, onClose, language }: CollectionModalProps) {
  const { japan, maps, hasAnyProgress } = useCollection();

  if (!isOpen) return null;

  const japanRatio = japan.totalCount > 0 ? japan.openedCount / japan.totalCount : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface w-full max-w-sm max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-paper-deep" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-paper-deep flex justify-between items-center bg-paper">
          <h2 className="text-xl font-bold text-ink flex items-center gap-2">
            🗺️ {t(language, 'collectionTitle')}
          </h2>
          <button onClick={onClose} className="text-ink-soft hover:text-ink w-8 h-8 rounded-full hover:bg-paper-deep transition-colors flex items-center justify-center border border-line">✕</button>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto">
          {!hasAnyProgress && (
            <p className="text-sm text-ink-soft text-center py-6">{t(language, 'collectionEmpty')}</p>
          )}

          {hasAnyProgress && (
            <>
              <section>
                <h3 className="text-xs font-bold text-ink-soft uppercase tracking-wider mb-3 px-2">
                  {t(language, 'japanMap')}
                </h3>
                <div className="p-3 rounded-lg border border-line bg-paper space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="font-bold text-ink">
                      {t(language, 'collectionJapanProgress', { count: japan.openedCount, total: japan.totalCount })}
                    </span>
                    <span className="text-xs font-mono text-ink-soft">{Math.round(japanRatio * 100)}%</span>
                  </div>
                  <ProgressBar ratio={japanRatio} />
                  {japan.unopened.length > 0 && japan.openedCount > 0 && (
                    <div className="pt-2">
                      <p className="text-[10px] font-bold text-ink-soft uppercase tracking-wider mb-1">
                        {t(language, 'collectionUnopened')}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {japan.unopened.map(p => (
                          <span key={p.code} className="px-2 py-0.5 rounded-full text-[10px] border border-dashed border-line text-ink-soft bg-paper-deep/50">
                            {language === 'en' ? p.nameEn : p.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {maps.length > 0 && (
                <section>
                  <h3 className="text-xs font-bold text-ink-soft uppercase tracking-wider mb-3 px-2">
                    {t(language, 'collectionOtherMaps')}
                  </h3>
                  <div className="space-y-2">
                    {maps.map(m => (
                      <div key={m.mapId} className="p-3 rounded-lg border border-line bg-paper space-y-1.5">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="min-w-0 truncate text-sm font-bold text-ink">
                            {getMapName(m.mapId, undefined, language)}
                          </span>
                          <span className="shrink-0 text-xs font-mono text-ink-soft">
                            {m.totalCount !== null
                              ? `${m.openedCount} / ${m.totalCount}`
                              : `${m.openedCount}`}
                          </span>
                        </div>
                        {m.ratio !== null && <ProgressBar ratio={m.ratio} />}
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
