import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '../../src/constants/Colors';
import { useMyProfile } from '../../src/hooks/api/useUsers';
import { useMyAnswers } from '../../src/hooks/api/useAnswers';
import { getErrorMessage } from '../../src/utils/errorHandler';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: profile,
    isLoading: isLoadingProfile,
    error: profileError,
    refetch: refetchProfile,
  } = useMyProfile();

  const {
    data: answersData,
    isLoading: isLoadingAnswers,
    refetch: refetchAnswers,
  } = useMyAnswers();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchProfile(), refetchAnswers()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const handleFollowing = () => {
    router.push('/profile/following');
  };

  const handleFollowers = () => {
    router.push('/profile/followers');
  };

  const handleViewAllAnswers = () => {
    router.push('/profile/answers');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  const handleShare = () => {
    router.push('/profile/share');
  };

  const styles = createStyles(colors);

  // ローディング中
  if (isLoadingProfile) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  // エラー時
  if (profileError) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{getErrorMessage(profileError)}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetchProfile()}>
          <Text style={styles.retryButtonText}>再試行</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 最新3件の回答を取得
  const recentAnswers = answersData?.pages?.[0]?.items?.slice(0, 3) ?? [];
  const displayName = profile?.displayName || profile?.appId || 'ユーザー';
  const initial = displayName.charAt(0).toUpperCase();

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
      {/* Header with icons */}
      <View style={styles.headerIcons}>
        <TouchableOpacity onPress={handleSettings} style={styles.iconButton}>
          <Text style={styles.iconText}>⚙️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} style={styles.iconButton}>
          <Text style={styles.iconText}>↗️</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {profile?.profileImageUrl ? (
            <Image source={{ uri: profile.profileImageUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          )}
        </View>

        <Text style={styles.displayName}>{displayName}</Text>
        <Text style={styles.appId}>@{profile?.appId || 'unknown'}</Text>

        {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

        <View style={styles.stats}>
          <TouchableOpacity style={styles.statItem} onPress={handleFollowing}>
            <Text style={styles.statNumber}>{profile?.followingCount ?? 0}</Text>
            <Text style={styles.statLabel}>フォロー中</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statItem} onPress={handleFollowers}>
            <Text style={styles.statNumber}>{profile?.followerCount ?? 0}</Text>
            <Text style={styles.statLabel}>フォロワー</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Text style={styles.editButtonText}>プロフィールを編集</Text>
        </TouchableOpacity>
      </View>

      {/* Past Answers */}
      <View style={styles.answersSection}>
        <Text style={styles.sectionTitle}>過去の回答</Text>
        {isLoadingAnswers ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : recentAnswers.length > 0 ? (
          <>
            {recentAnswers.map((answer) => (
              <View key={answer.date} style={styles.answerCard}>
                <View style={styles.answerHeader}>
                  <Text style={styles.answerDate}>{answer.date}</Text>
                  {answer.isDeleted && (
                    <View style={styles.deletedBadge}>
                      <Text style={styles.deletedText}>削除済み</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.answerQuestion}>{answer.questionText}</Text>
                {!answer.isDeleted && (
                  <Text style={styles.answerText}>{answer.text}</Text>
                )}
                {!answer.isOnTime && !answer.isDeleted && (
                  <Text style={styles.lateTag}>+{answer.lateMinutes}分</Text>
                )}
              </View>
            ))}
            <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAllAnswers}>
              <Text style={styles.viewAllText}>すべての回答を見る</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>まだ回答がありません</Text>
          </View>
        )}
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
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    content: {
      paddingBottom: 24,
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
    headerIcons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: 16,
      paddingTop: 8,
      gap: 8,
    },
    iconButton: {
      padding: 8,
    },
    iconText: {
      fontSize: 20,
    },
    header: {
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingBottom: 24,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    avatarContainer: {
      marginBottom: 16,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    avatarPlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      color: '#FFFFFF',
      fontSize: 36,
      fontWeight: '600',
    },
    displayName: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    appId: {
      fontSize: 16,
      color: colors.textMuted,
      marginBottom: 8,
    },
    bio: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 16,
      paddingHorizontal: 24,
    },
    stats: {
      flexDirection: 'row',
      marginBottom: 16,
    },
    statItem: {
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    statNumber: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textMuted,
    },
    editButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      paddingHorizontal: 24,
      paddingVertical: 10,
    },
    editButtonText: {
      color: colors.text,
      fontWeight: '500',
    },
    answersSection: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
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
      marginBottom: 8,
    },
    answerDate: {
      fontSize: 12,
      color: colors.textMuted,
    },
    deletedBadge: {
      backgroundColor: colors.danger + '20',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    deletedText: {
      fontSize: 10,
      color: colors.danger,
    },
    answerQuestion: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.accent,
      marginBottom: 8,
    },
    answerText: {
      fontSize: 15,
      color: colors.text,
      lineHeight: 22,
    },
    lateTag: {
      fontSize: 11,
      color: colors.warning,
      marginTop: 8,
    },
    viewAllButton: {
      alignItems: 'center',
      padding: 12,
    },
    viewAllText: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: '500',
    },
    emptyState: {
      alignItems: 'center',
      padding: 24,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 12,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textMuted,
    },
  });
