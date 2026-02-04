import { useState } from 'react'

interface FlaggedPost {
  id: string
  userId: string
  userAppId: string
  content: string
  reason: string
  flaggedAt: string
  status: 'pending' | 'approved' | 'removed'
}

const mockFlaggedPosts: FlaggedPost[] = [
  {
    id: '1',
    userId: 'user1',
    userAppId: 'tanaka',
    content: 'この投稿にはNGワードが含まれています...',
    reason: 'NGワード検出: spam',
    flaggedAt: '2024-01-15 10:30',
    status: 'pending'
  },
  {
    id: '2',
    userId: 'user2',
    userAppId: 'yamada',
    content: '別のフラグ付き投稿内容',
    reason: 'NGワード検出: 広告',
    flaggedAt: '2024-01-15 09:00',
    status: 'pending'
  },
  {
    id: '3',
    userId: 'user3',
    userAppId: 'suzuki',
    content: '確認済みの投稿',
    reason: 'NGワード検出: test',
    flaggedAt: '2024-01-14 15:00',
    status: 'approved'
  },
]

export default function FlaggedPostsPage() {
  const [posts, setPosts] = useState(mockFlaggedPosts)
  const [filter, setFilter] = useState<'all' | 'pending'>('pending')

  const handleApprove = (id: string) => {
    setPosts(posts.map(p =>
      p.id === id ? { ...p, status: 'approved' as const } : p
    ))
  }

  const handleRemove = (id: string) => {
    setPosts(posts.map(p =>
      p.id === id ? { ...p, status: 'removed' as const } : p
    ))
  }

  const filteredPosts = posts.filter(p =>
    filter === 'all' ? true : p.status === 'pending'
  )

  const getStatusBadge = (status: FlaggedPost['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      removed: 'bg-red-100 text-red-800',
    }
    const labels = {
      pending: '未確認',
      approved: '承認',
      removed: '削除済み',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

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
        {filteredPosts.length === 0 ? (
          <div className="rounded-lg bg-white p-8 shadow text-center text-gray-500">
            フラグ付き投稿はありません
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div key={post.id} className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium text-gray-900">@{post.userAppId}</span>
                    {getStatusBadge(post.status)}
                  </div>

                  <div className="bg-gray-50 rounded p-3 mb-3">
                    <p className="text-gray-700">{post.content}</p>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-red-600 bg-red-50 px-2 py-1 rounded">
                      {post.reason}
                    </span>
                    <span className="text-gray-500">{post.flaggedAt}</span>
                  </div>
                </div>

                {post.status === 'pending' && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApprove(post.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                    >
                      承認
                    </button>
                    <button
                      onClick={() => handleRemove(post.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
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
  )
}
