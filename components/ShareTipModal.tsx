import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase, currentUserId } from '@/lib/supabase';

interface ShareTipModalProps {
  visible: boolean;
  onClose: () => void;
  skillId: number;
  skillName: string;
  lessonTitle: string;
  xpGained: number;
}

const MAX_TIP_LENGTH = 200;

export default function ShareTipModal({
  visible,
  onClose,
  skillId,
  skillName,
  lessonTitle,
  xpGained,
}: ShareTipModalProps) {
  const [tip, setTip] = useState('');
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    if (!tip.trim()) {
      Alert.alert('Empty tip', 'Please write something to share');
      return;
    }

    if (tip.length > MAX_TIP_LENGTH) {
      Alert.alert('Too long', `Tip must be ${MAX_TIP_LENGTH} characters or less`);
      return;
    }

    setLoading(true);

    try {
      const userId = await currentUserId();
      if (!userId) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // Insert post into community_posts table
      const { error } = await supabase.from('community_posts').insert({
        user_id: userId,
        title: `Tip: ${skillName}`,
        content: tip,
        category: skillName,
        status: 'pending', // Requiere moderación
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Error sharing tip:', error);
        Alert.alert('Error', 'Failed to share tip. Please try again.');
        return;
      }

      // Success
      Alert.alert('Success!', 'Your tip has been shared with the community', [
        {
          text: 'OK',
          onPress: () => {
            setTip('');
            onClose();
          },
        },
      ]);
    } catch (err) {
      console.error('Unexpected error:', err);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const charCount = tip.length;
  const isOverLimit = charCount > MAX_TIP_LENGTH;

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <MaterialCommunityIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Share a Tip</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Lesson Context */}
          <View style={styles.contextCard}>
            <MaterialCommunityIcons 
              name="lightbulb-on" 
              size={24} 
              color="#ffd966" 
              style={styles.iconContext}
            />
            <View style={styles.contextText}>
              <Text style={styles.contextSkill}>{skillName}</Text>
              <Text style={styles.contextLesson}>{lessonTitle}</Text>
              <Text style={styles.contextXP}>+{xpGained} XP gained</Text>
            </View>
          </View>

          {/* Input Section */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Share your insight</Text>
            <TextInput
              style={[
                styles.input,
                isOverLimit && styles.inputError,
              ]}
              placeholder="What did you learn? Share a tip with the community..."
              placeholderTextColor="#666"
              value={tip}
              onChangeText={setTip}
              maxLength={MAX_TIP_LENGTH + 50} // Allow typing slightly over to show error
              multiline
              numberOfLines={4}
              editable={!loading}
            />
            <View style={styles.charCounter}>
              <Text style={[styles.charText, isOverLimit && styles.charError]}>
                {charCount}/{MAX_TIP_LENGTH}
              </Text>
            </View>
          </View>

          {/* Info */}
          <View style={styles.infoBox}>
            <MaterialCommunityIcons 
              name="information" 
              size={16} 
              color="#00d4ff" 
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>
              Your tip will be tagged with "{skillName}" and visible to all learners
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.shareButton,
                (isOverLimit || loading || !tip.trim()) && styles.shareButtonDisabled,
              ]}
              onPress={handleShare}
              disabled={isOverLimit || loading || !tip.trim()}
            >
              {loading ? (
                <ActivityIndicator color="#1a1a1a" size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons 
                    name="share" 
                    size={18} 
                    color="#1a1a1a" 
                    style={styles.shareIcon}
                  />
                  <Text style={styles.shareButtonText}>Share Tip</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  contextCard: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  iconContext: {
    marginRight: 12,
    marginTop: 2,
  },
  contextText: {
    flex: 1,
  },
  contextSkill: {
    color: '#00d4ff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contextLesson: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  contextXP: {
    color: '#10b981',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 12,
    color: '#fff',
    fontSize: 14,
    padding: 16,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  charCounter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  charText: {
    color: '#999',
    fontSize: 12,
  },
  charError: {
    color: '#ff4444',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  infoText: {
    color: '#00d4ff',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#333',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: '#00d4ff',
    flexDirection: 'row',
  },
  shareButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.6,
  },
  shareButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
  shareIcon: {
    marginRight: 8,
  },
});
