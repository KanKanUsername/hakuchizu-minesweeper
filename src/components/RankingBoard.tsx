import { useState } from 'react';
import { useRanking } from '../hooks/useRanking';
import type { Difficulty } from '../hooks/useGame';
import { MAX_NAME_LENGTH } from '../types/ranking';
import { t, type Language } from '../i18n';

interface RankingBoardProps {
  mapId: string | null;
  difficulty: Difficulty;
  language: Language;
  myTimeSec?: number;
}

function formatTime(timeSec: number): string {
  const m = Math.floor(timeSec / 60);
  const s = timeSec % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
}

export default function RankingBoard({ mapId, difficulty, language, myTimeSec }: RankingBoardProps) {
  const { entries, isLoading, isSubmitting, error, submit, isEnabled } = useRanking(mapId, difficulty);
  const [name, setName] = useState(() => localStorage.getItem('hakuchizu-ranking-name') || '');
  const [submittedRank, setSubmittedRank] = useState<number | null>(null);
  const [notImproved, setNotImproved] = useState(false);

  if (!isEnabled || !mapId) return null;

  const canSubmit = myTimeSec !== undefined && submittedRank === null && !notImproved;

  const handleSubmit = async () => {
    if (myTimeSec === undefined || name.trim().length === 0) return;
    localStorage.setItem('hakuchizu-ranking-name', name.trim());
    const outcome = await submit(name, myTimeSec);
    if (!outcome) return;
    if (outcome.result === 'notImproved') {
      setNotImproved(true);
    } else {
      setSubmittedRank(outcome.myRank);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mt-4 rounded-xl border border-gray-200 bg-white/90 p-4 text-left shadow-md dark:border-gray-700 dark:bg-gray-800/90">
      <h3 className="mb-2 text-lg font-bold text-gray-800 dark:text-gray-100">
        🏆 {t(language, 'rankingTitle')}
      </h3>

      {canSubmit && (
        <div className="mb-3 flex gap-2">
          <input
            type="text"
            value={name}
            maxLength={MAX_NAME_LENGTH}
            placeholder={t(language, 'rankingNamePlaceholder')}
            onChange={(e) => setName(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || name.trim().length === 0}
            className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-40"
          >
            {t(language, 'rankingSubmit')}
          </button>
        </div>
      )}
      {submittedRank !== null && (
        <p className="mb-3 text-sm font-bold text-safe">
          {t(language, 'rankingSubmitted', { rank: submittedRank })}
        </p>
      )}
      {notImproved && (
        <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
          {t(language, 'rankingNotImproved')}
        </p>
      )}

      {error && <p className="text-sm text-danger">{t(language, 'rankingError')}</p>}
      {isLoading && <p className="text-sm text-gray-500 dark:text-gray-400">{t(language, 'loading')}</p>}
      {!isLoading && !error && entries.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t(language, 'rankingEmpty')}</p>
      )}

      {entries.length > 0 && (
        <ol className="divide-y divide-gray-100 dark:divide-gray-700">
          {entries.map((entry) => (
            <li key={`${entry.uid}-${entry.rank}`} className="flex items-center gap-3 py-1.5 text-sm">
              <span className="w-8 shrink-0 text-right font-mono font-bold text-gray-500 dark:text-gray-400">
                {entry.rank}
              </span>
              <span className="min-w-0 flex-1 truncate text-gray-800 dark:text-gray-100">{entry.name}</span>
              <span className="shrink-0 font-mono font-bold text-gray-700 dark:text-gray-200">
                {formatTime(entry.timeSec)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
