import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  usePostDetail,
  useLikePost,
  useRatePost,
  usePostComments,
  useCreateComment,
  useCommunityCleanup,
} from '@/hooks/useCommunity';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export default function PostDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const postId = parseInt(params.postId as string, 10);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();

  // Cleanup debounce timers on unmount
  useCommunityCleanup();

  // OPTIMIZATION: Use custom hooks for data fetching with built-in caching
  const { data: postDetailData, loading, error } = usePostDetail(postId);
  const { isLiked, likeCount, handleLike } = useLikePost(
    postId,
    postDetailData?.userMetadata.isLiked ?? false
  );
  const { rating: myRating, handleRate } = useRatePost(
    postId,
    postDetailData?.userMetadata.userRating ?? null
  );
  const { comments, addComment: addCommentToList } = usePostComments(postId);
  const { createComment, loading: commentLoading } = useCreateComment();

  const [commentText, setCommentText] = useState('');
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);

  // Memoized post data to prevent unnecessary re-renders
  const post = useMemo(() => postDetailData?.post, [postDetailData?.post]);

  // Memoized handler for rating with loading state
  const handleRateWithLoading = useCallback(
    async (newRating: number) => {
      setRatingLoading(true);
      try {
        await handleRate(newRating);
      } finally {
        setRatingLoading(false);
      }
    },
    [handleRate]
  );

  // Memoized handler for comment submission
  const handleCommentSubmit = useCallback(async () => {
    if (!commentText.trim()) return;

    try {
      const newComment = await createComment({
        postId,
        content: commentText.trim(),
      });

      if (newComment) {
        addCommentToList(newComment);
        setCommentText('');
      }
    } catch (err) {
      console.error('Error creating comment:', err);
      alert(err instanceof Error ? err.message : 'Failed to post comment');
    }
  }, [commentText, postId, createComment, addCommentToList]);

  const handleDelete = async () => {
    console.log('DELETE POST BUTTON CLICKED');
    console.log('Post ID:', postId);
    console.log('User ID:', user?.id);
    console.log('Post user_id:', post?.user_id);
    
    try {
      console.log('STARTING POST DELETE');
      await deleteCommunityPost(postId);
      console.log('POST DELETED SUCCESSFULLY');
      router.replace('/(tabs)/two');
      Alert.alert('Success', 'Post deleted successfully');
    } catch (err) {
      console.error('POST DELETE FAILED:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete post');
    }
  };

  const handleDeleteOld = async () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCommunityPost(postId);
              Alert.alert('Success', 'Post deleted successfully');
              router.back();
            } catch (err) {
              console.error('Error deleting post:', err);
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete post');
            }
          },
        },
      ]
    );
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      console.log('STARTING DELETE for comment:', commentId);
      await deleteComment(commentId);
      console.log('DELETE SUCCESSFUL');
      setComments(prev => prev.filter(c => c.id !== commentId));
      Alert.alert('Success', 'Comment deleted');
    } catch (err) {
      console.error('DELETE FAILED:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete comment');
    }
  };

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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary?.['500'] || '#3b82f6'} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading post...</Text>
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="alert-circle" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{error?.message || 'Post not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Post</Text>
        {post && user?.id === post.user_id ? (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <MaterialCommunityIcons name="delete-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.postHeader}>
          {post.category && (
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(post.category) }]}>
              <Text style={styles.categoryText}>{post.category}</Text>
            </View>
          )}
          <Text style={styles.dateText}>{formatDate(post.created_at)}</Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{post.title}</Text>

        <View style={styles.authorSection}>
          <View style={styles.avatarPlaceholder}>
            <MaterialCommunityIcons name="account" size={24} color="#fff" />
          </View>
          <View>
            <Text style={[styles.authorText, { color: colors.text }]}>Anonymous User</Text>
            <Text style={styles.roleText}>Community Member</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={[styles.content, { color: colors.text }]}>{post.content}</Text>

        <View style={styles.divider} />

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLike}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={24}
              color={isLiked ? '#ef4444' : '#9ca3af'}
            />
            <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>
              {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setCommentsExpanded(!commentsExpanded)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="comment-outline"
              size={24}
              color="#9ca3af"
            />
            <Text style={styles.actionText}>
              {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Comments</Text>
          
          {/* Comment Input */}
          <View style={[styles.commentInputContainer, { backgroundColor: colors.surface?.default || '#f5f5f5' }]}>
            <TextInput
              style={[styles.commentInput, { color: colors.text }]}
              placeholder="Write a comment..."
              placeholderTextColor="#9ca3af"
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.commentSubmitButton,
                (!commentText.trim() || commentLoading) && styles.commentSubmitButtonDisabled
              ]}
              onPress={handleCommentSubmit}
              disabled={!commentText.trim() || commentLoading}
            >
              {commentLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialCommunityIcons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          {comments.length === 0 ? (
            <View style={styles.emptyComments}>
              <MaterialCommunityIcons name="comment-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyCommentsText}>No comments yet</Text>
              <Text style={styles.emptyCommentsSubtext}>Be the first to comment!</Text>
            </View>
          ) : (
            <View style={styles.commentsList}>
              {comments.map((comment) => {
                const isMyComment = user?.id === comment.user_id;
                console.log(`Comment ${comment.id}: user=${user?.id}, comment.user_id=${comment.user_id}, isMyComment=${isMyComment}`);
                return (
                <View key={comment.id} style={styles.commentItem}>
                  <View style={styles.commentHeader}>
                    <View style={styles.commentAvatarSmall}>
                      <MaterialCommunityIcons name="account" size={16} color="#fff" />
                    </View>
                    <View style={styles.commentInfo}>
                      <Text style={[styles.commentAuthor, { color: colors.text }]}>
                        {comment.users?.username || 'Anonymous'}
                      </Text>
                      <Text style={styles.commentTime}>
                        {new Date(comment.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    {isMyComment && (
                      <TouchableOpacity
                        onPress={() => {
                          console.log('Delete button clicked for comment:', comment.id);
                          console.log('User ID:', user?.id, 'Comment user_id:', comment.user_id);
                          handleDeleteComment(comment.id);
                        }}
                        style={styles.commentDeleteButton}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="delete-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={[styles.commentContent, { color: colors.text }]}>
                    {comment.content}
                  </Text>
                </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Rating Section */}
        <View style={styles.ratingSection}>
          <Text style={[styles.ratingLabel, { color: colors.text }]}>Rate this post</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => handleRateWithLoading(star)}
                disabled={ratingLoading}
                activeOpacity={0.7}
                style={styles.starButton}
              >
                <MaterialCommunityIcons
                  name={myRating && myRating >= star ? 'star' : 'star-outline'}
                  size={36}
                  color={myRating && myRating >= star ? '#f59e0b' : '#d1d5db'}
                />
              </TouchableOpacity>
            ))}
          </View>
          {myRating && (
            <Text style={styles.ratingFeedback}>
              You rated this post {myRating} star{myRating !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  deleteButton: {
    padding: 8,
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
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  dateText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    lineHeight: 36,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  authorText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  roleText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 20,
  },
  content: {
    fontSize: 16,
    lineHeight: 26,
  },
  ratingSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingFeedback: {
    marginTop: 12,
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 20,
    paddingVertical: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  actionTextActive: {
    color: '#ef4444',
  },
  commentsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  commentInput: {
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    minHeight: 40,
  },
  commentSubmitButton: {
    backgroundColor: '#3b82f6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentSubmitButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  emptyComments: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyCommentsText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
    marginTop: 12,
  },
  emptyCommentsSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  commentsList: {
    gap: 16,
  },
  commentItem: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  commentInfo: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  commentDeleteButton: {
    padding: 4,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 40,
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
});
