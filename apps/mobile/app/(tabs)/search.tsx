import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '../../src/constants/Colors';

// Mock search results
const mockUsers = [
  {
    userId: 'user1',
    appId: 'tanaka',
    displayName: '田中太郎',
    bio: 'コーヒー好き☕',
    isFollowing: false,
  },
  {
    userId: 'user2',
    appId: 'yamada',
    displayName: '山田花子',
    bio: '写真撮るのが趣味です',
    isFollowing: true,
  },
  {
    userId: 'user3',
    appId: 'suzuki',
    displayName: '鈴木一郎',
    bio: '',
    isFollowing: false,
  },
];

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<typeof mockUsers>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      // TODO: Implement actual API search
      await new Promise((resolve) => setTimeout(resolve, 500));
      // Filter mock data based on query
      const filtered = mockUsers.filter(
        (user) =>
          user.appId.toLowerCase().includes(query.toLowerCase()) ||
          user.displayName.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
    } catch (err) {
      // Handle error
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserPress = (appId: string) => {
    // TODO: Navigate to user profile
    // router.push(`/profile/${appId}`);
  };

  const styles = createStyles(colors);

  const renderUser = ({ item }: { item: (typeof mockUsers)[0] }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => handleUserPress(item.appId)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {(item.displayName || item.appId).charAt(0)}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.displayName}>
          {item.displayName || item.appId}
        </Text>
        <Text style={styles.appId}>@{item.appId}</Text>
        {item.bio ? <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text> : null}
      </View>
      <TouchableOpacity
        style={[
          styles.followButton,
          item.isFollowing && styles.followingButton,
        ]}
      >
        <Text
          style={[
            styles.followButtonText,
            item.isFollowing && styles.followingButtonText,
          ]}
        >
          {item.isFollowing ? 'フォロー中' : 'フォロー'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

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
          disabled={!query.trim() || isSearching}
        >
          {isSearching ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.searchButtonText}>検索</Text>
          )}
        </TouchableOpacity>
      </View>

      {hasSearched && !isSearching && results.length === 0 ? (
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
            ユーザー名またはアプリIDで検索できます
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
    bio: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    followButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    followingButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
    },
    followButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    followingButtonText: {
      color: colors.text,
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
