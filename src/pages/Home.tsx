import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api, formatTime } from "../lib/api";

interface Article {
  id: number;
  title: string;
  content: string;
  visibility: string;
  created_at: string;
  tags: string[];
  view_count: number;
  cover_url: string | null;
}

interface Stats {
  articles: number;
  comments: number;
  guestbook: number;
  wall: number;
}

interface Tag {
  id: number;
  name: string;
  count: number;
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
          <rect x="0" y="0" width="100%" height="100%" fill="url(#grid-lines)" />
          <defs>
            <pattern id="grid-lines" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
            </pattern>
          </defs>
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

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [stats, setStats] = useState<Stats>({ articles: 0, comments: 0, guestbook: 0, wall: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.get("/articles?limit=6"),
      api.get("/stats"),
      api.get("/tags"),
    ])
      .then(([articlesData, statsData, tagsData]) => {
        setArticles((articlesData as { articles: Article[] }).articles);
        setStats(statsData as Stats);
        setTags(tagsData as Tag[]);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "加载失败");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <section className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          我的空间
        </h1>
        <p className="text-text-secondary text-sm">记录生活，分享秘密</p>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        {[
          { label: "文章数", value: stats.articles },
          { label: "评论数", value: stats.comments },
          { label: "留言数", value: stats.guestbook },
          { label: "涂鸦数", value: stats.wall },
        ].map((stat) => (
          <div key={stat.label} className="bg-bg-secondary rounded-xl border border-bg-card p-4 text-center">
            <div className="text-2xl font-bold text-accent">{stat.value}</div>
            <div className="text-xs text-text-secondary mt-1">{stat.label}</div>
          </div>
        ))}
      </section>

      {tags.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {tags.map((tag) => (
              <Link
                key={tag.id}
                to={`/tags/${encodeURIComponent(tag.name)}`}
                className="shrink-0 px-4 py-2 rounded-full bg-bg-card border border-bg-card hover:border-accent/50 hover:text-accent text-text-secondary text-sm transition-colors"
              >
                #{tag.name} <span className="text-text-secondary/50 text-xs">({tag.article_count})</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-primary">最新文章</h2>
          <div className="flex gap-4">
            <Link
              to="/articles"
              className="text-accent hover:opacity-80 transition-opacity text-sm"
            >
              查看全部 →
            </Link>
            <Link
              to="/timeline"
              className="text-accent hover:opacity-80 transition-opacity text-sm"
            >
              时光轴 →
            </Link>
          </div>
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
              onClick={fetchData}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:opacity-80 transition-opacity cursor-pointer"
            >
              重试
            </button>
          </div>
        )}

        {!loading && !error && articles.length === 0 && (
          <div className="text-center py-12 text-text-secondary">
            <p className="text-lg">还没有文章</p>
            <p className="text-sm mt-2">稍后再来看看吧</p>
          </div>
        )}

        {!loading && !error && articles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articles.map((article) => {
              const cover = getCover(article.id);
              return (
                <div
                  key={article.id}
                  className="bg-bg-card rounded-xl overflow-hidden border border-bg-card hover:border-accent/30 transition-colors"
                >
                  <Link to={`/articles/${article.id}`}>
                    {article.cover_url ? (
                      <img src={article.cover_url} alt="" className="h-32 w-full object-cover" />
                    ) : (
                      <div style={{ background: cover.bg }} className="h-32 relative flex items-center justify-center overflow-hidden">
                        <PatternSVG pattern={cover.pattern} />
                      </div>
                    )}
                  </Link>
                  <div className="p-4">
                    <Link to={`/articles/${article.id}`}>
                      <h3 className="font-bold text-text-primary hover:text-accent transition-colors line-clamp-1">
                        {article.title}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-3 text-xs text-text-secondary mt-2">
                      <span>{formatTime(article.created_at)}</span>
                      <span>{article.view_count} 阅读</span>
                    </div>
                    {article.tags.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {article.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full bg-bg-secondary text-xs text-text-secondary"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
