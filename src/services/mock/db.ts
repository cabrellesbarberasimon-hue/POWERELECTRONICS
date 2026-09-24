import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSeed, DB_VERSION, type Database } from '@/data/seed';

/**
 * In-memory mock database persisted to AsyncStorage so that progress, posts,
 * reactions, etc. survive app restarts during demos.
 */
const STORAGE_KEY = 'sense.mockdb';

let db: Database = createSeed();
let saveTimer: ReturnType<typeof setTimeout> | undefined;

export async function loadDb(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Database;
    if (parsed.version === DB_VERSION) db = parsed;
  } catch {
    // Corrupt or unavailable storage: keep the seed.
  }
}

export const getDb = () => db;

/** Apply a mutation and schedule a debounced save. Returns the callback result. */
export function mutate<T>(fn: (draft: Database) => T): T {
  const result = fn(db);
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(db)).catch(() => undefined);
  }, 300);
  return result;
}

export async function resetDb(): Promise<void> {
  db = createSeed();
  await AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
}

/** For tests: replace the database. */
export function __setDb(next: Database) {
  db = next;
}

/** Simulated network latency, disabled in tests. */
export const latency = (ms = 120) =>
  process.env.NODE_ENV === 'test' ? Promise.resolve() : new Promise<void>((r) => setTimeout(r, ms));

let counter = 0;
export const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}${(counter++).toString(36)}`;

/** Deep copy for values returned to the UI, so screens can never mutate the db. */
export const copy = <T>(v: T): T => (v === undefined ? v : (JSON.parse(JSON.stringify(v)) as T));
