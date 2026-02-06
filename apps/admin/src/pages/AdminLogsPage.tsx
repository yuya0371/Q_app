import { useState } from 'react';
import { useAdminLogs } from '../hooks/useAdminApi';

const actionLabels: Record<string, string> = {
  CREATE_QUESTION: 'お題作成',
  SET_DAILY_QUESTION: '今日のお題設定',
  ADD_NG_WORD: 'NGワード追加',
  DELETE_NG_WORD: 'NGワード削除',
  UPDATE_REPORT: '通報対応',
  REVIEW_SUBMISSION: '提案審査',
  BAN_USER: 'ユーザーBAN',
  UNBAN_USER: 'BAN解除',
  REVIEW_FLAGGED_POST: 'フラグ投稿審査',
};

const actionColors: Record<string, string> = {
  CREATE_QUESTION: 'bg-blue-100 text-blue-800',
  SET_DAILY_QUESTION: 'bg-purple-100 text-purple-800',
  ADD_NG_WORD: 'bg-orange-100 text-orange-800',
  DELETE_NG_WORD: 'bg-orange-100 text-orange-800',
  UPDATE_REPORT: 'bg-yellow-100 text-yellow-800',
  REVIEW_SUBMISSION: 'bg-green-100 text-green-800',
  BAN_USER: 'bg-red-100 text-red-800',
  UNBAN_USER: 'bg-green-100 text-green-800',
  REVIEW_FLAGGED_POST: 'bg-yellow-100 text-yellow-800',
};

type FilterAction = 'all' | string;

export default function AdminLogsPage() {
  const [filter, setFilter] = useState<FilterAction>('all');

  const { data, isLoading, error } = useAdminLogs(filter === 'all' ? undefined : filter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-600">
        データの取得に失敗しました
      </div>
    );
  }

  const logs = data?.items || [];

  const filterOptions = [
    { value: 'all', label: 'すべて' },
    { value: 'BAN_USER', label: 'BAN' },
    { value: 'UNBAN_USER', label: 'BAN解除' },
    { value: 'ADD_NG_WORD', label: 'NGワード' },
    { value: 'UPDATE_REPORT', label: '通報' },
    { value: 'REVIEW_SUBMISSION', label: '提案審査' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">操作ログ</h1>
        <div className="flex gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                filter === option.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg bg-white shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                日時
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                操作
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                実行者
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                対象
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                詳細
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  操作ログはありません
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.logId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('ja-JP')}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        actionColors[log.action] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {actionLabels[log.action] || log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {log.adminEmail || log.adminId.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.targetType && (
                      <span>
                        {log.targetType}: {log.targetId?.slice(0, 12)}
                        {log.targetId && log.targetId.length > 12 ? '...' : ''}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.details && (
                      <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                        {JSON.stringify(log.details).slice(0, 50)}
                        {JSON.stringify(log.details).length > 50 ? '...' : ''}
                      </code>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        ※ 操作ログは90日後に自動削除されます
      </div>
    </div>
  );
}
