import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAdminAuth } from '../../hooks/useAdminAuth';

interface Stats {
  articles: number;
  comments: number;
  guestbook: number;
  wall: number;
  threads: number;
}

interface Thread {
  id: string;
  nickname: string | null;
  content: string;
  created_at: string;
}

const statCards = [
  { key: 'articles' as const, label: '文章', icon: '📄', link: '/admin/articles' },
  { key: 'comments' as const, label: '评论', icon: '💬', link: '/admin/comments' },
  { key: 'guestbook' as const, label: '留言', icon: '📖', link: '/admin/guestbook' },
  { key: 'wall' as const, label: '涂鸦墙', icon: '🎨', link: '/admin/wall' },
  { key: 'threads' as const, label: '私信', icon: '✉️', link: '/admin/messages' },
];

export default function AdminDashboard() {
  const { isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    async function fetchData() {
      try {
        const [statsData, threadsData] = await Promise.all([
          api.get('/admin/stats') as Promise<Stats>,
          api.get('/messages') as Promise<Thread[]>,
        ]);
        setStats(statsData);
        setThreads(threadsData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-20 px-4 text-center text-text-secondary">
        加载中...
      </div>
    );
  }
  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-20 px-4">
        <div className="bg-red-400/10 border border-red-400/30 rounded-xl p-6 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto mt-10 px-4">
      <h1 className="text-3xl font-bold text-text-primary mb-8">控制台</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
        {statCards.map(({ key, label, icon, link }) => (
          <Link
            key={key}
            to={link}
            className="bg-bg-card rounded-xl p-5 border border-bg-card hover:border-accent/50 transition-colors text-center"
          >
            <div className="text-2xl mb-2">{icon}</div>
            <div className="text-2xl font-bold text-text-primary">
              {stats?.[key] ?? 0}
            </div>
            <div className="text-xs text-text-secondary mt-1">{label}</div>
          </Link>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text-primary">最近私信</h2>
          <Link
            to="/admin/messages"
            className="text-sm text-accent hover:opacity-80 transition-opacity"
          >
            查看全部 &rarr;
          </Link>
        </div>

        {threads.length === 0 ? (
          <div className="bg-bg-card rounded-xl p-8 border border-bg-card text-center text-text-secondary">
            还没有私信
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {threads.slice(0, 5).map((thread) => (
              <Link
                key={thread.id}
                to={`/messages/${thread.id}`}
                className="bg-bg-card rounded-xl p-4 border border-bg-card hover:border-accent/50 transition-colors flex items-center justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {thread.nickname || '匿名'}
                  </p>
                  <p className="text-sm text-text-secondary truncate mt-0.5">
                    {thread.content}
                  </p>
                </div>
                <span className="text-xs text-text-secondary ml-4 shrink-0">
                  {new Date(thread.created_at).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
