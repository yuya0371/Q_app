import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '../../src/constants/Colors';
import { useUserProfile, useFollow, useUnfollow } from '../../src/hooks/api/useUsers';
import { getErrorMessage } from '../../src/utils/errorHandler';

export default function UserProfileScreen() {
  const { appId } = useLocalSearchParams<{ appId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useUserProfile(appId || '');

  const followMutation = useFollow();
  const unfollowMutation = useUnfollow();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!profile) return;

    try {
      if (profile.isFollowing) {
        await unfollowMutation.mutateAsync(profile.userId);
      } else {
        await followMutation.mutateAsync(profile.userId);
      }
      refetch();
    } catch (err) {
      Alert.alert('エラー', getErrorMessage(err));
    }
  };

  const handleMenuPress = () => {
    Alert.alert(
      'メニュー',
      undefined,
      [
        {
          text: 'このユーザーを通報',
          onPress: () => {
            if (profile) {
              router.push({
                pathname: '/report',
                params: {
                  targetType: 'user',
                  targetId: profile.userId,
                  targetName: profile.displayName || profile.appId,
                },
              });
            }
          },
        },
        {
          text: profile?.isBlocked ? 'ブロック解除' : 'ブロック',
          style: 'destructive',
          onPress: () => {
            // TODO: タスク4-25 ブロック機能
            Alert.alert('準備中', 'ブロック機能は準備中です');
          },
        },
        { text: 'キャンセル', style: 'cancel' },
      ]
    );
  };

  const styles = createStyles(colors);

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

  if (!profile) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>ユーザーが見つかりません</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayName = profile.displayName || profile.appId || 'User';
  const initial = displayName.charAt(0).toUpperCase();
  const isFollowLoading = followMutation.isPending || unfollowMutation.isPending;

  const getFollowButtonStyle = () => {
    if (profile.isFollowing) {
      return [styles.followButton, styles.followingButton];
    }
    return [styles.followButton];
  };

  const getFollowButtonText = () => {
    if (profile.isFollowing && profile.isFollowedBy) {
      return 'フォロー中 ✓';
    }
    if (profile.isFollowing) {
      return 'フォロー中';
    }
    return 'フォローする';
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity onPress={handleMenuPress} style={styles.menuButton}>
              <Text style={styles.menuIcon}>•••</Text>
            </TouchableOpacity>
          ),
        }}
      />
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
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {profile.profileImageUrl ? (
              <Image source={{ uri: profile.profileImageUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
            )}
          </View>

          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.appId}>@{profile.appId}</Text>

          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{profile.followingCount}</Text>
              <Text style={styles.statLabel}>フォロー中</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{profile.followerCount}</Text>
              <Text style={styles.statLabel}>フォロワー</Text>
            </View>
          </View>

          {/* Follow/Block status */}
          {profile.isBlockedBy ? (
            <View style={styles.blockedBanner}>
              <Text style={styles.blockedText}>このユーザーにブロックされています</Text>
            </View>
          ) : profile.isBlocked ? (
            <View style={styles.blockedBanner}>
              <Text style={styles.blockedText}>このユーザーをブロック中</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={getFollowButtonStyle()}
              onPress={handleFollowToggle}
              disabled={isFollowLoading}
            >
              {isFollowLoading ? (
                <ActivityIndicator size="small" color={profile.isFollowing ? colors.text : '#FFFFFF'} />
              ) : (
                <Text
                  style={[
                    styles.followButtonText,
                    profile.isFollowing && styles.followingButtonText,
                  ]}
                >
                  {getFollowButtonText()}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Mutual follow indicator */}
        {profile.isFollowing && profile.isFollowedBy && (
          <View style={styles.mutualBanner}>
            <Text style={styles.mutualText}>お互いにフォローしています</Text>
          </View>
        )}
      </ScrollView>
    </>
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
    menuButton: {
      padding: 8,
    },
    menuIcon: {
      fontSize: 18,
      color: colors.text,
      fontWeight: 'bold',
    },
    header: {
      alignItems: 'center',
      padding: 24,
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
    followButton: {
      backgroundColor: colors.accent,
      borderRadius: 20,
      paddingHorizontal: 32,
      paddingVertical: 10,
      minWidth: 140,
      alignItems: 'center',
    },
    followingButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
    },
    followButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 16,
    },
    followingButtonText: {
      color: colors.text,
    },
    blockedBanner: {
      backgroundColor: colors.danger + '20',
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    blockedText: {
      color: colors.danger,
      fontSize: 14,
    },
    mutualBanner: {
      backgroundColor: colors.accent + '10',
      padding: 12,
      margin: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    mutualText: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: '500',
    },
  });
