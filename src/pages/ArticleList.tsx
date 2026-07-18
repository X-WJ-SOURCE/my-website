import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";

interface Article {
  id: number;
  title: string;
  content: string;
  visibility: string;
  created_at: string;
  tags: string[];
  view_count: number;
}

interface Tag {
  id: number;
  name: string;
  article_count: number;
}

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

export default function ArticleList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const page = parseInt(searchParams.get("page") || "1");
  const activeTag = searchParams.get("tag") || "";
  const limit = 10;

  const fetchArticles = () => {
    setLoading(true);
    setError(null);
    const tagParam = activeTag ? `&tag=${encodeURIComponent(activeTag)}` : "";
    api
      .get(`/articles?page=${page}&limit=${limit}${tagParam}`)
      .then((data) => {
        const d = data as { articles: Article[]; total: number };
        setArticles(d.articles);
        setTotal(d.total);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "加载失败");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchArticles();
  }, [page, activeTag]);

  useEffect(() => {
    api
      .get("/tags")
      .then((data) => setTags(data as Tag[]))
      .catch(() => {});
  }, []);

  const totalPages = Math.ceil(total / limit);

  const handleTagClick = (tagName: string) => {
    if (activeTag === tagName) {
      setSearchParams({});
    } else {
      setSearchParams({ tag: tagName });
    }
  };

  const goToPage = (p: number) => {
    const params: Record<string, string> = { page: String(p) };
    if (activeTag) params.tag = activeTag;
    setSearchParams(params);
  };

  const truncate = (text: string, maxLen: number) => {
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen) + "...";
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-text-primary mb-6">文章列表</h1>

      {tags.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            onClick={() => setSearchParams({})}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors cursor-pointer ${
              !activeTag
                ? "bg-accent text-white"
                : "bg-bg-card text-text-secondary hover:bg-bg-card/70"
            }`}
          >
            全部
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => handleTagClick(tag.name)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors cursor-pointer ${
                activeTag === tag.name
                  ? "bg-accent text-white"
                  : "bg-bg-card text-text-secondary hover:bg-bg-card/70"
              }`}
            >
              {tag.name} ({tag.article_count})
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchArticles}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:opacity-80 transition-opacity cursor-pointer"
          >
             重试
          </button>
        </div>
      )}

      {!loading && !error && articles.length === 0 && (
        <div className="text-center py-12 text-text-secondary">
          <p className="text-lg">没有找到文章</p>
          <p className="text-sm mt-2">
            {activeTag
              ? "试试选择其他标签"
              : "稍后再来看看吧"}
          </p>
        </div>
      )}

      {!loading && !error && articles.length > 0 && (
        <>
          <div className="space-y-4">
            {articles.map((article) => {
              const cover = getCover(article.id);
              return (
                <Link
                  key={article.id}
                  to={`/articles/${article.id}`}
                  className="block bg-bg-card rounded-xl overflow-hidden border border-bg-card hover:border-accent/30 transition-all duration-200"
                >
                  <div style={{ background: cover.bg }} className="h-24 relative flex items-center justify-center overflow-hidden">
                    <PatternSVG pattern={cover.pattern} />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-text-primary mb-2 hover:text-accent transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-text-secondary text-sm mb-3 leading-relaxed">
                      {truncate(article.content, 150)}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-text-secondary">
                      <span>{new Date(article.created_at).toLocaleDateString()}</span>
                      <span>{article.view_count} 次阅读</span>
                    </div>
                    {article.tags.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-2">
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
                  </div>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm rounded-lg bg-bg-card text-text-secondary hover:bg-bg-card/70 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                上一页
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors cursor-pointer ${
                    p === page
                      ? "bg-accent text-white"
                      : "bg-bg-card text-text-secondary hover:bg-bg-card/70"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm rounded-lg bg-bg-card text-text-secondary hover:bg-bg-card/70 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
