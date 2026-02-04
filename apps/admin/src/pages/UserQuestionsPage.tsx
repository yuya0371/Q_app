import { useState } from 'react'

interface UserQuestion {
  id: string
  text: string
  submittedBy: string
  submittedAt: string
  status: 'pending' | 'approved' | 'rejected'
}

const mockUserQuestions: UserQuestion[] = [
  { id: '1', text: '人生で一番影響を受けた本は？', submittedBy: 'tanaka', submittedAt: '2024-01-15 10:30', status: 'pending' },
  { id: '2', text: '朝起きて最初にすることは？', submittedBy: 'yamada', submittedAt: '2024-01-15 09:15', status: 'pending' },
  { id: '3', text: '子供の頃の夢は？', submittedBy: 'suzuki', submittedAt: '2024-01-14 18:00', status: 'approved' },
  { id: '4', text: '（不適切なお題）', submittedBy: 'bad_user', submittedAt: '2024-01-14 15:00', status: 'rejected' },
]

export default function UserQuestionsPage() {
  const [questions, setQuestions] = useState(mockUserQuestions)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  const handleApprove = (id: string) => {
    setQuestions(questions.map(q =>
      q.id === id ? { ...q, status: 'approved' as const } : q
    ))
  }

  const handleReject = (id: string) => {
    setQuestions(questions.map(q =>
      q.id === id ? { ...q, status: 'rejected' as const } : q
    ))
  }

  const filteredQuestions = questions.filter(q =>
    filter === 'all' ? true : q.status === filter
  )

  const getStatusBadge = (status: UserQuestion['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    }
    const labels = {
      pending: '審査待ち',
      approved: '承認済み',
      rejected: '却下',
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
              {status === 'all' ? 'すべて' :
               status === 'pending' ? '審査待ち' :
               status === 'approved' ? '承認済み' : '却下'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredQuestions.map((question) => (
          <div key={question.id} className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-lg text-gray-900">{question.text}</p>
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                  <span>@{question.submittedBy}</span>
                  <span>{question.submittedAt}</span>
                  {getStatusBadge(question.status)}
                </div>
              </div>
              {question.status === 'pending' && (
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleApprove(question.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                  >
                    承認
                  </button>
                  <button
                    onClick={() => handleReject(question.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
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
