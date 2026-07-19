import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api, formatTime } from "../lib/api";
import MusicPlayer from "../components/MusicPlayer";

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

interface Tag {
  id: number;
  name: string;
  count: number;
}

interface TagSong {
  id: number;
  tag_id: number;
  title: string;
  url: string;
  created_at: string;
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

export default function TagPage() {
  const { tagName } = useParams<{ tagName: string }>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [tag, setTag] = useState<Tag | null>(null);
  const [songs, setSongs] = useState<TagSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tagName) return;
    setLoading(true);
    setError(null);
    Promise.all([
      api.get(`/articles?tag=${encodeURIComponent(tagName)}`),
      api.get('/tags'),
    ])
      .then(([articlesData, tagsData]) => {
        setArticles((articlesData as { articles: Article[] }).articles || []);
        const tagList = tagsData as Tag[];
        const found = tagList.find((t) => t.name === tagName) || null;
        setTag(found);
        if (found) {
          api.get(`/tag-songs/tag/${found.id}`)
            .then((songsData) => {
              setSongs(songsData as TagSong[] || []);
            })
            .catch(() => {});
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "加载失败");
      })
      .finally(() => setLoading(false));
  }, [tagName]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              #{tagName}
            </h1>
            <p className="text-text-secondary text-sm">{articles.length} 篇文章</p>
          </div>

          {songs.length > 0 && (
            <div className="mb-6 flex flex-col gap-2">
              {songs.map((song) => (
                <MusicPlayer key={song.id} url={song.url} title={song.title} highlightTime={(song as any).highlight_time || 0} />
              ))}
            </div>
          )}

          {articles.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <p className="text-lg">这个标签下还没有文章</p>
            </div>
          ) : (
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
                          {article.tags.map((t) => (
                            <Link
                              key={t}
                              to={`/tags/${encodeURIComponent(t)}`}
                              className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
                                t === tagName ? 'bg-accent/30 text-accent' : 'bg-bg-secondary text-text-secondary hover:text-accent'
                              }`}
                            >
                              {t}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
