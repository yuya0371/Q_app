import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { useColorScheme } from 'react-native';
import { useSubmitQuestion } from '../hooks/api/useQuestions';
import { getErrorMessage } from '../utils/errorHandler';

interface SubmitQuestionModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SubmitQuestionModal({ visible, onClose }: SubmitQuestionModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const styles = createStyles(colors);

  const [text, setText] = useState('');
  const submitMutation = useSubmitQuestion();

  const handleSubmit = async () => {
    if (!text.trim()) return;

    // URLチェック（簡易）
    const urlPattern = /(https?:\/\/|www\.)/i;
    if (urlPattern.test(text)) {
      Alert.alert('エラー', 'URLを含めることはできません');
      return;
    }

    try {
      await submitMutation.mutateAsync(text.trim());
      Alert.alert('送信完了', 'お題を提案しました。採用されるとみんなに届きます！', [
        { text: 'OK', onPress: () => {
          setText('');
          onClose();
        }},
      ]);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      if (errorMessage.includes('ALREADY_SUBMITTED') || errorMessage.includes('すでに提案')) {
        Alert.alert('送信できません', '今日はすでにお題を提案済みです');
      } else if (errorMessage.includes('NOT_ANSWERED') || errorMessage.includes('回答していません')) {
        Alert.alert('送信できません', '今日の質問に回答してからお題を提案してください');
      } else {
        Alert.alert('エラー', errorMessage);
      }
    }
  };

  const handleClose = () => {
    setText('');
    onClose();
  };

  const isSubmitting = submitMutation.isPending;
  const canSubmit = text.trim().length > 0 && !isSubmitting;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <Text style={styles.title}>お題を提案する</Text>
              <TouchableOpacity onPress={handleClose}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.description}>
              あなたのお題が採用されると、みんなに届きます。
            </Text>

            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="質問を入力してください"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={80}
              textAlignVertical="top"
              autoFocus
            />

            <View style={styles.footer}>
              <Text style={styles.charCount}>{text.length}/80</Text>
              <TouchableOpacity
                style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={!canSubmit}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>送信</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
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
    keyboardView: {
      width: '100%',
      alignItems: 'center',
    },
    container: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      width: '90%',
      maxWidth: 400,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 5,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      fontSize: 20,
      color: colors.textMuted,
      padding: 4,
    },
    description: {
      fontSize: 14,
      color: colors.textMuted,
      marginBottom: 16,
    },
    input: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.text,
      minHeight: 100,
      textAlignVertical: 'top',
      borderWidth: 1,
      borderColor: colors.border,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 16,
    },
    charCount: {
      fontSize: 12,
      color: colors.textMuted,
    },
    submitButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 20,
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
  });

export default SubmitQuestionModal;
