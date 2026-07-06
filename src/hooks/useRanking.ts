import { useCallback, useEffect, useState } from 'react';
import { isRankingEnabled } from '../lib/firebase';
import { fetchMyRank, fetchTopScores, submitScore } from '../lib/rankingRepository';
import type { Difficulty } from './useGame';
import { RANKING_TOP_N, type RankedScore, type SubmitResult } from '../types/ranking';

export interface SubmitOutcome {
  result: SubmitResult;
  myRank: number;
}

export function useRanking(mapId: string | null, difficulty: Difficulty, topN: number = RANKING_TOP_N) {
  const [entries, setEntries] = useState<RankedScore[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!isRankingEnabled || !mapId) return;
    setIsLoading(true);
    setError(null);
    try {
      setEntries(await fetchTopScores(mapId, difficulty, topN));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load ranking');
    } finally {
      setIsLoading(false);
    }
  }, [mapId, difficulty, topN]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const submit = useCallback(
    async (name: string, timeSec: number): Promise<SubmitOutcome | null> => {
      if (!isRankingEnabled || !mapId) return null;
      setIsSubmitting(true);
      setError(null);
      try {
        const result = await submitScore({ mapId, difficulty, timeSec, name });
        const myRank = await fetchMyRank(mapId, difficulty, timeSec);
        await reload();
        return { result, myRank };
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to submit score');
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [mapId, difficulty, reload],
  );

  return { entries, isLoading, isSubmitting, error, reload, submit, isEnabled: isRankingEnabled };
}
