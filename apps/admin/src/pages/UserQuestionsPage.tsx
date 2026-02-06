import { useState } from 'react';
import { useQuestionSubmissions, useReviewSubmission } from '../hooks/useAdminApi';

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

export default function UserQuestionsPage() {
  const [filter, setFilter] = useState<FilterStatus>('pending');

  const { data, isLoading, error } = useQuestionSubmissions(filter === 'all' ? undefined : filter);
  const reviewSubmission = useReviewSubmission();

  const handleApprove = (submissionId: string) => {
    reviewSubmission.mutate({ submissionId, status: 'approved' });
  };

  const handleReject = (submissionId: string) => {
    if (!confirm('このお題を却下しますか？')) return;
    reviewSubmission.mutate({ submissionId, status: 'rejected' });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      pending: '審査待ち',
      approved: '承認済み',
      rejected: '却下',
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

  const submissions = data?.items || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ユーザー提案お題</h1>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                filter === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all'
                ? 'すべて'
                : status === 'pending'
                ? '審査待ち'
                : status === 'approved'
                ? '承認済み'
                : '却下'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {submissions.length === 0 ? (
          <div className="rounded-lg bg-white p-8 shadow text-center text-gray-500">
            該当する提案はありません
          </div>
        ) : (
          submissions.map((submission) => (
            <div key={submission.submissionId} className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-lg text-gray-900">{submission.text}</p>
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                    <span>@{submission.user?.appId || submission.userId}</span>
                    <span>{new Date(submission.submittedAt).toLocaleString('ja-JP')}</span>
                    {getStatusBadge(submission.status)}
                  </div>
                </div>
                {submission.status === 'pending' && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApprove(submission.submissionId)}
                      disabled={reviewSubmission.isPending}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      承認
                    </button>
                    <button
                      onClick={() => handleReject(submission.submissionId)}
                      disabled={reviewSubmission.isPending}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
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
