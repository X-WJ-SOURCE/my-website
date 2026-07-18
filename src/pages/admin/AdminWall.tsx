import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAdminAuth } from '../../hooks/useAdminAuth';

interface WallPost {
  id: number;
  nickname: string | null;
  content: string;
  created_at: string;
}

export default function AdminWall() {
  const { isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<WallPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    fetchPosts();
  }, [isAuthenticated, navigate]);

  async function fetchPosts() {
    try {
      const data = (await api.get('/admin/wall')) as { posts: WallPost[] };
      setPosts(data.posts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('确定删除这个帖子？')) return;
    try {
      await api.delete(`/wall/${id}`);
      await fetchPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  }

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-4xl mx-auto mt-10 px-4">
      <h1 className="text-3xl font-bold text-text-primary mb-8">涂鸦墙管理</h1>

      {error && (
        <div className="mb-6 bg-red-400/10 border border-red-400/30 rounded-lg px-4 py-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center text-text-secondary py-12">加载中...</div>
      ) : posts.length === 0 ? (
        <div className="bg-bg-card rounded-xl p-12 border border-bg-card text-center text-text-secondary">
          还没有帖子
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((p) => (
            <div
              key={p.id}
              className="bg-bg-card rounded-xl p-4 border border-bg-card flex items-start justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary mb-1">
                  {p.nickname || '匿名'}
                </p>
                <p className="text-sm text-text-secondary mb-2 whitespace-pre-wrap">
                  {p.content}
                </p>
                <p className="text-xs text-text-secondary">
                  {new Date(p.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => handleDelete(p.id)}
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
