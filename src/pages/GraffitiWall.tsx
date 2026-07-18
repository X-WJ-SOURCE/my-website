import { useState, useEffect, useCallback, useRef } from "react";
import { api, formatTime, getVisitorId } from "../lib/api";

interface WallPost {
  id: number;
  nickname: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  visitor_id: string;
  edited_at: string | null;
}

const ACCENT_COLORS = [
  "#f9a8d4",
  "#c4b5fd",
  "#a5f3fc",
  "#fde68a",
  "#fecdd3",
  "#bfdbfe",
  "#bbf7d0",
  "#fed7aa",
  "#e9d5ff",
  "#d9f99d",
];

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getCardStyle(index: number) {
  const colorIndex = index % ACCENT_COLORS.length;
  const rotation = getRandomInt(-3, 3);
  const hue = (index * 47) % 360;
  return {
    accentColor: ACCENT_COLORS[colorIndex],
    rotation,
    bgHue: hue,
  };
}

export default function GraffitiWall() {
  const visitorId = getVisitorId();

  const [posts, setPosts] = useState<WallPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);
  const limit = 6;
  const totalPages = Math.ceil(total / limit);

  const fetchPosts = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get(`/wall?page=${page}&limit=${limit}`)
      .then((data) => {
        const d = data as { posts: WallPost[]; total: number };
        setPosts(d.posts);
        setTotal(d.total);
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "加载失败"
        );
      })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !images.length) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post("/wall", {
        nickname: nickname.trim() || undefined,
        content: content.trim() || null,
        image_url: images.length > 0 ? images[0] : null,
        images: images.length > 0 ? images : undefined,
        visitor_id: visitorId,
      });
      setNickname("");
      setContent("");
      setImages([]);
      setPage(1);
      fetchPosts();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "发布失败"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const result = await api('/upload', { method: 'POST', body: fd }) as { url: string }
      setImages(prev => [...prev, result.url])
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '图片上传失败')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleEditPost = (post: WallPost) => {
    setEditingPostId(post.id);
    setEditContent(post.content || "");
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditContent("");
  };

  const handleSaveEdit = async (postId: number) => {
    if (!editContent.trim()) return;
    setEditSubmitting(true);
    try {
      await api.put(`/wall/${postId}`, {
        content: editContent.trim(),
        visitor_id: visitorId,
      });
      setEditingPostId(null);
      setEditContent("");
      fetchPosts();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "编辑失败"
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!window.confirm("确定要删除这条帖子吗？")) return;
    try {
      await api.delete(`/wall/${postId}/own?visitor_id=${visitorId}`);
      fetchPosts();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "删除失败"
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-text-primary mb-2">
        🎨 涂鸦墙
      </h1>
      <p className="text-text-secondary text-sm mb-6">
        留下你的印记！写点好玩的。
      </p>

      <div ref={formRef} className="max-w-xl mb-8">
        <form
          onSubmit={handleSubmit}
          className="bg-bg-secondary rounded-xl border border-bg-card p-4"
        >
          <input
            type="text"
            placeholder="昵称（选填）"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={50}
            className="w-full px-3 py-2 mb-3 bg-bg-primary border border-bg-card rounded-lg text-text-primary placeholder-text-secondary text-sm focus:outline-none focus:border-accent"
          />
          <textarea
            placeholder="写下你想说的..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 mb-3 bg-bg-primary border border-bg-card rounded-lg text-text-primary placeholder-text-secondary text-sm focus:outline-none focus:border-accent resize-none"
          />
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {images.map((url, i) => (
              <div key={i} className="relative">
                <img src={url} alt="" className="h-16 w-16 object-cover rounded" />
                <button type="button" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] leading-4 cursor-pointer">×</button>
              </div>
            ))}
            {images.length < 6 && (
              <label className="h-16 w-16 rounded bg-bg-primary border border-dashed border-bg-card text-text-secondary text-[10px] cursor-pointer hover:border-accent flex items-center justify-center transition-colors">
                {uploading ? '...' : '+ 图片'}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
              </label>
            )}
          </div>
          {submitError && (
            <p className="text-red-400 text-sm mb-2">{submitError}</p>
          )}
          <button
            type="submit"
            disabled={(!content.trim() && !images.length) || submitting}
            className="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? "提交中..." : "贴上去"}
          </button>
        </form>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchPosts}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:opacity-80 transition-opacity cursor-pointer"
          >
            重试
          </button>
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-text-secondary text-lg">墙上还没有东西</p>
          <p className="text-text-secondary text-sm mt-2">
            来贴第一个吧！
          </p>
        </div>
      )}

      {!loading && !error && posts.length > 0 && (
        <>
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {posts.map((post, index) => {
              const style = getCardStyle(index);
              return (
                <div
                  key={post.id}
                  className="break-inside-avoid rounded-xl p-4 border shadow-lg transition-transform hover:scale-[1.02] hover:z-10 relative"
                  style={{
                    backgroundColor: `hsl(${style.bgHue}, 30%, 15%)`,
                    borderColor: style.accentColor,
                    borderWidth: 2,
                    borderBottomWidth: 4,
                    transform: `rotate(${style.rotation}deg)`,
                    boxShadow: `0 0 15px ${style.accentColor}20`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: style.accentColor }}
                    />
                    <span className="font-medium text-text-primary text-sm">
                      {post.nickname || "匿名"}
                    </span>
                    {post.visitor_id === visitorId && (
                      <div className="flex gap-1.5 ml-auto">
                        <button
                          onClick={() => handleEditPost(post)}
                          className="text-xs text-text-secondary hover:text-accent transition-colors cursor-pointer"
                        >
                          [编辑]
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="text-xs text-text-secondary hover:text-red-400 transition-colors cursor-pointer"
                        >
                          [删除]
                        </button>
                      </div>
                    )}
                  </div>
                  {editingPostId === post.id ? (
                    <div>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        maxLength={500}
                        className="w-full px-3 py-2 mb-2 bg-bg-primary border border-accent rounded-lg text-text-primary text-sm focus:outline-none resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(post.id)}
                          disabled={!editContent.trim() || editSubmitting}
                          className="px-3 py-1 bg-accent text-white rounded text-xs hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {editSubmitting ? "保存中..." : "保存"}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 bg-bg-card text-text-secondary rounded text-xs hover:bg-bg-card/70 transition-colors cursor-pointer"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {post.content && (
                        <p className="text-text-secondary text-sm whitespace-pre-wrap mb-2">
                          {post.content}
                        </p>
                      )}
                      {post.edited_at && (
                        <p className="text-xs text-text-secondary mt-0 mb-2">
                          最后编辑于 {formatTime(post.edited_at)}
                        </p>
                      )}
                    </>
                  )}
                  {(post.image_url || ((post as any).images && JSON.parse((post as any).images || '[]').length > 0)) && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {post.image_url && (
                        <img src={post.image_url} alt="" className="max-w-[120px] max-h-[120px] object-cover rounded" />
                      )}
                      {(() => {
                        try { return JSON.parse((post as any).images || '[]').map((url: string, i: number) => (
                          <img key={i} src={url} alt="" className="max-w-[120px] max-h-[120px] object-cover rounded" />
                        )) } catch { return null }
                      })()}
                    </div>
                  )}
                  <p
                    className="text-xs mt-2"
                    style={{ color: `${style.accentColor}aa` }}
                  >
                    {formatTime(post.created_at)}
                  </p>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="px-3 py-1.5 rounded bg-bg-card text-text-secondary text-sm disabled:opacity-30 cursor-pointer hover:bg-bg-secondary">
                上一页
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let p: number
                if (totalPages <= 7) p = i + 1
                else if (page <= 4) p = i + 1
                else if (page >= totalPages - 3) p = totalPages - 6 + i
                else p = page - 3 + i
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded text-sm cursor-pointer ${p === page ? 'bg-accent text-white' : 'bg-bg-card text-text-secondary hover:bg-bg-secondary'}`}>
                    {p}
                  </button>
                )
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="px-3 py-1.5 rounded bg-bg-card text-text-secondary text-sm disabled:opacity-30 cursor-pointer hover:bg-bg-secondary">
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
