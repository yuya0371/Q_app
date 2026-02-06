import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';

/**
 * 認証状態のハイドレーション（SecureStoreからの復元）完了を待つフック
 * アプリ起動時にSecureStoreから認証情報を復元する前にUIを表示すると
 * 一瞬ログイン画面が表示されてしまうため、このフックで復元完了を待つ
 */
export function useAuthHydration(): boolean {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // zustand/persist の rehydrate 完了を待つ
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    // 既にハイドレーション済みの場合
    if (useAuthStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    return () => {
      unsubscribe();
    };
  }, []);

  return isHydrated;
}
