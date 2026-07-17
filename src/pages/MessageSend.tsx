import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function MessageSend() {
  const [nickname, setNickname] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [threadId, setThreadId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = (await api.post('/messages', {
        nickname: nickname.trim() || undefined,
        content: content.trim(),
      })) as { thread_id: string };
      setThreadId(data.thread_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败');
    } finally {
      setLoading(false);
    }
  }

  if (threadId) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 text-center">
        <div className="bg-bg-card rounded-2xl p-8 border border-bg-card">
          <div className="text-4xl mb-4">✉️</div>
          <h2 className="text-xl font-bold text-text-primary mb-2">发送成功！</h2>
          <p className="text-text-secondary mb-6">
            记下这个链接，回来查看回复：
          </p>
          <Link
            to={`/messages/${threadId}`}
            className="inline-block px-6 py-2 rounded-lg bg-accent text-white font-medium hover:opacity-80 transition-opacity"
          >
            查看消息 &rarr;
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-20 px-4">
      <div className="bg-bg-card rounded-2xl p-8 border border-bg-card">
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">🔒</div>
          <h1 className="text-xl font-bold text-text-primary mb-1">私密消息</h1>
          <p className="text-text-secondary text-sm">
            给站长发一条私密消息，只有站长能看到
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="你的昵称 (选填)"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={50}
            className="px-4 py-3 rounded-lg bg-bg-secondary text-text-primary border border-bg-card focus:border-accent outline-none placeholder:text-text-secondary"
          />

          <textarea
            placeholder="悄悄话"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={5}
            maxLength={5000}
            className="px-4 py-3 rounded-lg bg-bg-secondary text-text-primary border border-bg-card focus:border-accent outline-none placeholder:text-text-secondary resize-none"
          />

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="px-6 py-3 rounded-lg bg-accent text-white font-medium hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? '发送中...' : '发送'}
          </button>
        </form>
      </div>
    </div>
  );
}
