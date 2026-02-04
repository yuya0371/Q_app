import { useState } from 'react'

const mockNgWords = [
  { id: '1', word: 'spam', createdAt: '2024-01-01' },
  { id: '2', word: '広告', createdAt: '2024-01-05' },
  { id: '3', word: '不適切ワード', createdAt: '2024-01-10' },
]

export default function NgWordsPage() {
  const [ngWords, setNgWords] = useState(mockNgWords)
  const [newWord, setNewWord] = useState('')

  const handleAdd = () => {
    if (!newWord.trim()) return
    setNgWords([
      ...ngWords,
      { id: Date.now().toString(), word: newWord, createdAt: new Date().toISOString().split('T')[0] }
    ])
    setNewWord('')
  }

  const handleDelete = (id: string) => {
    setNgWords(ngWords.filter(w => w.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">NGワード管理</h1>
      </div>

      <div className="rounded-lg bg-white p-6 shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">新しいNGワードを追加</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="NGワードを入力..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button
            onClick={handleAdd}
            className="rounded-lg bg-purple-600 px-6 py-2 text-white font-medium hover:bg-purple-700"
          >
            追加
          </button>
        </div>
      </div>

      <div className="rounded-lg bg-white shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ワード</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">追加日</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ngWords.map((word) => (
              <tr key={word.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <code className="px-2 py-1 bg-gray-100 rounded text-sm">{word.word}</code>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {word.createdAt}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDelete(word.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        ※ NGワードを含む投稿は自動的にフラグが付けられます
      </div>
    </div>
  )
}
