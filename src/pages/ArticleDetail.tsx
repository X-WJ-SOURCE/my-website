import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { api, getVisitorId } from "../lib/api";
import Markdown from "../components/Markdown";

interface Article {
  id: number;
  title: string;
  content: string;
  visibility: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  view_count: number;
  cover_url: string | null;
}

interface Comment {
  id: number;
  nickname: string;
  content: string;
  image_url: string | null;
  created_at: string;
}

interface ReactionCount {
  emoji_type: string;
  count: number;
}

const EMOJIS = ["❤️", "😂", "👍", "😮", "😢"];

function getCover(id: number): { bg: string; pattern: string } {
  const palettes = [
    ['#818cf8', '#c084fc'], ['#06b6d4', '#3b82f6'], ['#f59e0b', '#ef4444'],
    ['#22c55e', '#06b6d4'], ['#ec4899', '#f97316'], ['#6366f1', '#a855f7'],
  ]
  const idx = id % palettes.length
  return { bg: `linear-gradient(135deg, ${palettes[idx][0]}, ${palettes[idx][1]})`, pattern: getPattern(id) }
}

function getPattern(i: number): string {
  const patterns = ['circle', 'wave', 'dots', 'grid', 'triangle']
  return patterns[i % patterns.length]
}

function PatternSVG({ pattern }: { pattern: string }) {
  switch (pattern) {
    case 'circle':
      return (
        <svg width="100%" height="100%" className="absolute inset-0 opacity-20">
          <circle cx="20%" cy="30%" r="12" fill="rgba(255,255,255,0.6)" />
          <circle cx="75%" cy="60%" r="8" fill="rgba(255,255,255,0.4)" />
          <circle cx="45%" cy="75%" r="6" fill="rgba(255,255,255,0.3)" />
          <circle cx="85%" cy="20%" r="10" fill="rgba(255,255,255,0.5)" />
        </svg>
      );
    case 'wave':
      return (
        <svg width="100%" height="100%" className="absolute inset-0 opacity-15" preserveAspectRatio="none">
          <path d="M0,32 Q25,16 50,32 T100,32 L100,100 L0,100 Z" fill="rgba(255,255,255,0.5)" />
          <path d="M0,64 Q25,48 50,64 T100,64 L100,100 L0,100 Z" fill="rgba(255,255,255,0.3)" />
        </svg>
      );
    case 'dots':
      return (
        <svg width="100%" height="100%" className="absolute inset-0 opacity-20">
          <defs>
            <pattern id="dots-pattern" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="4" cy="4" r="1.5" fill="rgba(255,255,255,0.6)" />
              <circle cx="12" cy="12" r="1.5" fill="rgba(255,255,255,0.4)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots-pattern)" />
        </svg>
      );
    case 'grid':
      return (
        <svg width="100%" height="100%" className="absolute inset-0 opacity-15">
          <defs>
            <pattern id="grid-lines" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-lines)" />
        </svg>
      );
    case 'triangle':
      return (
        <svg width="100%" height="100%" className="absolute inset-0 opacity-20">
          <polygon points="50,5 95,95 5,95" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
          <polygon points="50,15 85,85 15,85" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
          <polygon points="50,25 75,75 25,75" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        </svg>
      );
    default:
      return null;
  }
}

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const visitorId = getVisitorId();

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);

  const [reactions, setReactions] = useState<ReactionCount[]>([]);
  const [userReactions, setUserReactions] = useState<string[]>([]);
  const [reactionLoading, setReactionLoading] = useState(false);

  const [commentNickname, setCommentNickname] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const fetchArticle = useCallback(() => {
    setLoading(true);
    setError(null);
    setIsPrivate(false);
    api
      .get(`/articles/${id}?visitor_id=${visitorId}`)
      .then((data) => {
        setArticle(data as Article);
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "加载失败";
        setError(msg);
        if (msg.toLowerCase().includes("not found")) {
          setIsPrivate(true);
        }
      })
      .finally(() => setLoading(false));
  }, [id, visitorId]);

  const fetchComments = useCallback(() => {
    setCommentsLoading(true);
    api
      .get(`/comments/article/${id}`)
      .then((data) => {
        setComments((data as { comments: Comment[] }).comments);
      })
      .catch(() => {})
      .finally(() => setCommentsLoading(false));
  }, [id]);

  const fetchReactions = useCallback(() => {
    api
      .get(`/reactions/article/${id}?visitor_id=${visitorId}`)
      .then((data) => {
        const d = data as {
          reactions: ReactionCount[];
          user_reactions: string[];
        };
        setReactions(d.reactions);
        setUserReactions(d.user_reactions);
      })
      .catch(() => {});
  }, [id, visitorId]);

  useEffect(() => {
    fetchArticle();
    fetchComments();
    fetchReactions();
  }, [fetchArticle, fetchComments, fetchReactions]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    setCommentSubmitting(true);
    setCommentError(null);
    try {
      await api.post(`/comments/article/${id}`, {
        nickname: commentNickname.trim() || undefined,
        content: commentContent.trim(),
      });
      setCommentNickname("");
      setCommentContent("");
      fetchComments();
    } catch (err) {
      setCommentError(
        err instanceof Error ? err.message : "评论发布失败"
      );
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleReaction = async (emoji: string) => {
    setReactionLoading(true);
    try {
      const result = (await api.post(`/reactions/article/${id}`, {
        emoji_type: emoji,
        visitor_id: visitorId,
      })) as { action: string };

      if (result.action === "added") {
        setUserReactions((prev) => [...prev, emoji]);
        setReactions((prev) => {
          const existing = prev.find((r) => r.emoji_type === emoji);
          if (existing) {
            return prev.map((r) =>
              r.emoji_type === emoji ? { ...r, count: r.count + 1 } : r
            );
          }
          return [...prev, { emoji_type: emoji, count: 1 }];
        });
      } else {
        setUserReactions((prev) => prev.filter((e) => e !== emoji));
        setReactions((prev) =>
          prev
            .map((r) =>
              r.emoji_type === emoji
                ? { ...r, count: Math.max(0, r.count - 1) }
                : r
            )
            .filter((r) => r.count > 0)
        );
      }
    } catch {
      // silently fail
    } finally {
      setReactionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        {isPrivate ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              这是私密文章，请登录后查看
            </h2>
            <p className="text-text-secondary">
              您需要登录后才能查看此文章
            </p>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchArticle}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:opacity-80 transition-opacity cursor-pointer"
            >
              重试
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!article) return null;

  const cover = getCover(article.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="relative rounded-xl overflow-hidden mb-6">
        {article.cover_url ? (
          <div className="relative max-h-80">
            <img
              src={article.cover_url}
              alt=""
              className="w-full max-h-80 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-4 left-6 right-6">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg">
                {article.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-white/80">
                <span>{new Date(article.created_at).toLocaleDateString()}</span>
                <span>{article.view_count} 次阅读</span>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{ background: cover.bg }}
            className="relative"
          >
            <div className="h-48 md:h-64 relative flex items-center justify-center">
              <PatternSVG pattern={cover.pattern} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-4 left-6 right-6">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg">
                  {article.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-white/80">
                  <span>{new Date(article.created_at).toLocaleDateString()}</span>
                  <span>{article.view_count} 次阅读</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <article>

        {article.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-6">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs rounded-full bg-accent/20 text-accent"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="bg-bg-secondary rounded-xl border border-bg-card p-6 mb-8">
          <Markdown content={article.content} />
        </div>
      </article>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-text-primary mb-3">
            表情
        </h3>
        <div className="flex gap-2 flex-wrap">
          {EMOJIS.map((emoji) => {
            const reactionData = reactions.find((r) => r.emoji_type === emoji);
            const count = reactionData?.count || 0;
            const isActive = userReactions.includes(emoji);
            return (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                disabled={reactionLoading}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-lg transition-all cursor-pointer ${
                  isActive
                    ? "bg-accent/30 ring-1 ring-accent"
                    : "bg-bg-card hover:bg-bg-card/70"
                } disabled:opacity-60`}
              >
                <span>{emoji}</span>
                {count > 0 && (
                  <span className="text-xs text-text-secondary">{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-text-primary mb-4">
            评论
        </h3>

        <form
          onSubmit={handleCommentSubmit}
          className="bg-bg-secondary rounded-xl border border-bg-card p-4 mb-6"
        >
          <input
            type="text"
            placeholder="昵称（选填）"
            value={commentNickname}
            onChange={(e) => setCommentNickname(e.target.value)}
            maxLength={50}
            className="w-full px-3 py-2 mb-3 bg-bg-primary border border-bg-card rounded-lg text-text-primary placeholder-text-secondary text-sm focus:outline-none focus:border-accent"
          />
          <textarea
            placeholder="写评论..."
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            rows={3}
            maxLength={1000}
            className="w-full px-3 py-2 mb-3 bg-bg-primary border border-bg-card rounded-lg text-text-primary placeholder-text-secondary text-sm focus:outline-none focus:border-accent resize-none"
          />
          {commentError && (
            <p className="text-red-400 text-sm mb-2">{commentError}</p>
          )}
          <button
            type="submit"
            disabled={!commentContent.trim() || commentSubmitting}
            className="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {commentSubmitting ? "提交中..." : "提交"}
          </button>
        </form>

        {commentsLoading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!commentsLoading && comments.length === 0 && (
          <p className="text-text-secondary text-sm text-center py-6">
            还没有评论，快来抢沙发！
          </p>
        )}

        {!commentsLoading && comments.length > 0 && (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-bg-secondary rounded-xl border border-bg-card p-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-medium text-text-primary text-sm">
                    {comment.nickname || "匿名"}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-text-secondary text-sm whitespace-pre-wrap">
                  {comment.content}
                </p>
                {comment.image_url && (
                  <img
                    src={comment.image_url}
                    alt="评论图片"
                    className="mt-2 max-w-xs rounded-lg"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
