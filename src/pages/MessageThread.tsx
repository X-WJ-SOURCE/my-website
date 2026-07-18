import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api, formatTime, getToken } from '../lib/api';

interface Message {
  id: number;
  nickname: string | null;
  content: string;
  is_admin: boolean;
  created_at: string;
}

export default function MessageThread() {
  const { threadId } = useParams<{ threadId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const isAdmin = !!getToken();

  async function fetchMessages() {
    setLoading(true);
    setError('');
    try {
      const data = (await api.get(`/messages/${threadId}`)) as Message[];
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMessages();
  }, [threadId]);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      await api.post(`/messages/${threadId}/reply`, { content: reply.trim() });
      setReply('');
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : '回复发送失败');
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto mt-20 px-4 text-center text-text-secondary">
        加载中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-20 px-4">
        <div className="bg-red-400/10 border border-red-400/30 rounded-xl p-6 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="max-w-2xl mx-auto mt-20 px-4 text-center text-text-secondary">
        这个对话中还没有消息
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">
          私密对话
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          对话 ID： {threadId}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.is_admin ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                msg.is_admin
                  ? 'bg-accent text-white rounded-br-md'
                  : 'bg-bg-card text-text-primary rounded-bl-md border border-bg-card'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold opacity-80">
                  {msg.is_admin ? '站长' : (msg.nickname || '匿名')}
                </span>
                <span className="text-xs opacity-50">
                  {formatTime(msg.created_at)}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
            </div>
          </div>
        ))}
      </div>

      {isAdmin && (
        <form onSubmit={handleReply} className="mt-8 flex gap-3">
          <textarea
            placeholder="写回复..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            required
            rows={2}
            maxLength={5000}
            className="flex-1 px-4 py-3 rounded-xl bg-bg-card text-text-primary border border-bg-card focus:border-accent outline-none placeholder:text-text-secondary resize-none"
          />
          <button
            type="submit"
            disabled={sending || !reply.trim()}
            className="self-end px-5 py-3 rounded-xl bg-accent text-white font-medium hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {sending ? '...' : '回复'}
          </button>
        </form>
      )}
    </div>
  );
}
