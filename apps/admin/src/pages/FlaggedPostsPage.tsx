import { useState } from 'react';
import { useFlaggedPosts, useReviewFlaggedPost } from '../hooks/useAdminApi';

type FilterStatus = 'pending' | 'all';

export default function FlaggedPostsPage() {
  const [filter, setFilter] = useState<FilterStatus>('pending');

  const { data, isLoading, error } = useFlaggedPosts(filter === 'all' ? undefined : filter);
  const reviewPost = useReviewFlaggedPost();

  const handleApprove = (answerId: string) => {
    reviewPost.mutate({ answerId, status: 'approved' });
  };

  const handleRemove = (answerId: string) => {
    if (!confirm('この投稿を削除しますか？')) return;
    reviewPost.mutate({ answerId, status: 'removed' });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      removed: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      pending: '未確認',
      approved: '承認',
      removed: '削除済み',
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

  const posts = data?.items || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">フラグ付き投稿</h1>
        <div className="flex gap-2">
          {(['pending', 'all'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                filter === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'pending' ? '未確認のみ' : 'すべて'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="rounded-lg bg-white p-8 shadow text-center text-gray-500">
            フラグ付き投稿はありません
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.answerId} className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium text-gray-900">@{post.userAppId}</span>
                    {getStatusBadge(post.status)}
                  </div>

                  <div className="bg-gray-50 rounded p-3 mb-3">
                    <p className="text-gray-700">{post.displayText || post.text}</p>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-red-600 bg-red-50 px-2 py-1 rounded">
                      {post.flagReason}
                    </span>
                    <span className="text-gray-500">
                      {new Date(post.flaggedAt).toLocaleString('ja-JP')}
                    </span>
                  </div>
                </div>

                {post.status === 'pending' && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApprove(post.answerId)}
                      disabled={reviewPost.isPending}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      承認
                    </button>
                    <button
                      onClick={() => handleRemove(post.answerId)}
                      disabled={reviewPost.isPending}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                    >
                      削除
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
