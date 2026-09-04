import { openDB, type IDBPDatabase } from 'idb';
import type { AttemptState, AttemptResult } from '../types';

const DB_NAME = 'llm-exam-portal';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('attempts')) {
          db.createObjectStore('attempts', { keyPath: 'attemptId' });
        }
        if (!db.objectStoreNames.contains('results')) {
          db.createObjectStore('results', { keyPath: 'attemptId' });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveAttempt(attempt: AttemptState): Promise<void> {
  const db = await getDB();
  await db.put('attempts', attempt);
}

export async function loadAttempt(attemptId: string): Promise<AttemptState | undefined> {
  const db = await getDB();
  return db.get('attempts', attemptId);
}

export async function loadActiveAttemptForGA(gaId: string): Promise<AttemptState | undefined> {
  const db = await getDB();
  const all: AttemptState[] = await db.getAll('attempts');
  return all.find(a => a.gaId === gaId && !a.submitted);
}

export async function saveResult(result: AttemptResult): Promise<void> {
  const db = await getDB();
  await db.put('results', result);
}

export async function loadResult(attemptId: string): Promise<AttemptResult | undefined> {
  const db = await getDB();
  return db.get('results', attemptId);
}

export async function loadAllResults(): Promise<AttemptResult[]> {
  const db = await getDB();
  const all: AttemptResult[] = await db.getAll('results');
  return all.sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}

export async function deleteAttempt(attemptId: string): Promise<void> {
  const db = await getDB();
  await db.delete('attempts', attemptId);
}
