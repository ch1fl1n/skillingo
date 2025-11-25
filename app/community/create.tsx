import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createCommunityPost } from '@/lib/db';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useDebounce } from '@/hooks/useCommunity';

const CATEGORIES = ['Tips', 'Achievement', 'Insight', 'Question', 'Discussion'];

// Validation rules with helpful error messages
const VALIDATION_RULES = {
  title: {
    minLength: 5,
    maxLength: 100,
    messages: {
      empty: 'Please enter a title',
      tooShort: 'Title must be at least 5 characters',
      tooLong: 'Title must be at most 100 characters',
    },
  },
  content: {
    minLength: 10,
    maxLength: 2000,
    messages: {
      empty: 'Please enter content',
      tooShort: 'Content must be at least 10 characters',
      tooLong: 'Content must be at most 2000 characters',
    },
  },
};

interface ValidationError {
  field: 'title' | 'content' | 'general';
  message: string;
}

export default function CreatePostScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  // OPTIMIZATION: Debounce validation to avoid excessive re-renders
  const debouncedTitle = useDebounce(title, 300);
  const debouncedContent = useDebounce(content, 300);

  // OPTIMIZATION: Memoized validation function
  const validateForm = useCallback(
    (t: string, c: string): ValidationError[] => {
      const validationErrors: ValidationError[] = [];

      // Validate title
      if (!t.trim()) {
        validationErrors.push({
          field: 'title',
          message: VALIDATION_RULES.title.messages.empty,
        });
      } else if (t.trim().length < VALIDATION_RULES.title.minLength) {
        validationErrors.push({
          field: 'title',
          message: VALIDATION_RULES.title.messages.tooShort,
        });
      } else if (t.length > VALIDATION_RULES.title.maxLength) {
        validationErrors.push({
          field: 'title',
          message: VALIDATION_RULES.title.messages.tooLong,
        });
      }

      // Validate content
      if (!c.trim()) {
        validationErrors.push({
          field: 'content',
          message: VALIDATION_RULES.content.messages.empty,
        });
      } else if (c.trim().length < VALIDATION_RULES.content.minLength) {
        validationErrors.push({
          field: 'content',
          message: VALIDATION_RULES.content.messages.tooShort,
        });
      } else if (c.length > VALIDATION_RULES.content.maxLength) {
        validationErrors.push({
          field: 'content',
          message: VALIDATION_RULES.content.messages.tooLong,
        });
      }

      return validationErrors;
    },
    []
  );

  // OPTIMIZATION: Validate on debounced changes (not on every keystroke)
  useEffect(() => {
    const validationErrors = validateForm(debouncedTitle, debouncedContent);
    setErrors(validationErrors);
  }, [debouncedTitle, debouncedContent, validateForm]);

  // OPTIMIZATION: Memoized isFormValid to prevent unnecessary re-renders
  const isFormValid = useMemo(
    () => title.trim().length >= VALIDATION_RULES.title.minLength &&
           content.trim().length >= VALIDATION_RULES.content.minLength &&
           errors.length === 0,
    [title, content, errors]
  );

  // OPTIMIZATION: Memoized character counts
  const titleCount = useMemo(() => title.length, [title]);
  const contentCount = useMemo(() => content.length, [content]);

  // OPTIMIZATION: Calculate remaining characters
  const titleRemaining = useMemo(
    () => VALIDATION_RULES.title.maxLength - titleCount,
    [titleCount]
  );
  const contentRemaining = useMemo(
    () => VALIDATION_RULES.content.maxLength - contentCount,
    [contentCount]
  );

  const handleSubmit = useCallback(async () => {
    // Final validation before submit
    const validationErrors = validateForm(title, content);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSubmitting(true);
      setErrors([]);

      console.log('Creating post with:', {
        title: title.trim(),
        content: content.trim(),
        category,
      });

      const result = await createCommunityPost({
        title: title.trim(),
        content: content.trim(),
        category,
      });

      console.log('Post created successfully:', result);

      // Reset submitting state before navigation
      setSubmitting(false);

      // Navigate back immediately
      router.back();

      // Show success message after navigation
      setTimeout(() => {
        Alert.alert(
          'Post Published!',
          'Your post has been published and is now visible to the community.'
        );
      }, 100);
    } catch (err) {
      console.error('Error creating post:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create post';
      console.error('Error details:', errorMessage);

      setErrors([
        {
          field: 'general',
          message: errorMessage,
        },
      ]);
      setSubmitting(false);

      // Show alert for user
      Alert.alert('Error', errorMessage);
    }
  }, [title, content, category, validateForm, router]);

  // Get error message for field
  const getFieldError = useCallback(
    (field: 'title' | 'content'): string | null => {
      const error = errors.find((e) => e.field === field);
      return error?.message || null;
    },
    [errors]
  );

  const generalError = errors.find((e) => e.field === 'general');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>New Post</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {generalError ? (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={20}
              color="#ef4444"
            />
            <Text style={styles.errorText}>{generalError.message}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Title *</Text>
          <TextInput
            style={[
              styles.titleInput,
              {
                backgroundColor: colors.surface?.default || '#f5f5f5',
                color: colors.text,
                borderColor: colors.neutral?.['300'] || '#d1d5db',
              },
            ]}
            placeholder="Give your post a catchy title"
            placeholderTextColor="#9ca3af"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            editable={!submitting}
          />
          <Text style={styles.helperText}>
            {titleCount}/{VALIDATION_RULES.title.maxLength} characters
            {titleRemaining < 20 && titleRemaining > 0 && (
              <Text style={styles.warningText}>
                {' '}
                ({titleRemaining} remaining)
              </Text>
            )}
            {titleRemaining <= 0 && (
              <Text style={styles.errorWarningText}> (max reached)</Text>
            )}
          </Text>
          {getFieldError('title') && (
            <Text style={styles.errorMessage}>{getFieldError('title')}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Category</Text>
          <View style={styles.categoriesRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  category === cat && styles.categoryChipActive,
                ]}
                onPress={() => setCategory(category === cat ? null : cat)}
                disabled={submitting}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === cat && styles.categoryTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Content *</Text>
          <TextInput
            style={[
              styles.contentInput,
              {
                backgroundColor: colors.surface?.default || '#f5f5f5',
                color: colors.text,
                borderColor: colors.neutral?.['300'] || '#d1d5db',
              },
            ]}
            placeholder="Share your thoughts, tips, or insights with the community..."
            placeholderTextColor="#9ca3af"
            value={content}
            onChangeText={setContent}
            maxLength={2000}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
            editable={!submitting}
          />
          <Text style={styles.helperText}>
            {contentCount}/{VALIDATION_RULES.content.maxLength} characters
            {contentRemaining < 50 && contentRemaining > 0 && (
              <Text style={styles.warningText}>
                {' '}
                ({contentRemaining} remaining)
              </Text>
            )}
            {contentRemaining <= 0 && (
              <Text style={styles.errorWarningText}> (max reached)</Text>
            )}
          </Text>
          {getFieldError('content') && (
            <Text style={styles.errorMessage}>{getFieldError('content')}</Text>
          )}
        </View>

        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information" size={20} color="#3b82f6" />
          <Text style={styles.infoText}>
            Your post will be published immediately and visible to all community members.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!isFormValid || submitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!isFormValid || submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="send" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Submit Post</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  contentInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 150,
  },
  helperText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'right',
  },
  warningText: {
    color: '#f59e0b',
    fontWeight: '600',
  },
  errorWarningText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  errorMessage: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    fontWeight: '600',
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  categoryTextActive: {
    color: '#fff',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#3b82f6',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
