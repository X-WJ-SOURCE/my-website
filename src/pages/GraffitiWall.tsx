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

function getCardStyle(index: number) {
  const ACCENT_COLORS = [
    '#f9a8d4', '#c4b5fd', '#a5f3fc', '#fde68a', '#fecdd3', 
    '#bfdbfe', '#bbf7d0', '#fed7aa', '#e9d5ff', '#d9f99d',
    '#fecaca', '#a7f3d0', '#c7d2fe', '#fbcfe8', '#fef08a',
  ]
  const colorIndex = index % ACCENT_COLORS.length
  const rotation = -3 + (index * 7) % 6
  const hue = index * 47 % 360
  const styles = ['lined', 'grid', 'dotted', 'plain', 'taped', 'folded', 'polaroid', 'torn']
  const paperStyle = styles[index % styles.length]
  return {
    accentColor: ACCENT_COLORS[colorIndex],
    rotation,
    bgHue: hue,
    paperStyle,
  }
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

  const [wallComments, setWallComments] = useState<Record<number, any[]>>({});
  const [openComments, setOpenComments] = useState<Set<number>>(new Set());
  const [commentText, setCommentText] = useState<Record<number, string>>({});
  const [commentNick, setCommentNick] = useState<Record<number, string>>({});
  const [commentLoading, setCommentLoading] = useState(false);

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

  const toggleComments = async (wallId: number) => {
    const newSet = new Set(openComments)
    if (newSet.has(wallId)) {
      newSet.delete(wallId)
      setOpenComments(newSet)
    } else {
      newSet.add(wallId)
      setOpenComments(newSet)
      setCommentLoading(true)
      try {
        const data = await api.get(`/wall-comments/wall/${wallId}`)
        setWallComments(prev => ({ ...prev, [wallId]: data as any[] }))
      } catch {}
      finally { setCommentLoading(false) }
    }
  }

  const handleCommentSubmit = async (wallId: number) => {
    const text = commentText[wallId]?.trim()
    if (!text) return
    try {
      await api.post(`/wall-comments/wall/${wallId}`, {
        nickname: commentNick[wallId]?.trim() || undefined,
        content: text,
        visitor_id: visitorId,
      })
      setCommentText(prev => ({ ...prev, [wallId]: '' }))
      const data = await api.get(`/wall-comments/wall/${wallId}`)
      setWallComments(prev => ({ ...prev, [wallId]: data as any[] }))
    } catch {}
  }

  const handleEditWallComment = async (commentId: number, wallId: number, content: string) => {
    try {
      await api.put(`/wall-comments/${commentId}`, { content, visitor_id: visitorId })
      const data = await api.get(`/wall-comments/wall/${wallId}`)
      setWallComments(prev => ({ ...prev, [wallId]: data as any[] }))
    } catch {}
  }

  const handleDeleteWallComment = async (commentId: number, wallId: number) => {
    if (!confirm('删除这条评论？')) return
    try {
      await api.delete(`/wall-comments/${commentId}/own?visitor_id=${visitorId}`)
      const data = await api.get(`/wall-comments/wall/${wallId}`)
      setWallComments(prev => ({ ...prev, [wallId]: data as any[] }))
    } catch {}
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative">
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
          <div className="flex gap-2">
            <button type="submit"
              disabled={(!content.trim() && !images.length) || submitting}
              className="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? "提交中..." : "贴上去"}
            </button>
          </div>
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
                  className={`break-inside-avoid rounded-[4px] p-4 border shadow-lg transition-transform hover:scale-[1.02] hover:z-10 relative ${style.paperStyle === 'polaroid' ? 'pb-8' : ''}`}
                  style={{
                    backgroundColor: `hsl(${style.bgHue}, 30%, ${style.paperStyle === 'polaroid' ? '20%' : '18%'})`,
                    borderColor: style.accentColor,
                    borderWidth: style.paperStyle === 'polaroid' ? 3 : 1.5,
                    borderBottomWidth: style.paperStyle === 'polaroid' ? 10 : style.paperStyle === 'torn' ? 4 : 2,
                    transform: `rotate(${style.rotation}deg)`,
                    boxShadow: `2px 3px 10px rgba(0,0,0,0.3), 0 0 0 1px ${style.accentColor}20`,
                  }}
                >
                  {style.paperStyle === 'taped' && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-3 rounded-sm opacity-70" style={{ backgroundColor: style.accentColor }} />
                  )}
                  {style.paperStyle === 'lined' && (
                    <div className="absolute inset-x-3 inset-y-0 pointer-events-none" style={{
                      backgroundImage: 'repeating-linear-gradient(transparent, transparent 23px, rgba(255,255,255,0.03) 23px, rgba(255,255,255,0.03) 24px)'
                    }} />
                  )}
                  {style.paperStyle === 'grid' && (
                    <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
                      backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
                      backgroundSize: '20px 20px'
                    }} />
                  )}
                  {style.paperStyle === 'dotted' && (
                    <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{
                      backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
                      backgroundSize: '16px 16px'
                    }} />
                  )}
                  {style.paperStyle === 'folded' && (
                    <div className="absolute bottom-0 right-0 w-0 h-0 border-l-[12px] border-l-transparent border-b-[12px] pointer-events-none" style={{ borderBottomColor: 'rgba(0,0,0,0.15)' }} />
                  )}
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
                        <img src={post.image_url} alt="" className="w-full rounded mb-2" />
                      )}
                      {(() => {
                        try { return JSON.parse((post as any).images || '[]').map((url: string, i: number) => (
                          <img key={i} src={url} alt="" className="w-full rounded mb-1" />
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

                  <div className="mt-3 pt-3 border-t" style={{ borderColor: `${style.accentColor}33` }}>
                    <button onClick={() => toggleComments(post.id)}
                      className="text-xs cursor-pointer hover:underline" style={{ color: style.accentColor }}>
                      💬 评论 ({wallComments[post.id]?.length || 0})
                    </button>

                    {openComments.has(post.id) && (
                      <div className="mt-2">
                        {commentLoading ? <p className="text-xs text-text-secondary">加载中...</p> :
                          (wallComments[post.id] || []).map((c: any, ci: number) => (
                            <div key={ci} className="mb-2 pl-2 border-l-2" style={{ borderColor: `${style.accentColor}44` }}>
                              {c.editing ? (
                                <div className="flex gap-1">
                                  <input value={c._editText || c.content} onChange={(e) => {
                                    const copy = [...(wallComments[post.id] || [])]
                                    copy[ci] = { ...copy[ci], _editText: e.target.value }
                                    setWallComments(prev => ({ ...prev, [post.id]: copy }))
                                  }} className="flex-1 px-2 py-1 bg-bg-primary border border-bg-card rounded text-xs text-text-primary outline-none" />
                                  <button onClick={() => {
                                    handleEditWallComment(c.id, post.id, wallComments[post.id][ci]._editText || c.content)
                                    const copy = [...(wallComments[post.id] || [])]
                                    copy[ci] = { ...copy[ci], editing: false }
                                    setWallComments(prev => ({ ...prev, [post.id]: copy }))
                                  }} className="px-2 py-1 bg-accent text-white rounded text-xs cursor-pointer">保存</button>
                                </div>
                              ) : (
                                <>
                                  <p className="text-xs text-text-secondary">
                                    <span className="font-medium text-text-primary">{c.nickname || '匿名'}</span> {c.content}
                                  </p>
                                  <div className="flex gap-2 text-[10px] mt-0.5" style={{ color: `${style.accentColor}88` }}>
                                    <span>{formatTime(c.created_at)}</span>
                                    {c.edited_at && <span>已编辑</span>}
                                    {c.visitor_id === visitorId && (
                                      <>
                                        <button onClick={() => {
                                          const copy = [...(wallComments[post.id] || [])]
                                          copy[ci] = { ...copy[ci], editing: true, _editText: c.content }
                                          setWallComments(prev => ({ ...prev, [post.id]: copy }))
                                        }} className="hover:underline cursor-pointer">编辑</button>
                                        <button onClick={() => handleDeleteWallComment(c.id, post.id)} className="hover:underline cursor-pointer">删除</button>
                                      </>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        <div className="flex gap-1 mt-2">
                          <input placeholder="昵称" value={commentNick[post.id] || ''}
                            onChange={e => setCommentNick(prev => ({ ...prev, [post.id]: e.target.value }))}
                            className="w-16 px-2 py-1 bg-bg-primary border border-bg-card rounded text-xs text-text-primary outline-none" />
                          <input placeholder="写评论..." value={commentText[post.id] || ''}
                            onChange={e => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && handleCommentSubmit(post.id)}
                            className="flex-1 px-2 py-1 bg-bg-primary border border-bg-card rounded text-xs text-text-primary outline-none" />
                          <button onClick={() => handleCommentSubmit(post.id)}
                            className="px-2 py-1 bg-accent text-white rounded text-xs cursor-pointer">发送</button>
                        </div>
                      </div>
                    )}
                  </div>
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
