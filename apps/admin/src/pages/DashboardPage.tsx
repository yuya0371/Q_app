export default function DashboardPage() {
  // Mock stats data
  const stats = [
    { name: '総ユーザー数', value: '1,234', change: '+12%', icon: '👥' },
    { name: '今日の回答数', value: '567', change: '+8%', icon: '💬' },
    { name: '未対応の通報', value: '3', change: '-2', icon: '🚨' },
    { name: '承認待ちお題', value: '15', change: '+5', icon: '💡' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">ダッシュボード</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{stat.icon}</span>
              <span className={`text-sm font-medium ${
                stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">最近の通報</h2>
          <div className="space-y-3">
            {[
              { user: 'user123', type: 'スパム', time: '10分前' },
              { user: 'test_user', type: 'ハラスメント', time: '1時間前' },
              { user: 'hello_world', type: '不適切なコンテンツ', time: '3時間前' },
            ].map((report, i) => (
              <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <p className="font-medium text-gray-900">@{report.user}</p>
                  <p className="text-sm text-gray-500">{report.type}</p>
                </div>
                <span className="text-sm text-gray-400">{report.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">今日の質問</h2>
          <div className="rounded-lg bg-purple-50 p-4">
            <p className="text-lg font-medium text-purple-900">
              最近一番嬉しかったことは何ですか？
            </p>
            <p className="mt-2 text-sm text-purple-600">公開済み • 回答数: 234</p>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">明日の予定</h3>
            <p className="text-gray-600">今年チャレンジしたいことは？</p>
          </div>
        </div>
      </div>
    </div>
  )
}
