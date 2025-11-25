import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useWikiPage, useUpdateWikiPage, useWikiRevisions } from '@/lib/api/rsk-hooks';

/**
 * ============================================================================
 * WikiEditor Component
 * ============================================================================
 * Demonstrates RSK-001 (Data Integrity) optimistic locking and conflict handling.
 * Features:
 *  - Display current version
 *  - Attempt update; if conflict, fetch latest and prompt retry
 *  - Show version mismatch UI
 *  - Display revision history
 */

interface WikiEditorProps {
  slug: string;
  onClose?: () => void;
}

export function WikiEditor({ slug, onClose }: WikiEditorProps) {
  const { data: page, isLoading, refetch } = useWikiPage(slug);
  const { data: revisions } = useWikiRevisions(page?.id || '');
  const updateMutation = useUpdateWikiPage();

  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [conflictVersion, setConflictVersion] = useState<number | null>(null);

  // Initialize form from page data
  React.useEffect(() => {
    if (page) {
      setEditTitle(page.title);
      setEditContent(page.content);
    }
  }, [page]);

  const handleSave = async () => {
    if (!page) return;

    try {
      const result = await updateMutation.mutateAsync({
        id: page.id,
        title: editTitle,
        content: editContent,
        currentVersion: page.version,
        summary: 'User edit',
      });

      if (result.conflict) {
        // Version conflict detected
        setConflictVersion(result.latestVersion);
        Alert.alert(
          'Conflict Detected',
          `Another user edited this page. Your version: ${page.version}, Latest: ${result.latestVersion}. Refetching...`,
          [
            {
              text: 'Retry',
              onPress: async () => {
                await refetch();
                setConflictVersion(null);
              },
            },
            { text: 'Discard', onPress: () => setConflictVersion(null) },
          ]
        );
      } else {
        Alert.alert('Success', 'Page saved!');
        setConflictVersion(null);
      }
    } catch (err) {
      Alert.alert('Error', String(err));
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0a84ff" />
      </View>
    );
  }

  if (!page) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Page not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header with version info */}
      <View style={styles.header}>
        <Text style={styles.versionBadge}>v{page.version}</Text>
        <Text style={styles.status}>Status: {page.status}</Text>
      </View>

      {/* Conflict warning */}
      {conflictVersion && (
        <View style={styles.conflictBanner}>
          <Text style={styles.conflictText}>
            ⚠️ Conflict: Latest version is {conflictVersion}. Please review before retrying.
          </Text>
        </View>
      )}

      {/* Title input */}
      <Text style={styles.label}>Title</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => {
          /* In real app, use TextInput */
        }}
      >
        <Text style={styles.inputText} numberOfLines={2}>
          {editTitle || '(Click to edit)'}
        </Text>
      </TouchableOpacity>

      {/* Content preview */}
      <Text style={styles.label}>Content ({editContent.length} chars)</Text>
      <View style={styles.contentPreview}>
        <Text style={styles.previewText} numberOfLines={5}>
          {editContent || '(No content)'}
        </Text>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, updateMutation.isPending && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>💾 Save</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.buttonSecondary} onPress={() => setShowHistory(!showHistory)}>
          <Text style={styles.buttonSecondaryText}>📜 History</Text>
        </TouchableOpacity>

        {onClose && (
          <TouchableOpacity style={styles.buttonSecondary} onPress={onClose}>
            <Text style={styles.buttonSecondaryText}>✕ Close</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Revision history */}
      {showHistory && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Revision History</Text>
          {revisions?.slice(0, 5).map((rev) => (
            <View key={rev.id} style={styles.revisionItem}>
              <Text style={styles.revisionVersion}>v{rev.version}</Text>
              <Text style={styles.revisionMeta}>
                {new Date(rev.created_at).toLocaleString()} • {rev.change_summary || 'Edit'}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#0f1113',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  versionBadge: {
    backgroundColor: '#00d4ff',
    color: '#000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontWeight: '600',
  },
  status: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  conflictBanner: {
    backgroundColor: '#ff6b6b33',
    borderColor: '#ff6b6b',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
  },
  conflictText: {
    color: '#ffa07a',
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  inputText: {
    color: '#cbd5e1',
    fontSize: 15,
  },
  contentPreview: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 100,
  },
  previewText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 20,
    paddingBottom: 20,
  },
  button: {
    backgroundColor: '#00d4ff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonSecondary: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  buttonSecondaryText: {
    color: '#cbd5e1',
    fontWeight: '600',
    fontSize: 14,
  },
  historyContainer: {
    marginTop: 20,
    paddingBottom: 20,
  },
  historyTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  revisionItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  revisionVersion: {
    color: '#00d4ff',
    fontWeight: '600',
    fontSize: 13,
  },
  revisionMeta: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});
