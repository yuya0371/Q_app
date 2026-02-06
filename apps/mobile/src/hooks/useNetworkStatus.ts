import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkStatus {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string | null;
  isReady: boolean;
}

/**
 * ネットワーク接続状態を監視するフック
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: null,
    isInternetReachable: null,
    type: null,
    isReady: false,
  });

  useEffect(() => {
    // 初期状態を取得
    NetInfo.fetch().then((state: NetInfoState) => {
      setStatus({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        isReady: true,
      });
    });

    // 接続状態の変更を監視
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setStatus({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        isReady: true,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return status;
}

/**
 * オンライン状態のみを返すシンプルなフック
 * 状態が確定するまではnullを返す
 */
export function useIsOnline(): boolean | null {
  const { isConnected, isInternetReachable, isReady } = useNetworkStatus();

  // 状態が確定するまではnullを返す
  if (!isReady) {
    return null;
  }

  // isInternetReachableがnullの場合はisConnectedを使用
  if (isInternetReachable === null) {
    return isConnected;
  }

  return isConnected && isInternetReachable;
}
