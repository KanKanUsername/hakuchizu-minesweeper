import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';
import { ensureSignedIn, getDb } from './firebase';
import type { Difficulty } from '../hooks/useGame';
import {
  MAX_NAME_LENGTH,
  RANKING_TOP_N,
  type RankedScore,
  type ScoreEntry,
  type SubmitResult,
  type SubmitScoreInput,
} from '../types/ranking';

const SCORES_COLLECTION = 'scores';

function scoreDocId(uid: string, mapId: string, difficulty: Difficulty): string {
  return `${uid}_${mapId}_${difficulty}`;
}

function toScoreEntry(data: DocumentData): ScoreEntry {
  const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : 0;
  return {
    uid: String(data.uid ?? ''),
    name: String(data.name ?? ''),
    mapId: String(data.mapId ?? ''),
    difficulty: data.difficulty as Difficulty,
    timeSec: Number(data.timeSec ?? 0),
    createdAt,
  };
}

export async function submitScore(input: SubmitScoreInput): Promise<SubmitResult> {
  const name = input.name.trim().slice(0, MAX_NAME_LENGTH);
  if (name.length === 0 || !Number.isInteger(input.timeSec) || input.timeSec <= 0) {
    throw new Error('Invalid score input');
  }

  const uid = await ensureSignedIn();
  const db = getDb();
  const ref = doc(db, SCORES_COLLECTION, scoreDocId(uid, input.mapId, input.difficulty));

  const existing = await getDoc(ref);
  if (existing.exists() && toScoreEntry(existing.data()).timeSec <= input.timeSec) {
    return 'notImproved';
  }

  await setDoc(ref, {
    uid,
    name,
    mapId: input.mapId,
    difficulty: input.difficulty,
    timeSec: input.timeSec,
    createdAt: serverTimestamp(),
  });

  return existing.exists() ? 'improved' : 'created';
}

export async function fetchTopScores(
  mapId: string,
  difficulty: Difficulty,
  topN: number = RANKING_TOP_N,
): Promise<RankedScore[]> {
  const db = getDb();
  const q = query(
    collection(db, SCORES_COLLECTION),
    where('mapId', '==', mapId),
    where('difficulty', '==', difficulty),
    orderBy('timeSec', 'asc'),
    limit(topN),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d, i) => ({ ...toScoreEntry(d.data()), rank: i + 1 }));
}

export async function fetchMyRank(
  mapId: string,
  difficulty: Difficulty,
  timeSec: number,
): Promise<number> {
  const db = getDb();
  const q = query(
    collection(db, SCORES_COLLECTION),
    where('mapId', '==', mapId),
    where('difficulty', '==', difficulty),
    where('timeSec', '<', timeSec),
  );
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count + 1;
}
