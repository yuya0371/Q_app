import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Colors } from '../constants/Colors';
import { useColorScheme } from 'react-native';
import { ReactionPicker } from './ReactionPicker';

interface TimelineUser {
  userId: string;
  appId: string;
  displayName?: string;
  profileImageUrl?: string;
}

interface TimelineItemData {
  answerId: string;
  user: TimelineUser;
  text: string;
  displayText: string;
  isOnTime: boolean;
  lateMinutes: number;
  createdAt: string;
  myReaction: string | null;
}

interface TimelineItemProps {
  item: TimelineItemData;
  onReactionChange: (answerId: string, reaction: string | null) => void;
}

export function TimelineItem({ item, onReactionChange }: TimelineItemProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const styles = createStyles(colors);

  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const handleReactionSelect = (reaction: string | null) => {
    onReactionChange(item.answerId, reaction);
    setShowReactionPicker(false);
  };

  const getInitial = (user: TimelineUser) => {
    if (user.displayName) return user.displayName.charAt(0).toUpperCase();
    return user.appId.charAt(0).toUpperCase();
  };

  const formatTime = (createdAt: string) => {
    const date = new Date(createdAt);
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  const formatLateMinutes = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      return `${hours}h+遅刻`;
    }
    return `+${minutes}分`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {item.user.profileImageUrl ? (
          <Image source={{ uri: item.user.profileImageUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{getInitial(item.user)}</Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.displayName}>
            {item.user.displayName || item.user.appId}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.appId}>@{item.user.appId}</Text>
            <Text style={styles.separator}>・</Text>
            <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
            {!item.isOnTime && (
              <>
                <Text style={styles.separator}>・</Text>
                <Text style={styles.lateTag}>{formatLateMinutes(item.lateMinutes)}</Text>
              </>
            )}
          </View>
        </View>
      </View>

      <Text style={styles.answerText}>{item.displayText}</Text>

      <View style={styles.reactionRow}>
        {item.myReaction ? (
          <TouchableOpacity
            style={[styles.reactionButton, styles.reactionButtonActive]}
            onPress={() => setShowReactionPicker(true)}
          >
            <Text style={styles.reactionEmoji}>{item.myReaction}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.addReactionButton}
            onPress={() => setShowReactionPicker(true)}
          >
            <Text style={styles.addReactionText}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      {showReactionPicker && (
        <ReactionPicker
          currentReaction={item.myReaction}
          onSelect={handleReactionSelect}
          onClose={() => setShowReactionPicker(false)}
        />
      )}
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    avatarPlaceholder: {
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
      flex: 1,
    },
    displayName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    appId: {
      fontSize: 12,
      color: colors.textMuted,
    },
    separator: {
      fontSize: 12,
      color: colors.textMuted,
      marginHorizontal: 4,
    },
    time: {
      fontSize: 12,
      color: colors.textMuted,
    },
    lateTag: {
      fontSize: 11,
      color: colors.warning,
      backgroundColor: colors.backgroundSecondary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    answerText: {
      fontSize: 15,
      color: colors.text,
      lineHeight: 22,
    },
    reactionRow: {
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
    reactionButtonActive: {
      backgroundColor: colors.accent + '20',
      borderWidth: 1,
      borderColor: colors.accent,
    },
    reactionEmoji: {
      fontSize: 16,
    },
    addReactionButton: {
      backgroundColor: colors.backgroundSecondary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    addReactionText: {
      fontSize: 16,
      color: colors.textMuted,
    },
  });

export default TimelineItem;
