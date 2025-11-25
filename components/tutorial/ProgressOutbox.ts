import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ProgressUpdate {
  id: string;
  userId: string;
  lessonId: number;
  skillId: number;
  completedAt: string;
  xpGained: number;
  timestamp: number;
  status: 'pending' | 'synced';
}

const OUTBOX_KEY = '@skillingo_progress_outbox';
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY = 2000; // 2s

/**
 * Offline queue para progress updates.
 * Sincroniza cuando hay conectividad usando exponential backoff.
 */
export class ProgressOutbox {
  private static instance: ProgressOutbox;

  private constructor() {}

  static getInstance(): ProgressOutbox {
    if (!ProgressOutbox.instance) {
      ProgressOutbox.instance = new ProgressOutbox();
    }
    return ProgressOutbox.instance;
  }

  async addUpdate(update: Omit<ProgressUpdate, 'id' | 'timestamp' | 'status'>): Promise<string> {
    const id = `${update.userId}_${update.lessonId}_${Date.now()}`;
    const entry: ProgressUpdate = {
      ...update,
      id,
      timestamp: Date.now(),
      status: 'pending',
    };

    try {
      const existing = await this.getQueue();
      existing.push(entry);
      await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(existing));
      console.log(`[Outbox] Added ${id}`);
      return id;
    } catch (err) {
      console.error('[Outbox] Failed to add update:', err);
      throw err;
    }
  }

  async getQueue(): Promise<ProgressUpdate[]> {
    try {
      const stored = await AsyncStorage.getItem(OUTBOX_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (err) {
      console.warn('[Outbox] Failed to get queue:', err);
      return [];
    }
  }

  async syncAll(
    uploadFn: (updates: ProgressUpdate[]) => Promise<void>
  ): Promise<{ synced: number; failed: number }> {
    const queue = await this.getQueue();
    let synced = 0;
    let failed = 0;

    for (const update of queue) {
      if (update.status === 'synced') continue;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          await uploadFn([update]);
          update.status = 'synced';
          synced++;
          console.log(`[Outbox] Synced ${update.id}`);
          break;
        } catch {;
          if (attempt < MAX_RETRIES - 1) {
            const delay = BASE_RETRY_DELAY * Math.pow(2, attempt);
            console.warn(`[Outbox] Retry ${attempt + 1} for ${update.id} in ${delay}ms`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else {
            failed++;
            console.error(`[Outbox] Failed to sync ${update.id} after ${MAX_RETRIES} attempts`);
          }
        }
      }
    }

    // Persisti el estado actualizado
    await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(queue));
    console.log(`[Outbox] Sync complete: ${synced} synced, ${failed} failed`);

    return { synced, failed };
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(OUTBOX_KEY);
      console.log('[Outbox] Cleared');
    } catch (err) {
      console.warn('[Outbox] Failed to clear:', err);
    }
  }

  async removeSynced(): Promise<void> {
    try {
      const queue = await this.getQueue();
      const pending = queue.filter((u) => u.status === 'pending');
      await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(pending));
      console.log('[Outbox] Removed synced entries');
    } catch (err) {
      console.warn('[Outbox] Failed to remove synced:', err);
    }
  }
}
