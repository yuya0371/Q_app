import { useState } from 'react'

interface Question {
  id: string
  text: string
  source: 'official' | 'user'
  status: 'scheduled' | 'published' | 'draft'
  scheduledDate?: string
  publishedAt?: string
}

const mockQuestions: Question[] = [
  { id: '1', text: '最近一番嬉しかったことは何ですか？', source: 'official', status: 'published', publishedAt: '2024-01-15' },
  { id: '2', text: '今年チャレンジしたいことは？', source: 'official', status: 'scheduled', scheduledDate: '2024-01-16' },
  { id: '3', text: '休日の過ごし方は？', source: 'official', status: 'scheduled', scheduledDate: '2024-01-17' },
  { id: '4', text: '最近ハマっていることは？', source: 'official', status: 'draft' },
]

export default function QuestionsPage() {
  const [questions, setQuestions] = useState(mockQuestions)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newQuestion, setNewQuestion] = useState('')

  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return
    const question: Question = {
      id: Date.now().toString(),
      text: newQuestion,
      source: 'official',
      status: 'draft',
    }
    setQuestions([...questions, question])
    setNewQuestion('')
    setIsModalOpen(false)
  }

  const getStatusBadge = (status: Question['status']) => {
    const styles = {
      published: 'bg-green-100 text-green-800',
      scheduled: 'bg-blue-100 text-blue-800',
      draft: 'bg-gray-100 text-gray-800',
    }
    const labels = {
      published: '公開済み',
      scheduled: '予定',
      draft: '下書き',
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
        <h1 className="text-2xl font-bold text-gray-900">お題管理</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg bg-purple-600 px-4 py-2 text-white font-medium hover:bg-purple-700"
        >
          + 新規追加
        </button>
      </div>

      <div className="rounded-lg bg-white shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">お題</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">日付</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {questions.map((question) => (
              <tr key={question.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-900">{question.text}</p>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(question.status)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {question.publishedAt || question.scheduledDate || '-'}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-purple-600 hover:text-purple-800 text-sm font-medium mr-3">
                    編集
                  </button>
                  <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">新しいお題を追加</h2>
            <textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="お題を入力..."
              className="w-full rounded-lg border border-gray-300 p-3 h-32 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                キャンセル
              </button>
              <button
                onClick={handleAddQuestion}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
