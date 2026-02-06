import { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../../src/constants/Colors';
import { useBlockedUsers, useUnblock } from '../../src/hooks/api';
import { getErrorMessage } from '../../src/utils/errorHandler';

interface BlockedUser {
  userId: string;
  appId: string | null;
  displayName: string;
  profileImageUrl: string | null;
  blockedAt: string;
}

export default function BlockedUsersScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useBlockedUsers();

  const unblock = useUnblock();

  const blockedUsers = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.items);
  }, [data]);

  const handleUnblock = (user: BlockedUser) => {
    Alert.alert(
      'ブロック解除',
      `${user.displayName}のブロックを解除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '解除する',
          onPress: async () => {
            try {
              await unblock.mutateAsync(user.userId);
              Alert.alert('完了', 'ブロックを解除しました');
            } catch (error) {
              Alert.alert('エラー', getErrorMessage(error));
            }
          },
        },
      ]
    );
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const styles = createStyles(colors);

  const renderUser = ({ item }: { item: BlockedUser }) => (
    <View style={styles.userItem}>
      {item.profileImageUrl ? (
        <Image source={{ uri: item.profileImageUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarText}>
            {(item.displayName || '?').charAt(0)}
          </Text>
        </View>
      )}
      <View style={styles.userInfo}>
        <Text style={styles.displayName}>{item.displayName}</Text>
        {item.appId && <Text style={styles.appId}>@{item.appId}</Text>}
      </View>
      <TouchableOpacity
        style={styles.unblockButton}
        onPress={() => handleUnblock(item)}
        disabled={unblock.isPending}
      >
        <Text style={styles.unblockButtonText}>解除</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator color={colors.accent} />
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

  if (blockedUsers.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.emptyText}>ブロック中のユーザーはいません</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={blockedUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
      />
    </View>
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
    userItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    avatarPlaceholder: {
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
      flex: 1,
      marginLeft: 12,
    },
    displayName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    appId: {
      fontSize: 13,
      color: colors.textMuted,
    },
    unblockButton: {
      backgroundColor: colors.danger + '15',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    unblockButtonText: {
      color: colors.danger,
      fontSize: 14,
      fontWeight: '600',
    },
    footerLoader: {
      paddingVertical: 16,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textMuted,
    },
  });
