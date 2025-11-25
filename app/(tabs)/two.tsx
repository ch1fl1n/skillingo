import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { listCommunityPosts } from '@/lib/db';
import PostCard from '@/components/community/PostCard';
import type { Tables } from '@/types/database.types';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';


// imagen subida (usar esta ruta tal cual)
/* eslint-disable @typescript-eslint/no-require-imports */
const HERO_IMAGE = require('@/assets/images/mascot/step4.jpeg');
/* eslint-enable @typescript-eslint/no-require-imports */




type CommunityPost = Tables<'community_posts'>;

export default function TabThreeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [activeTab, setActiveTab] = useState<'for' | 'following' | 'groups'>('for');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
        setOffset(0);
      } else {
        setLoading(true);
      }
      
      const newOffset = refresh ? 0 : offset;
      const data = await listCommunityPosts({ limit: 10, offset: newOffset });
      
      if (refresh) {
        setPosts(data);
      } else {
        setPosts(prev => [...prev, ...data]);
      }
      
      setHasMore(data.length === 10);
      setOffset(newOffset + data.length);
      setError('');
    } catch (err) {
      console.error('Error loading posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadPosts(true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadPosts();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#2a2a2a', '#1a1a1a']} style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Community</Text>
        <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.7}
            onPress={() => router.push('/community/create')} 
        >
            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
        </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9ca3af" />
          <TextInput
            placeholder="Search"
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
            underlineColorAndroid="transparent"
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('for')}>
            <Text style={[styles.tabText, activeTab === 'for' && styles.tabTextActive]}>For you</Text>
            {activeTab === 'for' && <View style={styles.tabMarker} />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('following')}>
            <Text style={[styles.tabText, activeTab === 'following' && styles.tabTextActive]}>Following</Text>
            {activeTab === 'following' && <View style={styles.tabMarker} />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('groups')}>
            <Text style={[styles.tabText, activeTab === 'groups' && styles.tabTextActive]}>Groups</Text>
            {activeTab === 'groups' && <View style={styles.tabMarker} />}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Feed */}
      {loading && posts.length === 0 ? (
        <View style={[styles.centered, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary?.['500'] || '#3b82f6'} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading posts...</Text>
        </View>
      ) : error ? (
        <View style={[styles.centered, { backgroundColor: colors.background }]}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadPosts(true)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={({ item }) => <PostCard post={item} />}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.feedContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary?.['500'] || '#3b82f6'}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="post-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>No posts yet</Text>
              <Text style={styles.emptySubtext}>Be the first to share something!</Text>
              <TouchableOpacity
                style={styles.emptyCreateButton}
                onPress={() => router.push('/community/create')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                <Text style={styles.emptyCreateButtonText}>Create Post</Text>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={
            loading && posts.length > 0 ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary?.['500'] || '#3b82f6'} />
              </View>
            ) : null
          }
        />
      )}

      {/* Floating Action Button */}
      {!loading && posts.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/community/create')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="pencil" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // page background same as index
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },

  /* Header */
  header: {
    paddingTop: 42,
    paddingBottom: 14,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    right: 6,
    top: 0,
    padding: 8,
    borderRadius: 8,
  },

  /* Search */
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f1113',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
    color: '#e5e7eb',
    fontSize: 14,
  },

  /* Tabs */
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabText: {
    color: '#9ca3af',
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabMarker: {
    height: 2,
    backgroundColor: '#00d4ff', // matches index accent
    width: '60%',
    marginTop: 8,
    borderRadius: 2,
  },

  /* Feed / posts */
  feedContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingTop: 80,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    color: '#9ca3af',
    fontWeight: '600',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyCreateButton: {
    marginTop: 24,
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  emptyCreateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
