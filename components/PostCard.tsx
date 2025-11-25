import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { Tables } from '@/types/database.types';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

type CommunityPost = Tables<'community_posts'>;

interface PostCardProps {
  post: CommunityPost;
}

export default function PostCard({ post }: PostCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getCategoryColor = (category: string | null) => {
    const categoryColors: Record<string, string> = {
      'Tips': '#10b981',
      'Achievement': '#3b82f6',
      'Insight': '#8b5cf6',
      'Question': '#f59e0b',
      'Discussion': '#ef4444',
    };
    return categoryColors[category || ''] || '#6b7280';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const contentPreview = post.content.length > 160 
    ? post.content.substring(0, 160) + '...' 
    : post.content;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface?.default || '#f5f5f5' }]}
      activeOpacity={0.7}
      onPress={() => router.push({
        pathname: '/community/[postId]',
        params: { postId: String(post.id) }
      })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarPlaceholder}>
            <MaterialCommunityIcons name="account" size={20} color="#fff" />
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.authorText, { color: colors.text }]}>Anonymous User</Text>
            <Text style={styles.timeText}>{formatDate(post.created_at)}</Text>
          </View>
        </View>

        {post.category && (
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(post.category) }]}>
            <Text style={styles.categoryText}>{post.category}</Text>
          </View>
        )}
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{post.title}</Text>
      <Text style={[styles.content, { color: colors.neutral?.[600] || '#6b7280' }]} numberOfLines={3}>
        {contentPreview}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="heart-outline" size={18} color="#9ca3af" />
            <Text style={styles.statText}>{(post as any).likes_count || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="comment-outline" size={18} color="#9ca3af" />
            <Text style={styles.statText}>{(post as any).comments_count || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="share-variant-outline" size={18} color="#9ca3af" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  authorText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 13,
    color: '#9ca3af',
    marginLeft: 4,
  },
});
