import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useIsOnline } from '../hooks/useNetworkStatus';
import { useStyles } from '../hooks/useStyles';

/**
 * オフライン状態を表示するバナーコンポーネント
 */
export function OfflineBanner() {
  const isOnline = useIsOnline();
  const { colors, spacing } = useStyles();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // 状態が確定するまでアニメーションしない
    if (isOnline === null) {
      return;
    }

    if (isOnline === false) {
      // オフラインになったらレンダリングを開始してアニメーション
      setShouldRender(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // オンラインに戻ったらアニメーション後にレンダリング停止
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShouldRender(false);
      });
    }
  }, [isOnline, slideAnim]);

  // レンダリング不要な場合は何も表示しない
  if (!shouldRender) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.danger,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.content, { paddingHorizontal: spacing.md }]}>
        <Text style={styles.text}>オフラインです</Text>
        <Text style={styles.subText}>接続を確認してください</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingTop: 48, // SafeAreaの分
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  subText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginLeft: 8,
  },
});
