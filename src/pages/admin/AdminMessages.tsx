import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAdminAuth } from '../../hooks/useAdminAuth';

interface Thread {
  id: string;
  nickname: string | null;
  content: string;
  created_at: string;
}

export default function AdminMessages() {
  const { isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    fetchThreads();
  }, [isAuthenticated, navigate]);

  async function fetchThreads() {
    try {
      const data = (await api.get('/messages')) as Thread[];
      setThreads(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(threadId: string) {
    if (!window.confirm('确定删除这个对话？')) return;
    try {
      await api.delete(`/messages/${threadId}`);
      await fetchThreads();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  }

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-4xl mx-auto mt-10 px-4">
      <h1 className="text-3xl font-bold text-text-primary mb-8">私信管理</h1>

      {error && (
        <div className="mb-6 bg-red-400/10 border border-red-400/30 rounded-lg px-4 py-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center text-text-secondary py-12">加载中...</div>
      ) : threads.length === 0 ? (
        <div className="bg-bg-card rounded-xl p-12 border border-bg-card text-center text-text-secondary">
          还没有私信
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {threads.map((t) => (
            <div
              key={t.id}
              className="bg-bg-card rounded-xl p-4 border border-bg-card flex items-center justify-between gap-4"
            >
              <Link
                to={`/messages/${t.id}`}
                className="min-w-0 flex-1 hover:opacity-80 transition-opacity"
              >
                <p className="text-sm font-medium text-text-primary truncate">
                  {t.nickname || '匿名'}
                </p>
                <p className="text-sm text-text-secondary truncate mt-0.5">
                  {t.content}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  {new Date(t.created_at).toLocaleString()}
                </p>
              </Link>
              <button
                onClick={() => handleDelete(t.id)}
                className="px-3 py-1.5 text-sm rounded-lg bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors shrink-0 cursor-pointer"
              >
                删除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
