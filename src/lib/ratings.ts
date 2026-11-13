import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from './supabase';

const KEY = 'rating_queue_v1';

export type QueuedRating = {
  meal_id: string;
  user_id: string;
  stars: number | null;
  tags: string[];
  skipped: boolean;
  photo_url?: string | null;
};

export async function getQueue(): Promise<QueuedRating[]> {
  try {
    return JSON.parse((await AsyncStorage.getItem(KEY)) ?? '[]');
  } catch {
    return [];
  }
}

const saveQueue = (q: QueuedRating[]) => AsyncStorage.setItem(KEY, JSON.stringify(q));

const isNetworkError = (e: any) =>
  !!e && (e.status === 0 || /network|fetch/i.test(e.message ?? ''));

/** Inserts online, or queues locally when offline. Throws 'ALREADY_RATED' on duplicates. */
export async function submitRating(r: QueuedRating): Promise<{ queued: boolean }> {
  const net = await NetInfo.fetch();
  if (net.isConnected !== false) {
    const { error } = await supabase.from('ratings').insert(r);
    if (!error) return { queued: false };
    if (error.code === '23505') throw new Error('ALREADY_RATED');
    if (!isNetworkError(error)) throw error;
  }
  const q = await getQueue();
  if (!q.some((x) => x.meal_id === r.meal_id && x.user_id === r.user_id)) {
    await saveQueue([...q, r]);
  }
  return { queued: true };
}

let flushing = false;

/** Sends queued ratings for this user. Returns how many were synced. */
export async function flushQueue(userId: string): Promise<number> {
  if (flushing) return 0;
  flushing = true;
  try {
    const q = await getQueue();
    if (!q.length) return 0;
    const keep: QueuedRating[] = [];
    let synced = 0;
    for (const r of q) {
      if (r.user_id !== userId) { keep.push(r); continue; }
      const { error } = await supabase.from('ratings').insert(r);
      if (!error || error.code === '23505') synced++;
      else keep.push(r);
    }
    await saveQueue(keep);
    return synced;
  } finally {
    flushing = false;
  }
}