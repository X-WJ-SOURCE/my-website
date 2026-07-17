import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = () => {
    setLoading(true);
    setError(null);
    api
      .get("/articles?limit=5")
      .then((data) => {
        setArticles((data as { articles: Article[] }).articles);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "加载失败");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <section className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          我的空间
        </h1>
        <p className="text-text-secondary text-lg">记录生活，分享秘密，留下足迹</p>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-primary">最新文章</h2>
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
              onClick={fetchArticles}
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
          <div className="space-y-4">
            {articles.map((article) => (
              <Link
                key={article.id}
                to={`/articles/${article.id}`}
                className="block p-6 bg-bg-secondary rounded-xl border border-bg-card hover:border-accent/50 transition-all duration-200"
              >
                <h3 className="text-lg font-semibold text-text-primary mb-2 hover:text-accent transition-colors">
                  {article.title}
                </h3>
                <div className="flex items-center gap-4 text-sm text-text-secondary mb-2">
                  <span>{new Date(article.created_at).toLocaleDateString()}</span>
                  <span>{article.view_count} 次阅读</span>
                </div>
                {article.tags.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
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
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
