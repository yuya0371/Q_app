import { StyleSheet } from 'react-native';
import { ThemeColors } from '../constants/Colors';

// スペーシング定数
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// フォントサイズ定数
export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// 角丸定数
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// 共通スタイル生成関数
export const createCommonStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    // コンテナスタイル
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    containerPadded: {
      flex: 1,
      backgroundColor: colors.background,
      padding: spacing.md,
    },
    containerCentered: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // カードスタイル
    card: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardShadow: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },

    // テキストスタイル
    textLarge: {
      fontSize: fontSize.xl,
      fontWeight: '600',
      color: colors.text,
    },
    textMedium: {
      fontSize: fontSize.md,
      color: colors.text,
    },
    textSmall: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    textMuted: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
    },
    title: {
      fontSize: fontSize.xxl,
      fontWeight: '700',
      color: colors.text,
    },
    subtitle: {
      fontSize: fontSize.lg,
      fontWeight: '600',
      color: colors.text,
    },

    // ボタンスタイル
    buttonPrimary: {
      backgroundColor: colors.accent,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm + 4,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonPrimaryText: {
      color: '#FFFFFF',
      fontSize: fontSize.md,
      fontWeight: '600',
    },
    buttonSecondary: {
      backgroundColor: 'transparent',
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.accent,
      paddingVertical: spacing.sm + 4,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonSecondaryText: {
      color: colors.accent,
      fontSize: fontSize.md,
      fontWeight: '600',
    },
    buttonDisabled: {
      backgroundColor: colors.border,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm + 4,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonDisabledText: {
      color: colors.textMuted,
      fontSize: fontSize.md,
      fontWeight: '600',
    },

    // 入力フィールドスタイル
    input: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.sm + 4,
      paddingHorizontal: spacing.md,
      fontSize: fontSize.md,
      color: colors.text,
    },
    inputFocused: {
      borderColor: colors.accent,
    },
    inputError: {
      borderColor: colors.danger,
    },
    inputLabel: {
      fontSize: fontSize.sm,
      fontWeight: '500',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    inputErrorText: {
      fontSize: fontSize.xs,
      color: colors.danger,
      marginTop: spacing.xs,
    },

    // リスト/区切りスタイル
    divider: {
      height: 1,
      backgroundColor: colors.border,
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    // ユーティリティスタイル
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    center: {
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

// スタイル型のエクスポート
export type CommonStyles = ReturnType<typeof createCommonStyles>;
