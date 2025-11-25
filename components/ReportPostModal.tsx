import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Text } from './Themed';
import { usePostInteraction, type ReportCategory } from '@/hooks/usePostInteraction';

const { width } = Dimensions.get('window');

interface ReportPostModalProps {
  visible: boolean;
  postId: number;
  postAuthorId?: string;
  currentUserId?: string;
  onClose: () => void;
  onReportSubmitted?: () => void;
}

const REPORT_CATEGORIES: Array<{ id: ReportCategory; label: string; icon: string; description: string }> = [
  {
    id: 'offensive',
    label: 'Offensive Content',
    icon: '😠',
    description: 'Contains hate speech or is offensive',
  },
  {
    id: 'spam',
    label: 'Spam',
    icon: '📧',
    description: 'Unsolicited or repetitive content',
  },
  {
    id: 'misinformation',
    label: 'Misinformation',
    icon: '❌',
    description: 'Contains false or misleading information',
  },
  {
    id: 'inappropriate',
    label: 'Inappropriate',
    icon: '⚠️',
    description: 'Not suitable for all audiences',
  },
  {
    id: 'other',
    label: 'Other',
    icon: '❓',
    description: 'Something else',
  },
];

/**
 * Modal para reportar contenido inapropiado en posts de la comunidad
 */
export const ReportPostModal: React.FC<ReportPostModalProps> = ({
  visible,
  postId,
  postAuthorId,
  currentUserId,
  onClose,
  onReportSubmitted,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { reportPost } = usePostInteraction();

  // Validar que no sea el autor del post
  const isOwnPost = postAuthorId === currentUserId;

  const handleSubmit = async () => {
    if (!selectedCategory || !description.trim()) {
      alert('Please select a category and provide details');
      return;
    }

    setLoading(true);
    const success = await reportPost(postId, selectedCategory, description);
    setLoading(false);

    if (success) {
      setSelectedCategory(null);
      setDescription('');
      onClose();
      onReportSubmitted?.();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <StyledText style={styles.title}>Report Content</StyledText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <StyledText style={styles.closeIcon}>✕</StyledText>
            </TouchableOpacity>
          </View>

          {/* Warning if own post */}
          {isOwnPost && (
            <View style={styles.warningBox}>
              <StyledText style={styles.warningText}>
                ℹ️ This is your own post. To delete it, please contact support.
              </StyledText>
            </View>
          )}

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Info Text */}
            <StyledText style={styles.infoText}>
              Help us understand what's wrong with this content. Your report will be reviewed by our moderation team.
            </StyledText>

            {/* Category Selection */}
            <StyledText style={styles.sectionTitle}>Select a reason:</StyledText>
            <View style={styles.categoriesContainer}>
              {REPORT_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryCard,
                    selectedCategory === category.id && styles.categoryCardSelected,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                  activeOpacity={0.7}
                >
                  <StyledText style={styles.categoryIcon}>{category.icon}</StyledText>
                  <View style={styles.categoryContent}>
                    <StyledText style={styles.categoryLabel}>{category.label}</StyledText>
                    <StyledText style={styles.categoryDescription}>{category.description}</StyledText>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      selectedCategory === category.id && styles.checkboxSelected,
                    ]}
                  >
                    {selectedCategory === category.id && (
                      <StyledText style={styles.checkmark}>✓</StyledText>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Description Text Input */}
            {selectedCategory && (
              <View style={styles.descriptionSection}>
                <StyledText style={styles.sectionTitle}>Provide additional details:</StyledText>
                <TextInput
                  style={styles.descriptionInput}
                  placeholder="Describe why you're reporting this content..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  value={description}
                  onChangeText={setDescription}
                  editable={!loading}
                />
                <StyledText style={styles.charCount}>
                  {description.length}/500
                </StyledText>
              </View>
            )}

            {/* Privacy Notice */}
            <View style={styles.privacyBox}>
              <StyledText style={styles.privacyText}>
                🔒 Your report is confidential. The content creator won't be notified of who reported them.
              </StyledText>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
              activeOpacity={0.7}
            >
              <StyledText style={styles.cancelButtonText}>Cancel</StyledText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!selectedCategory || !description.trim() || loading) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!selectedCategory || !description.trim() || loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <StyledText style={styles.submitButtonText}>Submit Report</StyledText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 18,
    color: '#6B7280',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '65%',
  },
  warningBox: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  warningText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  categoriesContainer: {
    gap: 10,
    marginBottom: 20,
  },
  categoryCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'flex-start',
    gap: 12,
  },
  categoryCardSelected: {
    backgroundColor: '#F3E8FF',
    borderColor: '#8B5CF6',
  },
  categoryIcon: {
    fontSize: 20,
    marginTop: 2,
  },
  categoryContent: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  checkmark: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: 'bold',
  },
  descriptionSection: {
    marginBottom: 20,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    textAlignVertical: 'top',
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  privacyBox: {
    padding: 12,
    backgroundColor: '#E0F2FE',
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#0EA5E9',
  },
  privacyText: {
    fontSize: 12,
    color: '#0C4A6E',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
});
