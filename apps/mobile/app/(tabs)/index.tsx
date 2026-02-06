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
  Alert,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../../src/constants/Colors';
import { useTodayQuestion, questionKeys } from '../../src/hooks/api/useQuestions';
import { useCreateAnswer, useTimeline, useAddReaction, useRemoveReaction, answerKeys } from '../../src/hooks/api/useAnswers';
import { useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '../../src/utils/errorHandler';
import { TimelineItem } from '../../src/components/TimelineItem';
import { SubmitQuestionModal } from '../../src/components/SubmitQuestionModal';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const queryClient = useQueryClient();

  const {
    data: todayData,
    isLoading: isLoadingQuestion,
    error: questionError,
    refetch: refetchQuestion,
  } = useTodayQuestion();

  const [answer, setAnswer] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const createAnswerMutation = useCreateAnswer();
  const addReactionMutation = useAddReaction();
  const removeReactionMutation = useRemoveReaction();

  const hasAnswered = todayData?.hasAnswered ?? false;

  // タイムラインデータ取得（回答済みの場合のみ）
  const {
    data: timelineData,
    isLoading: isLoadingTimeline,
    refetch: refetchTimeline,
  } = useTimeline(todayData?.date ?? '');

  const handleSubmit = async () => {
    if (!answer.trim() || !todayData?.question) return;

    try {
      await createAnswerMutation.mutateAsync({
        questionId: todayData.question.questionId,
        content: answer.trim(),
      });
      // 回答投稿後、今日の質問を再取得
      queryClient.invalidateQueries({ queryKey: questionKeys.today() });
      setAnswer('');
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      // ALREADY_ANSWEREDエラーの場合は特別なメッセージ
      if (errorMessage.includes('ALREADY_ANSWERED') || errorMessage.includes('すでに回答')) {
        Alert.alert('投稿できません', '今日はすでに回答済みです');
      } else {
        Alert.alert('エラー', errorMessage);
      }
    }
  };

  const isSubmitting = createAnswerMutation.isPending;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchQuestion(),
        hasAnswered ? refetchTimeline() : Promise.resolve(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleReactionChange = async (answerId: string, reaction: string | null) => {
    try {
      if (reaction) {
        await addReactionMutation.mutateAsync({ answerId, reactionType: reaction });
      } else {
        await removeReactionMutation.mutateAsync(answerId);
      }
      // タイムラインキャッシュを更新
      if (todayData?.date) {
        queryClient.invalidateQueries({ queryKey: answerKeys.timeline(todayData.date) });
      }
    } catch (err) {
      Alert.alert('エラー', getErrorMessage(err));
    }
  };

  const styles = createStyles(colors);

  // ローディング中
  if (isLoadingQuestion) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  // エラー時
  if (questionError) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>
          {getErrorMessage(questionError)}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetchQuestion()}>
          <Text style={styles.retryButtonText}>再試行</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 今日の質問が未公開または存在しない場合
  if (!todayData?.question) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.noQuestionIcon}>⏰</Text>
        <Text style={styles.noQuestionText}>今日の質問はまだ届いていません</Text>
        <Text style={styles.noQuestionSubtext}>
          通知をオンにして待っていてね
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetchQuestion()}>
          <Text style={styles.retryButtonText}>更新</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        <View style={styles.questionHeader}>
          <Text style={styles.questionLabel}>今日の質問</Text>
          <Text style={styles.questionDate}>{todayData.date}</Text>
        </View>
        <Text style={styles.questionText}>{todayData.question.text}</Text>
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
            maxLength={80}
            textAlignVertical="top"
          />
          <View style={styles.answerFooter}>
            <Text style={styles.charCount}>{answer.length}/80</Text>
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
        <View style={styles.answeredSection}>
          <View style={styles.answeredBadge}>
            <Text style={styles.answeredText}>✓ 回答済み</Text>
          </View>
          {/* 自分の回答を表示 */}
          {todayData.userAnswer && (
            <View style={styles.myAnswerCard}>
              <Text style={styles.myAnswerLabel}>あなたの回答</Text>
              <Text style={styles.myAnswerText}>{todayData.userAnswer.text}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.suggestButton} onPress={() => setShowSubmitModal(true)}>
            <Text style={styles.suggestLink}>お題を提案する</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Timeline */}
      {hasAnswered && (
        <View style={styles.timeline}>
          <Text style={styles.timelineTitle}>みんなの回答</Text>
          {isLoadingTimeline ? (
            <View style={styles.timelinePlaceholder}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.placeholderText}>読み込み中...</Text>
            </View>
          ) : timelineData?.items && timelineData.items.length > 0 ? (
            timelineData.items.map((item) => (
              <TimelineItem
                key={item.answerId}
                item={item}
                onReactionChange={handleReactionChange}
              />
            ))
          ) : (
            <View style={styles.timelinePlaceholder}>
              <Text style={styles.placeholderText}>
                まだ回答がありません
              </Text>
            </View>
          )}
        </View>
      )}

      {/* 未回答時のロック表示 */}
      {!hasAnswered && (
        <View style={styles.lockedSection}>
          <Text style={styles.lockedIcon}>🔒</Text>
          <Text style={styles.lockedText}>
            回答するとみんなの回答が見れるようになります
          </Text>
        </View>
      )}

      {/* お題提案モーダル */}
      <SubmitQuestionModal
        visible={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
      />
    </ScrollView>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    content: {
      padding: 16,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: colors.textMuted,
    },
    errorText: {
      fontSize: 16,
      color: colors.danger,
      textAlign: 'center',
      marginBottom: 16,
    },
    retryButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    noQuestionIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    noQuestionText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    noQuestionSubtext: {
      fontSize: 14,
      color: colors.textMuted,
      marginBottom: 24,
      textAlign: 'center',
    },
    questionCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    questionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    questionLabel: {
      fontSize: 12,
      color: colors.accent,
      fontWeight: '600',
    },
    questionDate: {
      fontSize: 12,
      color: colors.textMuted,
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
    answeredSection: {
      marginBottom: 24,
    },
    answeredBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    answeredText: {
      color: colors.success,
      fontWeight: '600',
    },
    myAnswerCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    myAnswerLabel: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 8,
    },
    myAnswerText: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 24,
    },
    suggestButton: {
      alignItems: 'center',
      padding: 12,
    },
    suggestLink: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: '500',
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
    timelinePlaceholder: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 12,
      padding: 24,
      alignItems: 'center',
    },
    placeholderText: {
      fontSize: 14,
      color: colors.textMuted,
    },
    lockedSection: {
      alignItems: 'center',
      padding: 32,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 16,
      marginBottom: 24,
    },
    lockedIcon: {
      fontSize: 32,
      marginBottom: 12,
    },
    lockedText: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
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
