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
            {articles.map((article) => (
              <Link
                key={article.id}
                to={`/articles/${article.id}`}
                className="block p-6 bg-bg-secondary rounded-xl border border-bg-card hover:border-accent/50 transition-all duration-200"
              >
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
              </Link>
            ))}
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
