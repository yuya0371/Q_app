import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../../src/constants/Colors';
import { useMyProfile, useUpdateProfile } from '../../src/hooks/api';
import { getErrorMessage } from '../../src/utils/errorHandler';

type VisibilityOption = 'public' | 'followers' | 'mutual';

interface OptionConfig {
  value: VisibilityOption;
  title: string;
  description: string;
}

const OPTIONS: OptionConfig[] = [
  {
    value: 'public',
    title: '全員に公開',
    description: '誰でもあなたの回答を見ることができます',
  },
  {
    value: 'followers',
    title: 'フォロワーのみ',
    description: 'あなたをフォローしているユーザーのみ閲覧可能',
  },
  {
    value: 'mutual',
    title: '相互フォローのみ',
    description: 'お互いにフォローしているユーザーのみ閲覧可能',
  },
];

export default function VisibilitySettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const { data: profile, isLoading: isProfileLoading } = useMyProfile();
  const updateProfile = useUpdateProfile();

  // isPrivateをvisibility optionにマッピング
  // 現状の実装ではisPrivate: trueの場合は'mutual'相当として扱う
  const [selected, setSelected] = useState<VisibilityOption>('mutual');

  useEffect(() => {
    if (profile) {
      // isPrivate: true → 相互フォローのみ
      // isPrivate: false → 全員に公開
      setSelected(profile.isPrivate ? 'mutual' : 'public');
    }
  }, [profile]);

  const handleSelect = async (option: VisibilityOption) => {
    if (option === selected) return;

    try {
      // mutual と followers は isPrivate: true として扱う
      const isPrivate = option !== 'public';
      await updateProfile.mutateAsync({ isPrivate });
      setSelected(option);
      Alert.alert('完了', '公開範囲を変更しました');
    } catch (error) {
      Alert.alert('エラー', getErrorMessage(error));
    }
  };

  const styles = createStyles(colors);

  if (isProfileLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>
        あなたの回答を閲覧できる人を設定します
      </Text>

      <View style={styles.optionsContainer}>
        {OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionItem,
              selected === option.value && styles.optionItemSelected,
            ]}
            onPress={() => handleSelect(option.value)}
            disabled={updateProfile.isPending}
          >
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </View>
            <View
              style={[
                styles.radio,
                selected === option.value && styles.radioSelected,
              ]}
            >
              {selected === option.value && (
                <View style={styles.radioInner} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {updateProfile.isPending && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}

      <Text style={styles.noteText}>
        ※ 相互フォローのみの場合、タイムラインにはお互いにフォローしている人の回答のみが表示されます
      </Text>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 16,
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerText: {
      fontSize: 14,
      color: colors.textMuted,
      marginBottom: 24,
    },
    optionsContainer: {
      backgroundColor: colors.card,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    optionItemSelected: {
      backgroundColor: colors.accent + '10',
    },
    optionContent: {
      flex: 1,
    },
    optionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    optionDescription: {
      fontSize: 13,
      color: colors.textMuted,
    },
    radio: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 12,
    },
    radioSelected: {
      borderColor: colors.accent,
    },
    radioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.accent,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    noteText: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 16,
      paddingHorizontal: 8,
    },
  });
