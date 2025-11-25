import React, { useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRealtimePostStats } from '@/hooks/useRealtimePostStats';
import { usePostInteraction } from '@/hooks/usePostInteraction';
import { Text } from './Themed';

const { width } = Dimensions.get('window');

interface PostVoteButtonsProps {
  postId: number;
  onlyIcons?: boolean;
}

/**
 * Componente para mostrar botones de votación (like/dislike) de posts
 * Sincroniza en tiempo real con Supabase
 */
export const PostVoteButtons: React.FC<PostVoteButtonsProps> = ({
  postId,
  onlyIcons = false,
}) => {
  const { likeCount, dislikeCount } = useRealtimePostStats(postId);
  const { loading, userRating, fetchUserRating, submitRating } =
    usePostInteraction();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await fetchUserRating(postId);
      setInitialized(true);
    };
    initialize();
  }, [postId, fetchUserRating]);

  const handleLike = async () => {
    if (userRating === 1) {
      // Remover like
      await submitRating(postId, 1);
    } else {
      // Agregar like
      await submitRating(postId, 1);
    }
  };

  const handleDislike = async () => {
    if (userRating === -1) {
      // Remover dislike
      await submitRating(postId, -1);
    } else {
      // Agregar dislike
      await submitRating(postId, -1);
    }
  };

  if (!initialized) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Like Button */}
      <TouchableOpacity
        style={[
          styles.button,
          userRating === 1 && styles.buttonActive,
        ]}
        onPress={() => handleLike()}
        disabled={loading}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#8B5CF6" />
        ) : (
          <>
            <Text
              style={[
                styles.emoji,
                userRating === 1 && styles.emojiActive,
              ]}
            >
              👍
            </Text>
            {!onlyIcons && (
              <Text
                style={[
                  styles.count,
                  userRating === 1 && styles.countActive,
                ]}
              >
                {likeCount || 0}
              </Text>
            )}
          </>
        )}
      </TouchableOpacity>

      {/* Dislike Button */}
      <TouchableOpacity
        style={[
          styles.button,
          userRating === -1 && styles.buttonActive,
        ]}
        onPress={() => handleDislike()}
        disabled={loading}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#8B5CF6" />
        ) : (
          <>
            <Text
              style={[
                styles.emoji,
                userRating === -1 && styles.emojiActive,
              ]}
            >
              👎
            </Text>
            {!onlyIcons && (
              <Text
                style={[
                  styles.count,
                  userRating === -1 && styles.countActive,
                ]}
              >
                {dislikeCount || 0}
              </Text>
            )}
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buttonActive: {
    backgroundColor: '#F3E8FF',
    borderColor: '#8B5CF6',
  },
  emoji: {
    fontSize: 18,
  },
  emojiActive: {
    fontSize: 20,
    opacity: 1,
  },
  count: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  countActive: {
    color: '#8B5CF6',
  },
});
