// app/Not_seen/Drafts.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { getAllDrafts, deleteDraft, PostDraft } from '@/lib/draft-storage';

export default function DraftsScreen() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<PostDraft[]>([]);
  const [loading, setLoading] = useState(true);

  // Load drafts when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadDrafts();
    }, [])
  );

  const loadDrafts = async () => {
    try {
      setLoading(true);
      const allDrafts = await getAllDrafts();
      // Sort by most recent first
      allDrafts.sort((a, b) => b.updatedAt - a.updatedAt);
      setDrafts(allDrafts);
    } catch (error) {
      console.error('Error loading drafts:', error);
      Alert.alert('Error', 'Failed to load drafts');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    Alert.alert('Delete Draft', 'Are you sure you want to delete this draft?', [
      {
        text: 'Cancel',
        onPress: () => {},
        style: 'cancel',
      },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await deleteDraft(draftId);
            await loadDrafts();
            Alert.alert('Success', 'Draft deleted');
          } catch (error) {
            console.error('Error deleting draft:', error);
            Alert.alert('Error', 'Failed to delete draft');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderDraftItem = ({ item }: { item: PostDraft }) => (
    <View style={styles.draftCard}>
      <View style={styles.draftHeader}>
        <Text style={styles.draftTitle} numberOfLines={1}>
          {item.title || '(Sin título)'}
        </Text>
        <TouchableOpacity onPress={() => handleDeleteDraft(item.id)}>
          <MaterialCommunityIcons name="delete" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <Text style={styles.draftContent} numberOfLines={2}>
        {item.content}
      </Text>

      {item.category && (
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      )}

      <Text style={styles.draftDate}>
        Actualizado: {formatDate(item.updatedAt)}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00aaffff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Drafts</Text>
      </View>

      {drafts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="file-document-outline" size={48} color="#6b7280" />
          <Text style={styles.emptyText}>No drafts saved yet</Text>
          <Text style={styles.emptySubtext}>
            Your post drafts will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={drafts}
          renderItem={renderDraftItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a', paddingHorizontal: 18, paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backBtn: { marginRight: 12 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  listContainer: { paddingBottom: 20 },
  draftCard: {
    backgroundColor: '#0f1113',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#161616',
  },
  draftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  draftTitle: {
    color: '#e5e7eb',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  draftContent: {
    color: '#9ca3af',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#1f2937',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  categoryText: {
    color: '#00aaffff',
    fontSize: 11,
    fontWeight: '500',
  },
  draftDate: {
    color: '#6b7280',
    fontSize: 11,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#e5e7eb',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtext: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 6,
  },
});
