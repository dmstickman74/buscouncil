import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { fmtRelative, fmtDateTime } from "@/lib/format";
import { Card, CardHeader, CardBody, PageHeader, Spinner, Badge } from "@/components/ui";
import type { ThreadSummary, ThreadsResponse, Meeting, Council } from "@/lib/types";

export function DashboardPage() {
  const { identity } = useAuth();
  const [council, setCouncil] = useState<Council | null>(null);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const councilId = identity?.council_id;
  const councilSlug = identity?.council_slug;

  useEffect(() => {
    if (!councilId || !councilSlug) {
      setLoading(false);
      return;
    }

    Promise.all([
      api<Council>(`/councils/${councilSlug}`),
      api<ThreadsResponse>(`/councils/${councilId}/threads?per_page=5`),
      api<Meeting[]>(`/councils/${councilId}/meetings`),
    ]).then(([c, t, m]) => {
      setCouncil(c);
      setThreads(t.threads);
      setMeetings(m.filter((mtg) => new Date(mtg.meeting_date) >= new Date()).slice(0, 2));
    }).finally(() => setLoading(false));
  }, [councilId, councilSlug]);

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>;
  }

  if (!councilId) {
    return (
      <div className="text-center py-12">
        <PageHeader title="Welcome" description="You haven't been assigned to a council yet. Contact an administrator." />
      </div>
    );
  }

  const nextMeeting = meetings[0];

  return (
    <div>
      <PageHeader
        title={council?.name || "Council Dashboard"}
        description={council?.description || undefined}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardBody className="text-center">
            <div className="text-3xl font-bold text-navy">{council?.member_count || 0}</div>
            <div className="text-sm text-txt2 mt-1">Members</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <div className="text-3xl font-bold text-navy">{threads.length > 0 ? threads[0].reply_count + threads.length : 0}</div>
            <div className="text-sm text-txt2 mt-1">Discussions</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <div className="text-3xl font-bold text-navy">{meetings.length}</div>
            <div className="text-sm text-txt2 mt-1">Upcoming Meetings</div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h2 className="font-semibold text-txt">Recent Discussions</h2>
              <Link to="/forum" className="text-sm text-navy font-medium hover:underline">View all</Link>
            </CardHeader>
            <CardBody className="p-0">
              {threads.length === 0 ? (
                <p className="p-5 text-sm text-txt3">No discussions yet. Start one!</p>
              ) : (
                <div className="divide-y divide-border-light">
                  {threads.map((t) => (
                    <Link key={t.id} to={`/forum/${t.id}`} className="block px-5 py-3 hover:bg-surface-alt transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {t.pinned && <Badge color="gold">Pinned</Badge>}
                            <span className="font-medium text-sm text-txt truncate">{t.title}</span>
                          </div>
                          <div className="text-xs text-txt3 mt-1">
                            {t.author.display_name} &middot; {t.reply_count} {t.reply_count === 1 ? "reply" : "replies"}
                          </div>
                        </div>
                        <span className="text-xs text-txt3 shrink-0">{fmtRelative(t.last_activity_at)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-txt">Next Meeting</h2>
            </CardHeader>
            <CardBody>
              {nextMeeting ? (
                <div>
                  <div className="font-medium text-sm">{nextMeeting.title}</div>
                  <div className="text-sm text-txt2 mt-1">{fmtDateTime(nextMeeting.meeting_date)}</div>
                  {nextMeeting.location && (
                    <div className="text-sm text-txt3 mt-1">{nextMeeting.location}</div>
                  )}
                  {nextMeeting.meeting_link && (
                    <a href={nextMeeting.meeting_link} target="_blank" rel="noreferrer"
                       className="inline-block mt-2 text-sm text-navy font-medium hover:underline">
                      Join Meeting
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-sm text-txt3">No upcoming meetings scheduled.</p>
              )}
            </CardBody>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <h2 className="font-semibold text-txt">Quick Links</h2>
            </CardHeader>
            <CardBody className="flex flex-col gap-2">
              <Link to="/forum/new" className="text-sm text-navy font-medium hover:underline">Start a Discussion</Link>
              <Link to="/documents" className="text-sm text-navy font-medium hover:underline">Browse Documents</Link>
              <Link to="/members" className="text-sm text-navy font-medium hover:underline">Member Directory</Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
