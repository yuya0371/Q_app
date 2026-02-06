import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../../src/constants/Colors';
import { useMyAnswers, useRestoreAnswer } from '../../src/hooks/api/useAnswers';
import { getErrorMessage } from '../../src/utils/errorHandler';

interface AnswerItem {
  answerId: string;
  date: string;
  questionText: string;
  text: string;
  isOnTime: boolean;
  lateMinutes: number;
  isDeleted: boolean;
  createdAt: string;
  deletedAt?: string;
}

export default function AnswerHistoryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMyAnswers();

  const restoreMutation = useRestoreAnswer();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleRestore = (answerId: string) => {
    Alert.alert(
      '回答を復活',
      'この回答を復活しますか？タイムラインに再び表示されます。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '復活する',
          onPress: async () => {
            setRestoringId(answerId);
            try {
              await restoreMutation.mutateAsync(answerId);
              Alert.alert('完了', '回答を復活しました');
            } catch (err) {
              Alert.alert('エラー', getErrorMessage(err));
            } finally {
              setRestoringId(null);
            }
          },
        },
      ]
    );
  };

  const styles = createStyles(colors);

  // フラット化された回答リスト
  const answers = data?.pages.flatMap((page) => page.items) ?? [];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatLateMinutes = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      return `${hours}h+遅刻`;
    }
    return `+${minutes}分`;
  };

  const renderAnswer = ({ item }: { item: AnswerItem }) => {
    return (
      <View style={styles.answerCard}>
        <View style={styles.answerHeader}>
          <Text style={styles.answerDate}>{item.date}</Text>
          {item.isDeleted ? (
            <View style={styles.deletedBadge}>
              <Text style={styles.deletedText}>削除済み</Text>
            </View>
          ) : !item.isOnTime ? (
            <View style={styles.lateBadge}>
              <Text style={styles.lateText}>{formatLateMinutes(item.lateMinutes)}</Text>
            </View>
          ) : (
            <View style={styles.onTimeBadge}>
              <Text style={styles.onTimeText}>On-time</Text>
            </View>
          )}
        </View>

        <Text style={styles.questionText}>{item.questionText}</Text>

        {item.isDeleted ? (
          <View style={styles.deletedContent}>
            <Text style={styles.deletedContentText}>この回答は削除されました</Text>
            <TouchableOpacity
              style={styles.restoreButton}
              onPress={() => handleRestore(item.answerId)}
              disabled={restoringId === item.answerId}
            >
              {restoringId === item.answerId ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Text style={styles.restoreButtonText}>復活する</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.answerText}>{item.text}</Text>
        )}
      </View>
    );
  };

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>📝</Text>
        <Text style={styles.emptyTitle}>回答がありません</Text>
        <Text style={styles.emptyText}>質問に回答すると、ここに履歴が表示されます</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{getErrorMessage(error)}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>再試行</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={[
        styles.listContent,
        answers.length === 0 && styles.emptyContainer,
      ]}
      data={answers}
      keyExtractor={(item) => item.date}
      renderItem={renderAnswer}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={colors.accent}
        />
      }
    />
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
    },
    listContent: {
      padding: 16,
    },
    emptyContainer: {
      flex: 1,
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
    answerCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    answerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    answerDate: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    deletedBadge: {
      backgroundColor: colors.danger + '20',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    deletedText: {
      fontSize: 11,
      color: colors.danger,
      fontWeight: '500',
    },
    lateBadge: {
      backgroundColor: colors.warning + '20',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    lateText: {
      fontSize: 11,
      color: colors.warning,
      fontWeight: '500',
    },
    onTimeBadge: {
      backgroundColor: colors.success + '20',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    onTimeText: {
      fontSize: 11,
      color: colors.success,
      fontWeight: '500',
    },
    questionText: {
      fontSize: 14,
      color: colors.accent,
      fontWeight: '500',
      marginBottom: 8,
    },
    answerText: {
      fontSize: 15,
      color: colors.text,
      lineHeight: 22,
    },
    deletedContent: {
      alignItems: 'center',
      paddingVertical: 8,
    },
    deletedContentText: {
      fontSize: 14,
      color: colors.textMuted,
      marginBottom: 12,
    },
    restoreButton: {
      borderWidth: 1,
      borderColor: colors.accent,
      borderRadius: 20,
      paddingHorizontal: 20,
      paddingVertical: 8,
    },
    restoreButtonText: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: '500',
    },
    loadingFooter: {
      padding: 16,
      alignItems: 'center',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
    },
  });
