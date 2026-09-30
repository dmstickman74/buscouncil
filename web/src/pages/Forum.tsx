import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { fmtRelative } from "@/lib/format";
import { Button, Card, CardBody, PageHeader, Spinner, Badge } from "@/components/ui";
import type { ThreadSummary, ThreadsResponse } from "@/lib/types";

export function ForumPage() {
  const { identity } = useAuth();
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const councilId = identity?.council_id;
  const perPage = 20;

  useEffect(() => {
    if (!councilId) return;
    setLoading(true);
    api<ThreadsResponse>(`/councils/${councilId}/threads?page=${page}&per_page=${perPage}`)
      .then((data) => {
        setThreads(data.threads);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  }, [councilId, page]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div>
      <PageHeader
        title="Discussions"
        description="Share ideas, ask questions, and stay connected between meetings."
        actions={<Link to="/forum/new"><Button>New Discussion</Button></Link>}
      />

      {loading ? (
        <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>
      ) : threads.length === 0 ? (
        <Card>
          <CardBody className="text-center py-14">
            <div className="w-14 h-14 rounded-2xl bg-navy-50 text-navy flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
            </div>
            <p className="text-txt2 mb-1 font-medium">No discussions yet</p>
            <p className="text-sm text-txt3 mb-5">Be the first to start a conversation with your council.</p>
            <Link to="/forum/new"><Button>Start a Discussion</Button></Link>
          </CardBody>
        </Card>
      ) : (
        <>
          <Card>
            <div className="divide-y divide-border-light">
              {threads.map((t) => (
                <Link
                  key={t.id}
                  to={`/forum/${t.id}`}
                  className="group flex items-start gap-4 px-5 py-4 hover:bg-surface-alt transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy to-navy-light text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                    {t.author.display_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {t.pinned && <Badge color="gold">Pinned</Badge>}
                      {t.locked && <Badge color="gray">Locked</Badge>}
                      {t.tags.map((tag) => (
                        <Badge key={tag.id} color="navy">{tag.name}</Badge>
                      ))}
                      <span className="font-medium text-txt group-hover:text-navy transition-colors">{t.title}</span>
                    </div>
                    <div className="text-xs text-txt3 mt-1">
                      {t.author.display_name}
                      {t.author.company && <> &middot; {t.author.company}</>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-navy-50 text-navy text-xs font-medium">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" /></svg>
                      {t.reply_count}
                    </div>
                    <div className="text-xs text-txt3 mt-1">{fmtRelative(t.last_activity_at)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-5">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <span className="text-sm text-txt2">Page {page} of {totalPages}</span>
              <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
