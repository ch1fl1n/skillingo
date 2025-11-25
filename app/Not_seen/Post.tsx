// app/modal.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { createCommunityPost } from '@/lib/db';
import { addPostToModerationQueue } from '@/lib/db';
import {
  saveDraft,
  getCurrentDraft,
  updateDraft,
  deleteDraft,
  PostDraft,
} from '@/lib/draft-storage';

export default function ModalPostScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | number | null>(null);

  // Load previous draft on component mount
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

  // Auto-save draft every 30 seconds when content changes
  useEffect(() => {
    // Reset timer on every change
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Don't auto-save empty drafts
    if (!title.trim() && !body.trim()) {
      return;
    }

    autoSaveTimerRef.current = setTimeout(() => {
      performAutoSave();
    }, 30000); // 30 seconds

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [title, body, category]);

  const performAutoSave = async () => {
    try {
      if (currentDraftId) {
        // Update existing draft
        await updateDraft(currentDraftId, {
          title: title.trim(),
          content: body.trim(),
          category: category.trim(),
        });
      } else {
        // Create new draft
        const newDraft = await saveDraft({
          title: title.trim(),
          content: body.trim(),
          category: category.trim(),
        });
        setCurrentDraftId(newDraft.id);
      }
      setDraftSaved(true);
      // Hide the "saved" indicator after 2 seconds
      setTimeout(() => setDraftSaved(false), 2000);
    } catch (error) {
      console.error('Error auto-saving draft:', error);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Error', 'Title and content are required');
      return;
    }

    if (title.length > 100) {
      Alert.alert('Error', 'Title must be 100 characters or less');
      return;
    }

    if (body.length > 2000) {
      Alert.alert('Error', 'Content must be 2000 characters or less');
      return;
    }

    setSubmitting(true);
    try {
      // Create the post
      const post = await createCommunityPost({
        title: title.trim(),
        content: body.trim(),
        category: category.trim() || null,
      });

      // Add to moderation queue for review
      await addPostToModerationQueue(post.id);

      // Delete draft after successful submission
      if (currentDraftId) {
        await deleteDraft(currentDraftId);
      }

      Alert.alert(
        'Success',
        'Your post has been submitted for review. It will be published once approved by a moderator.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!title.trim() && !body.trim()) {
      Alert.alert('Info', 'Please add some content before saving a draft');
      return;
    }

    try {
      if (currentDraftId) {
        // Update existing draft
        await updateDraft(currentDraftId, {
          title: title.trim(),
          content: body.trim(),
          category: category.trim(),
        });
      } else {
        // Create new draft
        const newDraft = await saveDraft({
          title: title.trim(),
          content: body.trim(),
          category: category.trim(),
        });
        setCurrentDraftId(newDraft.id);
      }

      Alert.alert('Success', 'Draft saved successfully');
    } catch (error) {
      console.error('Error saving draft:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save draft');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        {draftSaved && (
          <Text style={styles.draftIndicator}>Auto-saved</Text>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <TextInput
          placeholder="Title (Max 100 characters)"
          placeholderTextColor="#6b7280"
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        {/* Body */}
        <TextInput
          placeholder="Write something..."
          placeholderTextColor="#6b7280"
          multiline
          style={[styles.input, styles.textArea]}
          value={body}
          onChangeText={setBody}
          maxLength={2000}
        />

        {/* Category */}
        <TextInput
          placeholder="Category (optional)"
          placeholderTextColor="#6b7280"
          style={styles.input}
          value={category}
          onChangeText={setCategory}
        />

        {/* Character counts */}
        <View style={styles.charCountContainer}>
          <Text style={styles.charCount}>
            Title: {title.length}/100
          </Text>
          <Text style={styles.charCount}>
            Content: {body.length}/2000
          </Text>
        </View>

        {/* Guidelines */}
        <Text style={styles.guidelines}>
          Content Guidelines: Posts should be respectful, relevant, and contribute positively to the community. Inappropriate content will be removed.
        </Text>

        {/* Buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.draftBtn}
            onPress={handleSaveDraft}
            disabled={submitting}
          >
            <Text style={styles.draftText}>Save as Draft</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.disabledBtn]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.submitText}>Submit for Review</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a', paddingHorizontal: 18, paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  closeBtn: { position: 'absolute', left: 0 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  draftIndicator: { position: 'absolute', right: 0, color: '#10b981', fontSize: 12, fontWeight: '500' },
  input: { backgroundColor: '#0f1113', color: '#e5e7eb', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#161616', fontSize: 14, marginBottom: 14 },
  textArea: { minHeight: 140, textAlignVertical: 'top' },
  charCountContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  charCount: { color: '#9ca3af', fontSize: 12 },
  guidelines: { color: '#c1c5c9', fontSize: 12, lineHeight: 18, marginTop: 4, marginBottom: 20 },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between' },
  draftBtn: { backgroundColor: '#2d2d2d', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10, flex: 1, marginRight: 10 },
  draftText: { color: '#e5e7eb', textAlign: 'center', fontWeight: '600' },
  submitBtn: { backgroundColor: '#00aaffff', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10, flex: 1 },
  disabledBtn: { opacity: 0.6 },
  submitText: { color: '#000', textAlign: 'center', fontWeight: '700' },
});
