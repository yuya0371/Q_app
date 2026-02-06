import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '../../src/constants/Colors';
import { useDeleteAccount } from '../../src/hooks/api';
import { getErrorMessage } from '../../src/utils/errorHandler';

export default function DeleteAccountScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const [confirmation, setConfirmation] = useState('');
  const deleteAccount = useDeleteAccount();

  const isConfirmationValid = confirmation === 'DELETE';

  const handleDelete = () => {
    Alert.alert(
      '最終確認',
      'この操作は取り消せません。本当にアカウントを削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount.mutateAsync();
              Alert.alert(
                'アカウント削除',
                'アカウントの削除処理を開始しました。ご利用ありがとうございました。',
                [
                  {
                    text: 'OK',
                    onPress: () => router.replace('/(auth)/login'),
                  },
                ]
              );
            } catch (error) {
              Alert.alert('エラー', getErrorMessage(error));
            }
          },
        },
      ]
    );
  };

  const styles = createStyles(colors);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>アカウント削除について</Text>
          <Text style={styles.warningText}>
            アカウントを削除すると、以下のデータがすべて削除されます：
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>- プロフィール情報</Text>
            <Text style={styles.bulletItem}>- 投稿した回答</Text>
            <Text style={styles.bulletItem}>- フォロー/フォロワー関係</Text>
            <Text style={styles.bulletItem}>- リアクション履歴</Text>
            <Text style={styles.bulletItem}>- ブロックリスト</Text>
          </View>
          <Text style={[styles.warningText, styles.warningBold]}>
            この操作は取り消すことができません。
          </Text>
        </View>

        <View style={styles.confirmSection}>
          <Text style={styles.confirmLabel}>
            削除を確認するには「DELETE」と入力してください
          </Text>
          <TextInput
            style={styles.confirmInput}
            value={confirmation}
            onChangeText={setConfirmation}
            placeholder="DELETE"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.deleteButton,
            !isConfirmationValid && styles.deleteButtonDisabled,
          ]}
          onPress={handleDelete}
          disabled={!isConfirmationValid || deleteAccount.isPending}
        >
          {deleteAccount.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.deleteButtonText}>アカウントを削除する</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>キャンセル</Text>
        </TouchableOpacity>
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
      padding: 16,
    },
    warningBox: {
      backgroundColor: colors.danger + '15',
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.danger + '30',
    },
    warningTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.danger,
      marginBottom: 12,
    },
    warningText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
      marginBottom: 8,
    },
    warningBold: {
      fontWeight: '600',
      marginTop: 8,
    },
    bulletList: {
      marginVertical: 8,
    },
    bulletItem: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 24,
      paddingLeft: 8,
    },
    confirmSection: {
      marginBottom: 24,
    },
    confirmLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    confirmInput: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      textAlign: 'center',
      letterSpacing: 4,
      fontWeight: '600',
    },
    deleteButton: {
      backgroundColor: colors.danger,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginBottom: 12,
    },
    deleteButtonDisabled: {
      backgroundColor: colors.danger + '50',
    },
    deleteButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButton: {
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    cancelButtonText: {
      color: colors.textMuted,
      fontSize: 16,
    },
  });
