import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../lib/api";

interface WallPost {
  id: number;
  nickname: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
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
  const [posts, setPosts] = useState<WallPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const formRef = useRef<HTMLDivElement>(null);
  const limit = 30;
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
    if (!content.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post("/wall", {
        nickname: nickname.trim() || undefined,
        content: content.trim(),
      });
      setNickname("");
      setContent("");
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

  const loadMore = () => {
    if (page < totalPages) {
      setPage((p) => p + 1);
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
          {submitError && (
            <p className="text-red-400 text-sm mb-2">{submitError}</p>
          )}
          <button
            type="submit"
            disabled={!content.trim() || submitting}
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
                  </div>
                  {post.content && (
                    <p className="text-text-secondary text-sm whitespace-pre-wrap mb-2">
                      {post.content}
                    </p>
                  )}
                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt="涂鸦帖子"
                      className="w-full rounded-lg mb-2"
                    />
                  )}
                  <p
                    className="text-xs mt-2"
                    style={{ color: `${style.accentColor}aa` }}
                  >
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
              );
            })}
          </div>

          {page < totalPages && (
            <div className="flex justify-center mt-8">
              <button
                onClick={loadMore}
                className="px-6 py-2.5 bg-accent text-white rounded-lg text-sm hover:opacity-80 transition-opacity cursor-pointer"
              >
                加载更多
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
