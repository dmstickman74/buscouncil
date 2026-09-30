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
          <CardBody className="text-center py-12">
            <p className="text-txt3 mb-4">No discussions yet. Be the first to start one!</p>
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
                  className="flex items-start gap-4 px-5 py-4 hover:bg-surface-alt transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {t.pinned && <Badge color="gold">Pinned</Badge>}
                      {t.locked && <Badge color="gray">Locked</Badge>}
                      {t.tags.map((tag) => (
                        <Badge key={tag.id} color="navy">{tag.name}</Badge>
                      ))}
                      <span className="font-medium text-txt">{t.title}</span>
                    </div>
                    <div className="text-xs text-txt3 mt-1">
                      Started by {t.author.display_name}
                      {t.author.company && <>, {t.author.company}</>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-medium text-txt2">{t.reply_count}</div>
                    <div className="text-xs text-txt3">{t.reply_count === 1 ? "reply" : "replies"}</div>
                    <div className="text-xs text-txt3 mt-1">{fmtRelative(t.last_activity_at)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-4">
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
