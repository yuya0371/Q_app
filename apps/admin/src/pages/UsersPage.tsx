import { useState } from 'react';
import { useAdminUsers, useBanUser, useUnbanUser } from '../hooks/useAdminApi';

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const { data, isLoading, error } = useAdminUsers(debouncedQuery || undefined);
  const banUser = useBanUser();
  const unbanUser = useUnbanUser();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedQuery(searchQuery);
  };

  const handleBan = (userId: string) => {
    if (!confirm('このユーザーをBANしますか？')) return;
    banUser.mutate(userId);
  };

  const handleUnban = (userId: string) => {
    if (!confirm('このユーザーのBANを解除しますか？')) return;
    unbanUser.mutate(userId);
  };

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-600">
        データの取得に失敗しました
      </div>
    );
  }

  const users = data?.items || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ユーザー管理</h1>
      </div>

      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ユーザーID、メール、表示名で検索..."
          className="flex-1 max-w-md rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          検索
        </button>
      </form>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      ) : (
        <div className="rounded-lg bg-white shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ユーザー
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  メール
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  回答数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  登録日
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {debouncedQuery ? '該当するユーザーが見つかりません' : '検索してください'}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.userId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.displayName || user.appId || 'Unknown'}
                        </p>
                        {user.appId && <p className="text-sm text-gray-500">@{user.appId}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.email || '-'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.status === 'active' ? 'アクティブ' : 'BAN'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.answersCount ?? 0}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ja-JP') : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.status === 'active' ? (
                        <button
                          onClick={() => handleBan(user.userId)}
                          disabled={banUser.isPending}
                          className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                        >
                          BAN
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnban(user.userId)}
                          disabled={unbanUser.isPending}
                          className="text-green-600 hover:text-green-800 text-sm font-medium disabled:opacity-50"
                        >
                          BAN解除
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
