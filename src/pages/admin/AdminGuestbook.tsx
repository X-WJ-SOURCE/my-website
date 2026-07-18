import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, formatTime } from '../../lib/api';
import { useAdminAuth } from '../../hooks/useAdminAuth';

interface GuestbookEntry {
  id: number;
  nickname: string | null;
  content: string;
  created_at: string;
}

export default function AdminGuestbook() {
  const { isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    fetchEntries();
  }, [isAuthenticated, navigate]);

  async function fetchEntries() {
    try {
      const data = (await api.get('/admin/guestbook')) as { entries: GuestbookEntry[] };
      setEntries(data.entries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('确定删除这条留言？')) return;
    try {
      await api.delete(`/guestbook/${id}`);
      await fetchEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  }

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-4xl mx-auto mt-10 px-4">
      <h1 className="text-3xl font-bold text-text-primary mb-8">留言管理</h1>

      {error && (
        <div className="mb-6 bg-red-400/10 border border-red-400/30 rounded-lg px-4 py-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center text-text-secondary py-12">加载中...</div>
      ) : entries.length === 0 ? (
        <div className="bg-bg-card rounded-xl p-12 border border-bg-card text-center text-text-secondary">
          还没有留言
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((e) => (
            <div
              key={e.id}
              className="bg-bg-card rounded-xl p-4 border border-bg-card flex items-start justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary mb-1">
                  {e.nickname || '匿名'}
                </p>
                <p className="text-sm text-text-secondary mb-2 whitespace-pre-wrap">
                  {e.content}
                </p>
                <p className="text-xs text-text-secondary">
                  {formatTime(e.created_at)}
                </p>
              </div>
              <button
                onClick={() => handleDelete(e.id)}
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
