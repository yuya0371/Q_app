import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { useColorScheme } from 'react-native';

const REACTIONS = ['❤️', '🔥', '😂', '🤔', '👀'] as const;

interface ReactionPickerProps {
  currentReaction: string | null;
  onSelect: (reaction: string | null) => void;
  onClose: () => void;
}

export function ReactionPicker({ currentReaction, onSelect, onClose }: ReactionPickerProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const styles = createStyles(colors);

  const handleSelect = (reaction: string) => {
    if (reaction === currentReaction) {
      // 同じリアクションを選択した場合は解除
      onSelect(null);
    } else {
      onSelect(reaction);
    }
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.container}>
          <View style={styles.picker}>
            {REACTIONS.map((reaction) => (
              <TouchableOpacity
                key={reaction}
                style={[
                  styles.reactionOption,
                  currentReaction === reaction && styles.reactionOptionActive,
                ]}
                onPress={() => handleSelect(reaction)}
              >
                <Text style={styles.reactionEmoji}>{reaction}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {currentReaction && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => onSelect(null)}
            >
              <Text style={styles.removeText}>リアクションを削除</Text>
            </TouchableOpacity>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 5,
    },
    picker: {
      flexDirection: 'row',
      gap: 12,
    },
    reactionOption: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
    },
    reactionOptionActive: {
      backgroundColor: colors.accent + '30',
      borderWidth: 2,
      borderColor: colors.accent,
    },
    reactionEmoji: {
      fontSize: 24,
    },
    removeButton: {
      marginTop: 16,
      paddingVertical: 12,
      alignItems: 'center',
    },
    removeText: {
      color: colors.danger,
      fontSize: 14,
    },
  });

export default ReactionPicker;
