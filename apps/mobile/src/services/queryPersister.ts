import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';

// AsyncStorageのキー
const QUERY_CACHE_KEY = 'REACT_QUERY_CACHE';

// キャッシュの有効期限（24時間）
const CACHE_TIME = 1000 * 60 * 60 * 24;

/**
 * AsyncStorageを使用したReact Queryのpersister
 */
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: QUERY_CACHE_KEY,
  throttleTime: 1000, // 1秒に1回まで保存
});

/**
 * 永続化対応のQueryClientを作成
 */
export const createPersistedQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        staleTime: 1000 * 60 * 5, // 5分
        gcTime: CACHE_TIME, // 24時間（以前のcacheTime）
        networkMode: 'offlineFirst', // オフライン優先
      },
      mutations: {
        retry: 1,
        networkMode: 'offlineFirst',
      },
    },
  });
};

/**
 * 永続化設定
 */
export const persistOptions = {
  persister: asyncStoragePersister,
  maxAge: CACHE_TIME,
  // 永続化するクエリをフィルタリング（認証情報などは除外）
  dehydrateOptions: {
    shouldDehydrateQuery: (query: { queryKey: readonly unknown[] }) => {
      // 認証関連のクエリは永続化しない
      const key = query.queryKey[0];
      if (key === 'auth') return false;
      return true;
    },
  },
};
