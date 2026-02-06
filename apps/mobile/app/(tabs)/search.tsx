import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '../../src/constants/Colors';
import { useSearchUsers, useFollow, useUnfollow } from '../../src/hooks/api';
import { useDebouncedValue } from '../../src/hooks/useDebouncedValue';

interface SearchUser {
  userId: string;
  appId: string;
  displayName: string;
  profileImageUrl?: string | null;
  isPrivate: boolean;
}

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  const { data, isLoading, isFetching } = useSearchUsers(debouncedQuery);
  const follow = useFollow();
  const unfollow = useUnfollow();

  const handleSearch = useCallback(() => {
    if (query.trim().length >= 2) {
      setSearchQuery(query.trim());
    }
  }, [query]);

  const handleUserPress = (appId: string) => {
    router.push(`/user/${appId}`);
  };

  const styles = createStyles(colors);

  const renderUser = ({ item }: { item: SearchUser }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => handleUserPress(item.appId)}
    >
      {item.profileImageUrl ? (
        <Image source={{ uri: item.profileImageUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarText}>
            {(item.displayName || item.appId).charAt(0)}
          </Text>
        </View>
      )}
      <View style={styles.userInfo}>
        <Text style={styles.displayName}>
          {item.displayName || item.appId}
        </Text>
        <Text style={styles.appId}>@{item.appId}</Text>
      </View>
    </TouchableOpacity>
  );

  const showLoading = isLoading || isFetching;
  const hasSearched = searchQuery.length >= 2;
  const results = data?.users ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="ユーザーを検索..."
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={query.trim().length < 2 || showLoading}
        >
          {showLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.searchButtonText}>検索</Text>
          )}
        </TouchableOpacity>
      </View>

      {hasSearched && !showLoading && results.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>ユーザーが見つかりませんでした</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderUser}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.listContent}
        />
      )}

      {!hasSearched && (
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>
            ユーザー名で検索できます{'\n'}
            （2文字以上入力してください）
          </Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    searchContainer: {
      flexDirection: 'row',
      padding: 16,
      gap: 12,
    },
    searchInput: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 12,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: 16,
      borderRadius: 12,
      justifyContent: 'center',
    },
    searchButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    listContent: {
      padding: 16,
      paddingTop: 0,
    },
    userCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    avatarPlaceholder: {
      backgroundColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      color: '#FFFFFF',
      fontSize: 18,
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
      fontSize: 14,
      color: colors.textMuted,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 16,
    },
    hintContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    hintText: {
      color: colors.textMuted,
      fontSize: 14,
      textAlign: 'center',
    },
  });
