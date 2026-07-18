import { useState, useEffect, useCallback } from "react";
import { api, getVisitorId } from "../lib/api";

interface GuestbookEntry {
  id: number;
  nickname: string;
  content: string;
  image_url: string | null;
  created_at: string;
  visitor_id: string;
  edited_at: string | null;
}

function formatEditedAt(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function Guestbook() {
  const visitorId = getVisitorId();

  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  const fetchEntries = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get(`/guestbook?page=${page}&limit=${limit}`)
      .then((data) => {
        const d = data as { entries: GuestbookEntry[]; total: number };
        setEntries(d.entries);
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
    fetchEntries();
  }, [fetchEntries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post("/guestbook", {
        nickname: nickname.trim() || undefined,
        content: content.trim(),
        visitor_id: visitorId,
      });
      setNickname("");
      setContent("");
      setPage(1);
      fetchEntries();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "留言发布失败"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditEntry = (entry: GuestbookEntry) => {
    setEditingEntryId(entry.id);
    setEditContent(entry.content);
  };

  const handleCancelEdit = () => {
    setEditingEntryId(null);
    setEditContent("");
  };

  const handleSaveEdit = async (entryId: number) => {
    if (!editContent.trim()) return;
    setEditSubmitting(true);
    try {
      await api.put(`/guestbook/${entryId}`, {
        content: editContent.trim(),
        visitor_id: visitorId,
      });
      setEditingEntryId(null);
      setEditContent("");
      fetchEntries();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "编辑失败"
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteEntry = async (entryId: number) => {
    if (!window.confirm("确定要删除这条留言吗？")) return;
    try {
      await api.delete(`/guestbook/${entryId}/own?visitor_id=${visitorId}`);
      fetchEntries();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "删除失败"
      );
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-text-primary mb-6">留言板</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-bg-secondary rounded-xl border border-bg-card p-4 mb-8"
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
          placeholder="留下足迹..."
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
          {submitting ? "提交中..." : "提交"}
        </button>
      </form>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchEntries}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:opacity-80 transition-opacity cursor-pointer"
          >
             重试
          </button>
        </div>
      )}

      {!loading && !error && entries.length === 0 && (
        <div className="text-center py-12">
          <p className="text-text-secondary text-lg">
            还没有留言
          </p>
          <p className="text-text-secondary text-sm mt-2">
            来当第一个吧！
          </p>
        </div>
      )}

      {!loading && !error && entries.length > 0 && (
        <>
          <div className="space-y-3">
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className={`rounded-xl border border-bg-card p-4 ${
                  index % 2 === 0 ? "bg-bg-secondary" : "bg-bg-card/40"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-medium text-text-primary text-sm">
                    {entry.nickname || "匿名"}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {new Date(entry.created_at).toLocaleString('zh-CN')}
                  </span>
                  {entry.visitor_id === visitorId && (
                    <div className="flex gap-2 ml-auto">
                      <button
                        onClick={() => handleEditEntry(entry)}
                        className="text-xs text-text-secondary hover:text-accent transition-colors cursor-pointer"
                      >
                        [编辑]
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="text-xs text-text-secondary hover:text-red-400 transition-colors cursor-pointer"
                      >
                        [删除]
                      </button>
                    </div>
                  )}
                </div>
                {editingEntryId === entry.id ? (
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
                        onClick={() => handleSaveEdit(entry.id)}
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
                    <p className="text-text-secondary text-sm whitespace-pre-wrap">
                      {entry.content}
                    </p>
                    {entry.edited_at && (
                      <p className="text-xs text-text-secondary mt-1">
                        最后编辑于 {formatEditedAt(entry.edited_at)}
                      </p>
                    )}
                  </>
                )}
                {entry.image_url && (
                  <img
                    src={entry.image_url}
                    alt="留言图片"
                    className="mt-2 max-w-xs rounded-lg"
                  />
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm rounded-lg bg-bg-card text-text-secondary hover:bg-bg-card/70 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                上一页
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
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
                onClick={() => setPage((p) => p + 1)}
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
