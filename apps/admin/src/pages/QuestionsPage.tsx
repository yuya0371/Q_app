import { useState } from 'react';
import { useQuestions, useCreateQuestion, useSetDailyQuestion } from '../hooks/useAdminApi';

export default function QuestionsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuestions();
  const createQuestion = useCreateQuestion();
  const setDailyQuestion = useSetDailyQuestion();

  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return;
    createQuestion.mutate(newQuestion, {
      onSuccess: () => {
        setNewQuestion('');
        setIsModalOpen(false);
      },
    });
  };

  const handleSchedule = () => {
    if (!selectedQuestionId || !scheduleDate) return;
    setDailyQuestion.mutate(
      { questionId: selectedQuestionId, date: scheduleDate },
      {
        onSuccess: () => {
          setSelectedQuestionId(null);
          setScheduleDate('');
          alert('お題を設定しました');
        },
      }
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

  const questions = data?.items || [];

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

      {/* Schedule Section */}
      <div className="rounded-lg bg-white p-6 shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">今日のお題を設定</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">お題を選択</label>
            <select
              value={selectedQuestionId || ''}
              onChange={(e) => setSelectedQuestionId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="">選択してください</option>
              {questions.map((q) => (
                <option key={q.questionId} value={q.questionId}>
                  {q.text}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
            <input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <button
            onClick={handleSchedule}
            disabled={!selectedQuestionId || !scheduleDate || setDailyQuestion.isPending}
            className="rounded-lg bg-green-600 px-6 py-2 text-white font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {setDailyQuestion.isPending ? '設定中...' : '設定'}
          </button>
        </div>
      </div>

      <div className="rounded-lg bg-white shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">お題</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ソース</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">使用日</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">作成日</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {questions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  お題はまだ登録されていません
                </td>
              </tr>
            ) : (
              questions.map((question) => (
                <tr key={question.questionId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{question.text}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        question.source === 'official'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {question.source === 'official' ? '運営' : 'ユーザー'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {question.usedAt || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(question.createdAt).toLocaleDateString('ja-JP')}
                  </td>
                </tr>
              ))
            )}
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
              maxLength={80}
            />
            <div className="text-sm text-gray-500 mb-4">{newQuestion.length}/80文字</div>
            {createQuestion.isError && (
              <p className="text-sm text-red-600 mb-4">追加に失敗しました</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setNewQuestion('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                キャンセル
              </button>
              <button
                onClick={handleAddQuestion}
                disabled={createQuestion.isPending || !newQuestion.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {createQuestion.isPending ? '追加中...' : '追加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
