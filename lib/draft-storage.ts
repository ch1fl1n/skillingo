// lib/draft-storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PostDraft {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: number;
  updatedAt: number;
}

const DRAFT_STORAGE_KEY = '@skillingo_post_drafts';
const CURRENT_DRAFT_KEY = '@skillingo_current_draft';

/**
 * Save a draft post
 */
export async function saveDraft(draft: Omit<PostDraft, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const id = Date.now().toString();
    const now = Date.now();
    
    const newDraft: PostDraft = {
      id,
      ...draft,
      createdAt: now,
      updatedAt: now,
    };

    // Save to persistent storage
    const existingDrafts = await getAllDrafts();
    const updatedDrafts = [...existingDrafts, newDraft];
    await AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updatedDrafts));

    // Also save as current draft for quick access
    await AsyncStorage.setItem(CURRENT_DRAFT_KEY, JSON.stringify(newDraft));

    return newDraft;
  } catch (error) {
    console.error('Error saving draft:', error);
    throw error;
  }
}

/**
 * Update an existing draft
 */
export async function updateDraft(id: string, updates: Partial<Omit<PostDraft, 'id' | 'createdAt'>>) {
  try {
    const drafts = await getAllDrafts();
    const draftIndex = drafts.findIndex(d => d.id === id);

    if (draftIndex === -1) {
      throw new Error(`Draft with id ${id} not found`);
    }

    const updatedDraft: PostDraft = {
      ...drafts[draftIndex],
      ...updates,
      updatedAt: Date.now(),
    };

    drafts[draftIndex] = updatedDraft;
    await AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));

    // Update current draft if it's the one being updated
    const currentDraft = await getCurrentDraft();
    if (currentDraft?.id === id) {
      await AsyncStorage.setItem(CURRENT_DRAFT_KEY, JSON.stringify(updatedDraft));
    }

    return updatedDraft;
  } catch (error) {
    console.error('Error updating draft:', error);
    throw error;
  }
}

/**
 * Get all saved drafts
 */
export async function getAllDrafts(): Promise<PostDraft[]> {
  try {
    const draftsJson = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
    return draftsJson ? JSON.parse(draftsJson) : [];
  } catch (error) {
    console.error('Error getting drafts:', error);
    return [];
  }
}

/**
 * Get the current draft (most recently saved or accessed)
 */
export async function getCurrentDraft(): Promise<PostDraft | null> {
  try {
    const draftJson = await AsyncStorage.getItem(CURRENT_DRAFT_KEY);
    return draftJson ? JSON.parse(draftJson) : null;
  } catch (error) {
    console.error('Error getting current draft:', error);
    return null;
  }
}

/**
 * Delete a specific draft
 */
export async function deleteDraft(id: string): Promise<void> {
  try {
    const drafts = await getAllDrafts();
    const filteredDrafts = drafts.filter(d => d.id !== id);
    await AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(filteredDrafts));

    // Clear current draft if it's the one being deleted
    const currentDraft = await getCurrentDraft();
    if (currentDraft?.id === id) {
      await AsyncStorage.removeItem(CURRENT_DRAFT_KEY);
    }
  } catch (error) {
    console.error('Error deleting draft:', error);
    throw error;
  }
}

/**
 * Clear all drafts
 */
export async function clearAllDrafts(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([DRAFT_STORAGE_KEY, CURRENT_DRAFT_KEY]);
  } catch (error) {
    console.error('Error clearing drafts:', error);
    throw error;
  }
}
