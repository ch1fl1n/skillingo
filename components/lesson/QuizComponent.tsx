import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Quiz, Question } from '@/types/lesson.types';

interface QuizComponentProps {
  quiz: Quiz;
  onComplete: (score: number, passed: boolean) => void;
  passingScore?: number;
}

export default function QuizComponent({ quiz, onComplete, passingScore = 70 }: QuizComponentProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  const handleAnswerSelect = (optionIndex: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: optionIndex,
    });
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      calculateAndShowResults();
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowFeedback(false);
    }
  };

  const calculateAndShowResults = () => {
    let correctCount = 0;
    quiz.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct_answer) {
        correctCount++;
      }
    });

    const score = (correctCount / totalQuestions) * 100;
    const passed = score >= passingScore;
    
    setShowResults(true);
    onComplete(score, passed);
  };

  const getCorrectCount = () => {
    return quiz.questions.filter((question, index) => 
      selectedAnswers[index] === question.correct_answer
    ).length;
  };

  const isAnswerCorrect = () => {
    return selectedAnswers[currentQuestionIndex] === currentQuestion.correct_answer;
  };

  if (showResults) {
    const correctCount = getCorrectCount();
    const score = (correctCount / totalQuestions) * 100;
    const passed = score >= passingScore;

    return (
      <View style={styles.resultsContainer}>
        <MaterialCommunityIcons
          name={passed ? 'check-circle' : 'close-circle'}
          size={80}
          color={passed ? '#10b981' : '#ef4444'}
        />
        <Text style={styles.resultsTitle}>
          {passed ? 'Congratulations!' : 'Keep Trying!'}
        </Text>
        <Text style={styles.resultsScore}>
          You scored {Math.round(score)}%
        </Text>
        <Text style={styles.resultsDetail}>
          {correctCount} out of {totalQuestions} correct
        </Text>
        {!passed && (
          <Text style={styles.resultsMessage}>
            You need at least {passingScore}% to pass. Review the lesson and try again!
          </Text>
        )}
      </View>
    );
  }

  const selectedAnswer = selectedAnswers[currentQuestionIndex];
  const hasSelected = selectedAnswer !== undefined;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.questionCounter}>
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` },
            ]}
          />
        </View>
      </View>

      <Text style={styles.questionText}>{currentQuestion.question}</Text>

      <View style={styles.optionsContainer}>
        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrect = index === currentQuestion.correct_answer;
          
          let optionStyle = [styles.optionButton];
          let optionTextStyle = [styles.optionText];

          if (showFeedback && isSelected) {
            if (isCorrect) {
              optionStyle.push(styles.correctOption);
              optionTextStyle.push(styles.correctOptionText);
            } else {
              optionStyle.push(styles.incorrectOption);
              optionTextStyle.push(styles.incorrectOptionText);
            }
          } else if (showFeedback && isCorrect) {
            optionStyle.push(styles.correctOption);
            optionTextStyle.push(styles.correctOptionText);
          } else if (isSelected) {
            optionStyle.push(styles.selectedOption);
            optionTextStyle.push(styles.selectedOptionText);
          }

          return (
            <TouchableOpacity
              key={index}
              style={optionStyle}
              onPress={() => !showFeedback && handleAnswerSelect(index)}
              disabled={showFeedback}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionNumber}>
                  <Text style={optionTextStyle}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                </View>
                <Text style={optionTextStyle}>{option}</Text>
                {showFeedback && isCorrect && (
                  <MaterialCommunityIcons name="check" size={24} color="#10b981" />
                )}
                {showFeedback && isSelected && !isCorrect && (
                  <MaterialCommunityIcons name="close" size={24} color="#ef4444" />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {showFeedback && currentQuestion.explanation && (
        <View style={[
          styles.explanationContainer,
          isAnswerCorrect() ? styles.correctExplanation : styles.incorrectExplanation
        ]}>
          <View style={styles.explanationHeader}>
            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color={isAnswerCorrect() ? '#10b981' : '#ef4444'}
            />
            <Text style={styles.explanationTitle}>Explanation</Text>
          </View>
          <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
        </View>
      )}

      {hasSelected && (
        <TouchableOpacity
          style={[styles.nextButton, !showFeedback && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!showFeedback}
        >
          <Text style={styles.nextButtonText}>
            {isLastQuestion ? 'See Results' : 'Next Question'}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  questionCounter: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 24,
    lineHeight: 28,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectedOption: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  correctOption: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  incorrectOption: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  selectedOptionText: {
    color: '#1e40af',
    fontWeight: '600',
  },
  correctOptionText: {
    color: '#059669',
    fontWeight: '600',
  },
  incorrectOptionText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  explanationContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  correctExplanation: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  incorrectExplanation: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#111827',
  },
  explanationText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  nextButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 20,
    marginBottom: 12,
  },
  resultsScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 8,
  },
  resultsDetail: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 16,
  },
  resultsMessage: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
});
