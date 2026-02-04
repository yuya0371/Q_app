import { useState } from 'react'

interface User {
  id: string
  appId: string
  email: string
  displayName?: string
  status: 'active' | 'banned'
  createdAt: string
  answersCount: number
}

const mockUsers: User[] = [
  { id: '1', appId: 'tanaka', email: 'tanaka@example.com', displayName: '田中太郎', status: 'active', createdAt: '2024-01-01', answersCount: 45 },
  { id: '2', appId: 'yamada', email: 'yamada@example.com', displayName: '山田花子', status: 'active', createdAt: '2024-01-05', answersCount: 32 },
  { id: '3', appId: 'bad_user', email: 'bad@example.com', status: 'banned', createdAt: '2024-01-10', answersCount: 5 },
  { id: '4', appId: 'suzuki', email: 'suzuki@example.com', displayName: '鈴木一郎', status: 'active', createdAt: '2024-01-12', answersCount: 18 },
]

export default function UsersPage() {
  const [users, setUsers] = useState(mockUsers)
  const [searchQuery, setSearchQuery] = useState('')

  const handleBan = (id: string) => {
    setUsers(users.map(u =>
      u.id === id ? { ...u, status: 'banned' as const } : u
    ))
  }

  const handleUnban = (id: string) => {
    setUsers(users.map(u =>
      u.id === id ? { ...u, status: 'active' as const } : u
    ))
  }

  const filteredUsers = users.filter(u =>
    u.appId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ユーザー管理</h1>
      </div>

      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ユーザーID、メール、表示名で検索..."
          className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
      </div>

      <div className="rounded-lg bg-white shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ユーザー</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">メール</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">回答数</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">登録日</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">
                      {user.displayName || user.appId}
                    </p>
                    <p className="text-sm text-gray-500">@{user.appId}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {user.email}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status === 'active' ? 'アクティブ' : 'BAN'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {user.answersCount}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {user.createdAt}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-purple-600 hover:text-purple-800 text-sm font-medium mr-3">
                    詳細
                  </button>
                  {user.status === 'active' ? (
                    <button
                      onClick={() => handleBan(user.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      BAN
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnban(user.id)}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      BAN解除
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
