import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAdminAuth } from '../../hooks/useAdminAuth';

interface Article {
  id: number;
  title: string;
  content: string;
  visibility: 'public' | 'private';
  tags: string;
  created_at: string;
  updated_at: string;
}

export default function AdminArticles() {
  const { isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    fetchArticles();
  }, [isAuthenticated, navigate]);

  async function fetchArticles() {
    try {
      const data = (await api.get('/articles')) as { articles: Article[] };
      setArticles(data.articles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }

  function startNew() {
    setEditing(true);
    setEditId(null);
    setTitle('');
    setContent('');
    setVisibility('public');
    setTags('');
  }

  function startEdit(article: Article) {
    setEditing(true);
    setEditId(article.id);
    setTitle(article.title);
    setContent(article.content);
    setVisibility(article.visibility);
    setTags(article.tags || '');
  }

  function cancelEdit() {
    setEditing(false);
    setEditId(null);
    setError('');
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        visibility,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };
      if (editId) {
        await api.put(`/articles/${editId}`, payload);
      } else {
        await api.post('/articles', payload);
      }
      cancelEdit();
      await fetchArticles();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('确定删除这篇文章？')) return;
    try {
      await api.delete(`/articles/${id}`);
      await fetchArticles();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  }

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-5xl mx-auto mt-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-text-primary">文章管理</h1>
        {!editing && (
          <button
            onClick={startNew}
            className="px-5 py-2.5 rounded-lg bg-accent text-white font-medium hover:opacity-80 transition-opacity cursor-pointer"
          >
            + 写文章
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 bg-red-400/10 border border-red-400/30 rounded-lg px-4 py-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {editing && (
        <form onSubmit={handleSave} className="bg-bg-card rounded-xl p-6 border border-bg-card mb-8">
          <h2 className="text-lg font-bold text-text-primary mb-4">
            {editId ? '编辑文章' : '写文章'}
          </h2>
          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="px-4 py-3 rounded-lg bg-bg-secondary text-text-primary border border-bg-card focus:border-accent outline-none placeholder:text-text-secondary"
            />
            <textarea
              placeholder="内容 (Markdown)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={12}
              className="px-4 py-3 rounded-lg bg-bg-secondary text-text-primary border border-bg-card focus:border-accent outline-none placeholder:text-text-secondary resize-none font-mono text-sm"
            />
            <div className="flex gap-4 items-center flex-wrap">
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
                  className="px-3 py-2 rounded-lg bg-bg-secondary text-text-primary border border-bg-card outline-none"
                >
                  <option value="public">公开</option>
                  <option value="private">私密</option>
                </select>
                可见性
              </label>
              <input
                type="text"
                placeholder="标签（逗号分隔）"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg bg-bg-secondary text-text-primary border border-bg-card focus:border-accent outline-none placeholder:text-text-secondary"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-lg bg-accent text-white font-medium hover:opacity-80 transition-opacity disabled:opacity-50 cursor-pointer"
              >
                {saving ? '保存中...' : '保存'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="px-5 py-2.5 rounded-lg bg-bg-secondary text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                取消
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center text-text-secondary py-12">加载中...</div>
      ) : articles.length === 0 ? (
        <div className="bg-bg-card rounded-xl p-12 border border-bg-card text-center text-text-secondary">
          还没有文章，快来写第一篇吧！
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {articles.map((a) => (
            <div
              key={a.id}
              className="bg-bg-card rounded-xl p-4 border border-bg-card flex items-center justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-text-primary font-medium truncate">{a.title}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      a.visibility === 'public'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {a.visibility === 'public' ? '公开' : '私密'}
                  </span>
                </div>
                <p className="text-xs text-text-secondary">
                  {new Date(a.created_at).toLocaleDateString()} &middot; 更新于{' '}
                  {new Date(a.updated_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => startEdit(a)}
                  className="px-3 py-1.5 text-sm rounded-lg bg-bg-secondary text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                >
                   编辑
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="px-3 py-1.5 text-sm rounded-lg bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors cursor-pointer"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
