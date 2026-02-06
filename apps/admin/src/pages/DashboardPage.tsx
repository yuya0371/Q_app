import { useDashboardStats } from '../hooks/useAdminApi'
import { Link } from 'react-router-dom'

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return 'たった今'
  if (diffMinutes < 60) return `${diffMinutes}分前`
  if (diffHours < 24) return `${diffHours}時間前`
  return `${diffDays}日前`
}

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboardStats()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <p className="text-red-600">データの取得に失敗しました</p>
      </div>
    )
  }

  const stats = data?.stats
  const statCards = [
    {
      name: '総ユーザー数',
      value: stats?.totalUsers.toLocaleString() ?? '-',
      icon: '👥',
      link: '/users',
    },
    {
      name: '今日の回答数',
      value: stats?.todayAnswers.toLocaleString() ?? '-',
      icon: '💬',
      link: null,
    },
    {
      name: '未対応の通報',
      value: stats?.pendingReports.toLocaleString() ?? '-',
      icon: '🚨',
      link: '/reports',
      highlight: (stats?.pendingReports ?? 0) > 0,
    },
    {
      name: '承認待ちお題',
      value: stats?.pendingSubmissions.toLocaleString() ?? '-',
      icon: '💡',
      link: '/user-questions',
      highlight: (stats?.pendingSubmissions ?? 0) > 0,
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">ダッシュボード</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat) => {
          const content = (
            <div
              key={stat.name}
              className={`rounded-lg bg-white p-6 shadow transition-shadow ${
                stat.link ? 'hover:shadow-md cursor-pointer' : ''
              } ${stat.highlight ? 'ring-2 ring-red-200' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{stat.icon}</span>
                {stat.highlight && (
                  <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                    要対応
                  </span>
                )}
              </div>
              <p className="mt-4 text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.name}</p>
            </div>
          )

          return stat.link ? (
            <Link key={stat.name} to={stat.link}>
              {content}
            </Link>
          ) : (
            <div key={stat.name}>{content}</div>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Reports */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">最近の通報</h2>
            <Link to="/reports" className="text-sm text-purple-600 hover:text-purple-800">
              すべて見る →
            </Link>
          </div>
          {data?.recentReports && data.recentReports.length > 0 ? (
            <div className="space-y-3">
              {data.recentReports.map((report) => (
                <div
                  key={report.reportId}
                  className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-b-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {report.reporter ? `@${report.reporter.appId}` : '不明なユーザー'}
                    </p>
                    <p className="text-sm text-gray-500">{report.reason}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        report.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : report.status === 'resolved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {report.status === 'pending'
                        ? '未対応'
                        : report.status === 'resolved'
                          ? '解決済み'
                          : report.status === 'dismissed'
                            ? '却下'
                            : report.status}
                    </span>
                    <p className="text-sm text-gray-400 mt-1">
                      {formatRelativeTime(report.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">通報はありません</p>
          )}
        </div>

        {/* Today's Question */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">今日のお題</h2>
            <Link to="/questions" className="text-sm text-purple-600 hover:text-purple-800">
              お題管理 →
            </Link>
          </div>
          {data?.todayQuestion ? (
            <div className="rounded-lg bg-purple-50 p-4">
              <p className="text-lg font-medium text-purple-900">{data.todayQuestion.text}</p>
              <p className="mt-2 text-sm text-purple-600">
                回答数: {data.todayQuestion.answerCount.toLocaleString()}
              </p>
            </div>
          ) : (
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-gray-500 text-center">今日のお題は未設定です</p>
              <Link
                to="/questions"
                className="mt-2 block text-center text-sm text-purple-600 hover:text-purple-800"
              >
                お題を設定する
              </Link>
            </div>
          )}
          <div className="mt-4 text-sm text-gray-500">
            日付: {data?.date ?? '-'}
          </div>
        </div>
      </div>
    </div>
  )
}
