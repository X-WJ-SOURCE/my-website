import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAdminAuth } from '../../hooks/useAdminAuth';

interface Article {
  id: number;
  title: string;
  content: string;
  visibility: 'public' | 'private';
  tags: string[];
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
  const [coverUrl, setCoverUrl] = useState('');
  const [decorImages, setDecorImages] = useState<{ url: string; x: number; y: number; w: number }[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewDecor, setPreviewDecor] = useState(false);

  function parseDecorImages(raw: string | null): { url: string; x: number; y: number; w: number }[] {
    if (!raw) return []
    try { return JSON.parse(raw) } catch { return [] }
  }

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
    setCoverUrl('');
    setDecorImages([]);
  }

  function startEdit(article: Article) {
    setEditing(true);
    setEditId(article.id);
    setTitle(article.title);
    setContent(article.content);
    setVisibility(article.visibility);
    setTags(Array.isArray(article.tags) ? article.tags.join(', ') : (article.tags || ''));
    setCoverUrl((article as any).cover_url || '');
    setDecorImages(parseDecorImages((article as any).decor_images));
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
      const payload: any = {
        title: title.trim(),
        content: content.trim(),
        visibility,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        cover_url: coverUrl || null,
        decor_images: decorImages.length > 0 ? decorImages : null,
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

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const result = await api('/upload', { method: 'POST', body: formData }) as { url: string }
      setCoverUrl(result.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : '封面上传失败')
    } finally {
      setUploading(false)
    }
  }

  async function handleDecorUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const result = await api('/upload', { method: 'POST', body: fd }) as { url: string }
      setDecorImages(prev => [...prev, { url: result.url, x: 50 + (prev.length * 10) % 40, y: 50 + (prev.length * 15) % 30, w: 160 }])
    } catch (err) {
      setError(err instanceof Error ? err.message : '图片上传失败')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleInlineImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const result = await api('/upload', { method: 'POST', body: fd }) as { url: string }
      const md = `![${file.name}](${result.url})`
      setContent(prev => prev ? `${prev}\n${md}\n` : md)
    } catch (err) {
      setError(err instanceof Error ? err.message : '图片上传失败')
    } finally {
      setUploading(false)
      e.target.value = ''
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

      {editing && (<>
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
            <div className="flex items-center gap-2">
              <label className="px-3 py-1.5 bg-bg-secondary border border-bg-card rounded text-xs text-text-secondary cursor-pointer hover:border-accent transition-colors">
                {uploading ? '上传中...' : '插入图片'}
                <input type="file" accept="image/*" onChange={handleInlineImage} className="hidden" disabled={uploading} />
              </label>
              <span className="text-xs text-text-secondary">直接插入到文章中</span>
            </div>
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
            <div>
              <label className="block text-sm text-text-secondary mb-2">封面图</label>
              <div className="flex items-center gap-3">
                <label className="px-4 py-2 rounded-lg bg-bg-secondary text-text-secondary border border-bg-card hover:border-accent cursor-pointer text-sm transition-colors">
                  {uploading ? '上传中...' : '选择图片'}
                  <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" disabled={uploading} />
                </label>
                {coverUrl && (
                  <div className="flex items-center gap-2">
                    <img src={coverUrl} alt="" className="h-10 w-16 object-cover rounded" />
                    <button type="button" onClick={() => setCoverUrl('')} className="text-xs text-red-400 hover:text-red-300">清除</button>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-2">
                装饰图
                {decorImages.length > 0 && (
                  <button type="button" onClick={() => setPreviewDecor(!previewDecor)}
                    className="ml-2 text-accent text-xs hover:underline cursor-pointer">
                    {previewDecor ? '关闭预览' : '预览排版'}
                  </button>
                )}
              </label>
              <div className="flex flex-wrap gap-3">
                {decorImages.map((img, i) => (
                  <div key={i} className="relative group w-24">
                    <div className="relative h-16 rounded overflow-hidden border-2 border-bg-card hover:border-accent cursor-grab active:cursor-grabbing"
                      onMouseDown={(e) => {
                        const sx = e.clientX, sy = e.clientY, ox = img.x, oy = img.y
                        const move = (ev: MouseEvent) => setDecorImages(prev => prev.map((d, j) => j === i ? { ...d, x: Math.max(0, Math.min(90, ox + (ev.clientX - sx) * 0.5)), y: Math.max(0, Math.min(90, oy + (ev.clientY - sy) * 0.5)) } : d))
                        const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up) }
                        document.addEventListener('mousemove', move); document.addEventListener('mouseup', up)
                      }}>
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 text-center">{Math.round(img.x)}%,{Math.round(img.y)}%</div>
                    </div>
                    <button type="button" onClick={() => setDecorImages(prev => prev.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs leading-5 cursor-pointer opacity-0 group-hover:opacity-100">×</button>
                  </div>
                ))}
                <label className="px-4 py-2 h-16 w-24 rounded bg-bg-secondary border border-dashed border-bg-card text-text-secondary text-xs cursor-pointer hover:border-accent flex items-center justify-center">
                  {uploading ? '上传中' : '+ 添加'}
                  <input type="file" accept="image/*" onChange={handleDecorUpload} className="hidden" disabled={uploading} />
                </label>
              </div>
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

        {previewDecor && decorImages.length > 0 && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setPreviewDecor(false)}>
            <div className="relative w-[92vw] h-[88vh] bg-bg-primary rounded-2xl border border-bg-card overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="absolute top-3 left-3 z-10 text-sm text-text-secondary">拖动图片调位置 | 拖右下角 ◧ 调大小</div>
              <div className="absolute top-3 right-3 z-10 flex gap-2">
                <button onClick={() => setPreviewDecor(false)} className="px-3 py-1 bg-accent text-white rounded-lg text-sm cursor-pointer">完成</button>
              </div>

              <div className="absolute inset-[8%_15%] border-2 border-dashed border-accent/30 rounded-xl p-6 overflow-auto pointer-events-none">
                <h2 className="text-lg font-bold text-text-primary mb-2">{title || '文章标题'}</h2>
                <div className="flex gap-2 mb-3">
                  {tags.split(',').filter(Boolean).map((t, i) => (
                    <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-accent/20 text-accent">{t.trim()}</span>
                  ))}
                </div>
                <p className="text-sm text-text-secondary whitespace-pre-wrap line-clamp-6">{content || '文章内容预览...'}</p>
              </div>

              {decorImages.map((img, i) => (
                <div key={i} className="absolute group" style={{ left: `${img.x}%`, top: `${img.y}%`, transform: 'translate(-50%, -50%)' }}>
                  <img src={img.url} alt="" className="rounded-lg shadow-2xl pointer-events-none" style={{ width: img.w }} draggable={false} />
                  <div className="absolute -inset-1 cursor-move rounded-lg border border-accent/20 group-hover:border-accent transition-colors"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      const container = (e.currentTarget as HTMLElement).closest('.relative')?.getBoundingClientRect()
                      if (!container) return
                      const sx = e.clientX, sy = e.clientY, ox = img.x, oy = img.y
                      const move = (ev: MouseEvent) => {
                        const dx = (((ev.clientX - sx) / container.width) * 100)
                        const dy = (((ev.clientY - sy) / container.height) * 100)
                        setDecorImages(prev => prev.map((d, j) => j === i ? { ...d, x: Math.max(5, Math.min(95, ox + dx)), y: Math.max(5, Math.min(95, oy + dy)) } : d))
                      }
                      const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up) }
                      document.addEventListener('mousemove', move); document.addEventListener('mouseup', up)
                    }} />
                  <div className="absolute -bottom-6 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 items-center justify-center">
                    <input type="range" min="60" max="400" value={img.w}
                      onChange={e => setDecorImages(prev => prev.map((d, j) => j === i ? { ...d, w: Number(e.target.value) } : d))}
                      className="w-full h-1 accent-accent cursor-pointer" />
                    <span className="text-[10px] text-text-secondary w-8">{img.w}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </>)}

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
