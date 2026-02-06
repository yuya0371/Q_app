import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '../src/constants/Colors';
import { useCreateReport, REPORT_REASONS, ReportReason } from '../src/hooks/api/useReports';
import { getErrorMessage } from '../src/utils/errorHandler';

export default function ReportScreen() {
  const { targetType, targetId, targetName } = useLocalSearchParams<{
    targetType: 'user' | 'answer';
    targetId: string;
    targetName?: string;
  }>();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');

  const createReport = useCreateReport();

  const handleSubmit = async () => {
    if (!selectedReason || !targetType || !targetId) return;

    try {
      await createReport.mutateAsync({
        targetType,
        targetId,
        reason: selectedReason,
        details: details.trim() || undefined,
      });

      Alert.alert(
        '通報を受け付けました',
        'ご報告ありがとうございます。内容を確認し、適切に対応いたします。',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('エラー', getErrorMessage(error));
    }
  };

  const styles = createStyles(colors);

  const getTitle = () => {
    if (targetType === 'user') {
      return targetName ? `${targetName}を通報` : 'ユーザーを通報';
    }
    return '投稿を通報';
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: getTitle(),
          headerBackTitle: '戻る',
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>通報理由を選択してください</Text>

          <View style={styles.reasonList}>
            {REPORT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.value}
                style={[
                  styles.reasonItem,
                  selectedReason === reason.value && styles.reasonItemSelected,
                ]}
                onPress={() => setSelectedReason(reason.value)}
              >
                <View
                  style={[
                    styles.radio,
                    selectedReason === reason.value && styles.radioSelected,
                  ]}
                >
                  {selectedReason === reason.value && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <Text style={styles.reasonLabel}>{reason.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>詳細（任意）</Text>
          <TextInput
            style={styles.detailsInput}
            value={details}
            onChangeText={setDetails}
            placeholder="具体的な状況や問題点を記入してください"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            maxLength={1000}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{details.length}/1000</Text>

          <TouchableOpacity
            style={[
              styles.submitButton,
              !selectedReason && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!selectedReason || createReport.isPending}
          >
            {createReport.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>通報する</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.noteText}>
            虚偽の通報を繰り返した場合、アカウントが制限される可能性があります。
          </Text>
        </View>
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
    content: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 12,
      marginTop: 8,
    },
    reasonList: {
      backgroundColor: colors.card,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 24,
    },
    reasonItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    reasonItemSelected: {
      backgroundColor: colors.accent + '10',
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    radioSelected: {
      borderColor: colors.accent,
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.accent,
    },
    reasonLabel: {
      fontSize: 16,
      color: colors.text,
    },
    detailsInput: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 120,
    },
    charCount: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'right',
      marginTop: 4,
      marginBottom: 24,
    },
    submitButton: {
      backgroundColor: colors.danger,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginBottom: 16,
    },
    submitButtonDisabled: {
      backgroundColor: colors.danger + '50',
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    noteText: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 18,
    },
  });
