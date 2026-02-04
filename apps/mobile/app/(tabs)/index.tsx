import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../../src/constants/Colors';

// Mock data for today's question
const mockQuestion = {
  id: 'q1',
  text: '最近一番嬉しかったことは何ですか？',
  publishedAt: new Date().toISOString(),
};

// Mock data for timeline
const mockAnswers = [
  {
    id: 'a1',
    userId: 'user1',
    appId: 'tanaka',
    displayName: '田中太郎',
    answerText: '友達と久しぶりに会えたこと！',
    createdAt: '2024-01-15T10:30:00Z',
    reactions: { '❤️': 5, '🔥': 2 },
  },
  {
    id: 'a2',
    userId: 'user2',
    appId: 'yamada',
    displayName: '山田花子',
    answerText: '新しいカフェで美味しいコーヒーを見つけたこと。お店の雰囲気も最高だった。',
    createdAt: '2024-01-15T09:15:00Z',
    reactions: { '❤️': 3, '😂': 1 },
  },
];

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);

  const handleSubmit = async () => {
    if (!answer.trim()) return;

    setIsSubmitting(true);
    try {
      // TODO: Implement actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setHasAnswered(true);
      setAnswer('');
    } catch (err) {
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // TODO: Refresh data
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } finally {
      setIsRefreshing(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={colors.accent}
        />
      }
    >
      {/* Today's Question Card */}
      <View style={styles.questionCard}>
        <Text style={styles.questionLabel}>今日の質問</Text>
        <Text style={styles.questionText}>{mockQuestion.text}</Text>
      </View>

      {/* Answer Input (show if not answered) */}
      {!hasAnswered ? (
        <View style={styles.answerSection}>
          <TextInput
            style={styles.answerInput}
            value={answer}
            onChangeText={setAnswer}
            placeholder="あなたの回答を入力..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={300}
            textAlignVertical="top"
          />
          <View style={styles.answerFooter}>
            <Text style={styles.charCount}>{answer.length}/300</Text>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!answer.trim() || isSubmitting) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!answer.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>投稿</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.answeredBadge}>
          <Text style={styles.answeredText}>✓ 回答済み</Text>
          <TouchableOpacity>
            <Text style={styles.suggestLink}>お題を提案する</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Timeline */}
      <View style={styles.timeline}>
        <Text style={styles.timelineTitle}>みんなの回答</Text>
        {mockAnswers.map((item) => (
          <View key={item.id} style={styles.answerCard}>
            <View style={styles.answerHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.displayName.charAt(0)}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.displayName}>{item.displayName}</Text>
                <Text style={styles.appId}>@{item.appId}</Text>
              </View>
            </View>
            <Text style={styles.answerContent}>{item.answerText}</Text>
            <View style={styles.reactions}>
              {Object.entries(item.reactions).map(([emoji, count]) => (
                <TouchableOpacity key={emoji} style={styles.reactionButton}>
                  <Text style={styles.reactionText}>
                    {emoji} {count}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.addReactionButton}>
                <Text style={styles.addReactionText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
    },
    questionCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    questionLabel: {
      fontSize: 12,
      color: colors.accent,
      fontWeight: '600',
      marginBottom: 8,
    },
    questionText: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      lineHeight: 28,
    },
    answerSection: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    answerInput: {
      fontSize: 16,
      color: colors.text,
      minHeight: 100,
      textAlignVertical: 'top',
    },
    answerFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
    },
    charCount: {
      fontSize: 12,
      color: colors.textMuted,
    },
    submitButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    answeredBadge: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
    },
    answeredText: {
      color: colors.success,
      fontWeight: '600',
    },
    suggestLink: {
      color: colors.accent,
      fontSize: 14,
    },
    timeline: {
      marginBottom: 24,
    },
    timelineTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    answerCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    answerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    userInfo: {
      marginLeft: 12,
    },
    displayName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    appId: {
      fontSize: 12,
      color: colors.textMuted,
    },
    answerContent: {
      fontSize: 15,
      color: colors.text,
      lineHeight: 22,
    },
    reactions: {
      flexDirection: 'row',
      marginTop: 12,
      gap: 8,
    },
    reactionButton: {
      backgroundColor: colors.backgroundSecondary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    reactionText: {
      fontSize: 14,
    },
    addReactionButton: {
      backgroundColor: colors.backgroundSecondary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    addReactionText: {
      fontSize: 14,
      color: colors.textMuted,
    },
  });
