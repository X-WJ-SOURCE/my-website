import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

interface TimelineArticle {
  id: number;
  title: string;
  date: string;
  visibility: string;
}

function getSeasonIcon(dateStr: string): string {
  const month = parseInt(dateStr.split('-')[1]) || 1
  if (month >= 3 && month <= 5) return '🌸'
  if (month >= 6 && month <= 8) return '☀️'
  if (month >= 9 && month <= 11) return '🍂'
  return '❄️'
}

export default function Timeline() {
  const [articles, setArticles] = useState<TimelineArticle[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeline = useCallback(() => {
    setLoading(true);
    setError(null);
    const yearParam = selectedYear ? `?year=${selectedYear}` : "";
    api
      .get(`/timeline${yearParam}`)
      .then((data) => {
        const d = data as { articles: TimelineArticle[]; years: string[] };
        setArticles(d.articles);
        setYears(d.years);
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "加载失败"
        );
      })
      .finally(() => setLoading(false));
  }, [selectedYear]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-text-primary mb-2">时光轴</h1>
      <p className="text-text-secondary text-sm mb-6">
        文章的时间旅行
      </p>

      {years.length > 0 && (
        <div className="flex items-center gap-3 mb-8">
          <label className="text-text-secondary text-sm">按年份筛选：</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-1.5 bg-bg-secondary border border-bg-card rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="">全部年份</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
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
            onClick={fetchTimeline}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:opacity-80 transition-opacity cursor-pointer"
          >
              重试
          </button>
        </div>
      )}

      {!loading && !error && articles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-text-secondary text-lg">
                          时光轴上还没有文章{selectedYear ? ` (${selectedYear})` : ""}.
          </p>
        </div>
      )}

      {!loading && !error && articles.length > 0 && (
        <div className="relative">
          <div className="absolute left-[15px] md:left-1/2 top-0 bottom-0 w-0.5 bg-bg-card -translate-x-1/2" />

          <div className="space-y-8">
            {articles.map((article, index) => {
              const isLeft = index % 2 === 0;
              return (
                <div
                  key={article.id}
                  className={`relative flex items-start gap-6 ${
                    isLeft
                      ? "md:flex-row-reverse md:text-right"
                      : "md:flex-row"
                  } flex-row`}
                >
                  <div className="hidden md:flex w-1/2" />

                  <div className="absolute left-[15px] md:left-1/2 -translate-x-1/2 z-10">
                    <div className="w-3.5 h-3.5 rounded-full bg-accent border-2 border-bg-primary ring-2 ring-bg-card" />
                  </div>

                  <div className="ml-10 md:ml-0 md:w-1/2">
                    <Link
                      to={`/articles/${article.id}`}
                      className="block bg-bg-secondary rounded-xl border border-bg-card p-4 hover:border-accent/50 transition-all duration-200"
                    >
                      <span className="text-xs text-accent font-mono block mb-1">
                        {getSeasonIcon(article.date)} {article.date}
                      </span>
                      <h3 className="text-text-primary font-medium hover:text-accent transition-colors text-sm">
                        {article.title}
                      </h3>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
