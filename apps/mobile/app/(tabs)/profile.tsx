import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '../../src/constants/Colors';
import { useAuthStore } from '../../src/stores/authStore';

// Mock past answers
const mockPastAnswers = [
  {
    id: 'a1',
    questionText: '最近一番嬉しかったことは何ですか？',
    answerText: '友達と久しぶりに会えたこと！',
    date: '2024-01-15',
  },
  {
    id: 'a2',
    questionText: '今年チャレンジしたいことは？',
    answerText: '毎日30分読書をする習慣をつけたい',
    date: '2024-01-14',
  },
  {
    id: 'a3',
    questionText: '休日の過ごし方は？',
    answerText: 'カフェで読書か映画鑑賞。たまに友達と出かける',
    date: '2024-01-13',
  },
];

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const { user } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock user data
  const profileData = {
    appId: user?.appId || 'demo_user',
    displayName: user?.displayName || 'デモユーザー',
    bio: '毎日質問に答えてます！',
    profileImageUrl: user?.profileImageUrl,
    followersCount: 42,
    followingCount: 38,
    answersCount: mockPastAnswers.length,
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEditProfile = () => {
    // TODO: Navigate to edit profile screen
    // router.push('/profile/edit');
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
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {profileData.profileImageUrl ? (
            <Image
              source={{ uri: profileData.profileImageUrl }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {profileData.displayName.charAt(0)}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.displayName}>{profileData.displayName}</Text>
        <Text style={styles.appId}>@{profileData.appId}</Text>

        {profileData.bio ? (
          <Text style={styles.bio}>{profileData.bio}</Text>
        ) : null}

        <View style={styles.stats}>
          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statNumber}>{profileData.followersCount}</Text>
            <Text style={styles.statLabel}>フォロワー</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statNumber}>{profileData.followingCount}</Text>
            <Text style={styles.statLabel}>フォロー中</Text>
          </TouchableOpacity>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profileData.answersCount}</Text>
            <Text style={styles.statLabel}>回答</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Text style={styles.editButtonText}>プロフィールを編集</Text>
        </TouchableOpacity>
      </View>

      {/* Past Answers */}
      <View style={styles.answersSection}>
        <Text style={styles.sectionTitle}>過去の回答</Text>
        {mockPastAnswers.map((answer) => (
          <View key={answer.id} style={styles.answerCard}>
            <Text style={styles.answerDate}>{answer.date}</Text>
            <Text style={styles.answerQuestion}>{answer.questionText}</Text>
            <Text style={styles.answerText}>{answer.answerText}</Text>
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
      paddingBottom: 24,
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
    answerDate: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 8,
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
  });
