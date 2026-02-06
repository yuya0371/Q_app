import { useState } from 'react';
import { useReports, useUpdateReport } from '../hooks/useAdminApi';

type FilterStatus = 'all' | 'pending' | 'resolved';

const categoryLabels: Record<string, string> = {
  spam: 'スパム',
  harassment: 'ハラスメント',
  hate_speech: 'ヘイトスピーチ',
  inappropriate_content: '不適切なコンテンツ',
  impersonation: 'なりすまし',
  other: 'その他',
};

export default function ReportsPage() {
  const [filter, setFilter] = useState<FilterStatus>('pending');

  const { data, isLoading, error } = useReports(filter === 'all' ? undefined : filter);
  const updateReport = useUpdateReport();

  const handleResolve = (reportId: string) => {
    updateReport.mutate({ reportId, status: 'resolved' });
  };

  const handleDismiss = (reportId: string) => {
    updateReport.mutate({ reportId, status: 'dismissed' });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      dismissed: 'bg-gray-100 text-gray-800',
    };
    const labels: Record<string, string> = {
      pending: '未対応',
      reviewed: '確認中',
      resolved: '対応済み',
      dismissed: '却下',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

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

  const reports = data?.items || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">通報管理</h1>
        <div className="flex gap-2">
          {(['all', 'pending', 'resolved'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                filter === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'すべて' : status === 'pending' ? '未対応' : '対応済み'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {reports.length === 0 ? (
          <div className="rounded-lg bg-white p-8 shadow text-center text-gray-500">
            該当する通報はありません
          </div>
        ) : (
          reports.map((report) => (
            <div key={report.reportId} className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                      {report.targetType === 'user' ? 'ユーザー' : '投稿'}
                    </span>
                    <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-sm">
                      {categoryLabels[report.category] || report.category}
                    </span>
                    {getStatusBadge(report.status)}
                  </div>

                  {report.description && (
                    <p className="text-gray-600 mb-2">理由: {report.description}</p>
                  )}

                  <div className="text-sm text-gray-500">
                    <span>対象: {report.targetId}</span>
                    <span className="mx-2">•</span>
                    <span>報告者: @{report.reporter?.appId || report.reporterId}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(report.createdAt).toLocaleString('ja-JP')}</span>
                  </div>
                </div>

                {report.status === 'pending' && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleResolve(report.reportId)}
                      disabled={updateReport.isPending}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      対応済み
                    </button>
                    <button
                      onClick={() => handleDismiss(report.reportId)}
                      disabled={updateReport.isPending}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
                    >
                      却下
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
