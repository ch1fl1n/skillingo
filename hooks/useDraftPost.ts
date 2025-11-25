// hooks/useDraftPost.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  saveDraft,
  getCurrentDraft,
  updateDraft,
  deleteDraft,
  PostDraft,
} from '@/lib/draft-storage';

interface UseDraftPostOptions {
  autoSaveInterval?: number; // milliseconds
  onAutoSave?: (draft: PostDraft) => void;
  onAutoSaveError?: (error: Error) => void;
}

export function useDraftPost(options: UseDraftPostOptions = {}) {
  const { autoSaveInterval = 30000, onAutoSave, onAutoSaveError } = options;

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('');
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<number | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | number | null>(null);

  // Load draft on mount
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const draft = await getCurrentDraft();
        if (draft) {
          setTitle(draft.title);
          setBody(draft.content);
          setCategory(draft.category);
          setCurrentDraftId(draft.id);
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    };

    loadDraft();

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Auto-save effect
  useEffect(() => {
    // Reset timer on every change
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Don't auto-save empty drafts
    if (!title.trim() && !body.trim()) {
      return;
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        setIsAutoSaving(true);
        let newDraft: PostDraft;

        if (currentDraftId) {
          const updated = await updateDraft(currentDraftId, {
            title: title.trim(),
            content: body.trim(),
            category: category.trim(),
          });
          newDraft = updated;
        } else {
          newDraft = await saveDraft({
            title: title.trim(),
            content: body.trim(),
            category: category.trim(),
          });
          setCurrentDraftId(newDraft.id);
        }

        setLastAutoSaveTime(Date.now());
        onAutoSave?.(newDraft);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('Error auto-saving draft:', err);
        onAutoSaveError?.(err);
      } finally {
        setIsAutoSaving(false);
      }
    }, autoSaveInterval);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [title, body, category, autoSaveInterval]);

  const saveCurrentDraft = useCallback(async (): Promise<PostDraft | null> => {
    if (!title.trim() && !body.trim()) {
      return null;
    }

    try {
      let draft: PostDraft;

      if (currentDraftId) {
        draft = await updateDraft(currentDraftId, {
          title: title.trim(),
          content: body.trim(),
          category: category.trim(),
        });
      } else {
        draft = await saveDraft({
          title: title.trim(),
          content: body.trim(),
          category: category.trim(),
        });
        setCurrentDraftId(draft.id);
      }

      setLastAutoSaveTime(Date.now());
      return draft;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error saving draft:', err);
      throw err;
    }
  }, [title, body, category, currentDraftId]);

  const clearCurrentDraft = useCallback(async (): Promise<void> => {
    if (currentDraftId) {
      try {
        await deleteDraft(currentDraftId);
      } catch (error) {
        console.error('Error deleting draft:', error);
        throw error;
      }
    }
    setTitle('');
    setBody('');
    setCategory('');
    setCurrentDraftId(null);
  }, [currentDraftId]);

  const resetForm = useCallback((): void => {
    setTitle('');
    setBody('');
    setCategory('');
    setCurrentDraftId(null);
  }, []);

  return {
    // State
    title,
    setTitle,
    body,
    setBody,
    category,
    setCategory,
    currentDraftId,
    isAutoSaving,
    lastAutoSaveTime,

    // Methods
    saveCurrentDraft,
    clearCurrentDraft,
    resetForm,
  };
}
