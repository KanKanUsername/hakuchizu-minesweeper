import type { Difficulty } from '../hooks/useGame';

export interface ScoreEntry {
  uid: string;
  name: string;
  mapId: string;
  difficulty: Difficulty;
  timeSec: number;
  createdAt: number;
}

export interface RankedScore extends ScoreEntry {
  rank: number;
}

export interface SubmitScoreInput {
  mapId: string;
  difficulty: Difficulty;
  timeSec: number;
  name: string;
}

export type SubmitResult = 'created' | 'improved' | 'notImproved';

export const RANKING_TOP_N = 20;
export const MAX_NAME_LENGTH = 20;
