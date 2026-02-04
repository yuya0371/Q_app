import { useState } from 'react'

interface Report {
  id: string
  reporterId: string
  targetType: 'user' | 'answer'
  targetId: string
  targetContent?: string
  category: string
  description?: string
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  createdAt: string
}

const mockReports: Report[] = [
  {
    id: '1',
    reporterId: 'reporter1',
    targetType: 'answer',
    targetId: 'answer123',
    targetContent: '不適切な回答内容がここに表示されます...',
    category: 'spam',
    description: 'スパム投稿です',
    status: 'pending',
    createdAt: '2024-01-15 10:30'
  },
  {
    id: '2',
    reporterId: 'reporter2',
    targetType: 'user',
    targetId: 'bad_user',
    category: 'harassment',
    description: '繰り返し嫌がらせをしています',
    status: 'pending',
    createdAt: '2024-01-15 09:00'
  },
  {
    id: '3',
    reporterId: 'reporter3',
    targetType: 'answer',
    targetId: 'answer456',
    targetContent: '対応済みの投稿内容',
    category: 'inappropriate',
    status: 'resolved',
    createdAt: '2024-01-14 15:00'
  },
]

const categoryLabels: Record<string, string> = {
  spam: 'スパム',
  harassment: 'ハラスメント',
  inappropriate: '不適切なコンテンツ',
  impersonation: 'なりすまし',
  privacy: 'プライバシー侵害',
  other: 'その他',
}

export default function ReportsPage() {
  const [reports, setReports] = useState(mockReports)
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all')

  const handleResolve = (id: string) => {
    setReports(reports.map(r =>
      r.id === id ? { ...r, status: 'resolved' as const } : r
    ))
  }

  const handleDismiss = (id: string) => {
    setReports(reports.map(r =>
      r.id === id ? { ...r, status: 'dismissed' as const } : r
    ))
  }

  const filteredReports = reports.filter(r => {
    if (filter === 'all') return true
    if (filter === 'pending') return r.status === 'pending'
    return r.status === 'resolved' || r.status === 'dismissed'
  })

  const getStatusBadge = (status: Report['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      dismissed: 'bg-gray-100 text-gray-800',
    }
    const labels = {
      pending: '未対応',
      reviewed: '確認中',
      resolved: '対応済み',
      dismissed: '却下',
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
        {filteredReports.map((report) => (
          <div key={report.id} className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                    {report.targetType === 'user' ? 'ユーザー' : '投稿'}
                  </span>
                  <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-sm">
                    {categoryLabels[report.category]}
                  </span>
                  {getStatusBadge(report.status)}
                </div>

                {report.targetContent && (
                  <div className="bg-gray-50 rounded p-3 mb-3">
                    <p className="text-gray-700">{report.targetContent}</p>
                  </div>
                )}

                {report.description && (
                  <p className="text-gray-600 mb-2">理由: {report.description}</p>
                )}

                <div className="text-sm text-gray-500">
                  <span>対象: @{report.targetId}</span>
                  <span className="mx-2">•</span>
                  <span>報告者: @{report.reporterId}</span>
                  <span className="mx-2">•</span>
                  <span>{report.createdAt}</span>
                </div>
              </div>

              {report.status === 'pending' && (
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleResolve(report.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                  >
                    対応済み
                  </button>
                  <button
                    onClick={() => handleDismiss(report.id)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700"
                  >
                    却下
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
