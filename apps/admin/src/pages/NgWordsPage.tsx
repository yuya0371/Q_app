import { useState } from 'react';
import { useNgWords, useAddNgWord, useDeleteNgWord } from '../hooks/useAdminApi';

export default function NgWordsPage() {
  const [newWord, setNewWord] = useState('');

  const { data, isLoading, error } = useNgWords();
  const addNgWord = useAddNgWord();
  const deleteNgWord = useDeleteNgWord();

  const handleAdd = () => {
    if (!newWord.trim()) return;
    addNgWord.mutate(newWord, {
      onSuccess: () => setNewWord(''),
    });
  };

  const handleDelete = (wordId: string) => {
    if (!confirm('このNGワードを削除しますか？')) return;
    deleteNgWord.mutate(wordId);
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

  const ngWords = data?.items || [];

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
            disabled={addNgWord.isPending}
            className="rounded-lg bg-purple-600 px-6 py-2 text-white font-medium hover:bg-purple-700 disabled:opacity-50"
          >
            {addNgWord.isPending ? '追加中...' : '追加'}
          </button>
        </div>
        {addNgWord.isError && (
          <p className="mt-2 text-sm text-red-600">追加に失敗しました</p>
        )}
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
            {ngWords.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                  NGワードはまだ登録されていません
                </td>
              </tr>
            ) : (
              ngWords.map((word) => (
                <tr key={word.wordId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <code className="px-2 py-1 bg-gray-100 rounded text-sm">{word.word}</code>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(word.createdAt).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(word.wordId)}
                      disabled={deleteNgWord.isPending}
                      className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        ※ NGワードを含む投稿は自動的にフラグが付けられます
      </div>
    </div>
  );
}
