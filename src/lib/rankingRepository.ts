import type { DocumentData } from 'firebase/firestore';
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

// Loaded on demand so firebase/firestore never enters a bundle chunk unless
// a caller actually reaches these functions (see src/lib/firebase.ts).
let firestoreApiPromise: Promise<typeof import('firebase/firestore')> | null = null;
function getFirestoreApi() {
  if (!firestoreApiPromise) {
    firestoreApiPromise = import('firebase/firestore');
  }
  return firestoreApiPromise;
}

function scoreDocId(uid: string, mapId: string, difficulty: Difficulty): string {
  return `${uid}_${mapId}_${difficulty}`;
}

function toScoreEntry(data: DocumentData, fs: Awaited<ReturnType<typeof getFirestoreApi>>): ScoreEntry {
  const createdAt = data.createdAt instanceof fs.Timestamp ? data.createdAt.toMillis() : 0;
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

  const fs = await getFirestoreApi();
  const uid = await ensureSignedIn();
  const db = await getDb();
  const ref = fs.doc(db, SCORES_COLLECTION, scoreDocId(uid, input.mapId, input.difficulty));

  const existing = await fs.getDoc(ref);
  if (existing.exists() && toScoreEntry(existing.data(), fs).timeSec <= input.timeSec) {
    return 'notImproved';
  }

  await fs.setDoc(ref, {
    uid,
    name,
    mapId: input.mapId,
    difficulty: input.difficulty,
    timeSec: input.timeSec,
    createdAt: fs.serverTimestamp(),
  });

  return existing.exists() ? 'improved' : 'created';
}

export async function fetchTopScores(
  mapId: string,
  difficulty: Difficulty,
  topN: number = RANKING_TOP_N,
): Promise<RankedScore[]> {
  const fs = await getFirestoreApi();
  const db = await getDb();
  const q = fs.query(
    fs.collection(db, SCORES_COLLECTION),
    fs.where('mapId', '==', mapId),
    fs.where('difficulty', '==', difficulty),
    fs.orderBy('timeSec', 'asc'),
    fs.limit(topN),
  );
  const snapshot = await fs.getDocs(q);
  return snapshot.docs.map((d, i) => ({ ...toScoreEntry(d.data(), fs), rank: i + 1 }));
}

export async function fetchMyRank(
  mapId: string,
  difficulty: Difficulty,
  timeSec: number,
): Promise<number> {
  const fs = await getFirestoreApi();
  const db = await getDb();
  const q = fs.query(
    fs.collection(db, SCORES_COLLECTION),
    fs.where('mapId', '==', mapId),
    fs.where('difficulty', '==', difficulty),
    fs.where('timeSec', '<', timeSec),
  );
  const snapshot = await fs.getCountFromServer(q);
  return snapshot.data().count + 1;
}
