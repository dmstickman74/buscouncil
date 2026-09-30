import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { fmtRelative, fmtDateTime } from "@/lib/format";
import { Card, CardHeader, CardBody, Spinner, Badge } from "@/components/ui";
import { COUNCIL_ROLE_LABELS } from "@/lib/types";
import type { ThreadSummary, ThreadsResponse, Meeting, Council } from "@/lib/types";

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color: string }) {
  return (
    <Card className="overflow-hidden">
      <CardBody className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          {icon}
        </div>
        <div>
          <div className="text-2xl font-bold text-navy">{value}</div>
          <div className="text-sm text-txt2">{label}</div>
        </div>
      </CardBody>
    </Card>
  );
}

function QuickLinkCard({ to, icon, title, desc }: { to: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link to={to} className="group">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border-light bg-surface hover:border-navy/20 hover:shadow-sm transition-all">
        <div className="w-9 h-9 rounded-lg bg-navy-50 text-navy flex items-center justify-center shrink-0 group-hover:bg-navy group-hover:text-white transition-colors">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-txt group-hover:text-navy transition-colors">{title}</div>
          <div className="text-xs text-txt3">{desc}</div>
        </div>
      </div>
    </Link>
  );
}

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
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-navy-50 text-navy flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
        </div>
        <h1 className="text-2xl font-bold text-txt mb-2">Welcome</h1>
        <p className="text-txt2">You haven't been assigned to a council yet. Contact an administrator.</p>
      </div>
    );
  }

  const nextMeeting = meetings[0];
  const roleLabel = identity?.council_role ? COUNCIL_ROLE_LABELS[identity.council_role] || identity.council_role : null;

  return (
    <div className="-mt-7 -mx-6 sm:-mx-6">
      {/* Welcome hero */}
      <div className="bg-gradient-to-br from-navy via-navy-light to-navy-dark px-6 sm:px-8 py-8 sm:py-10 mb-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-white/60 text-sm mb-1">Welcome back,</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {identity?.user.display_name}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-white/80 text-sm">{council?.name}</span>
                {roleLabel && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green/20 text-green-light border border-green/30">
                    {roleLabel}
                  </span>
                )}
              </div>
            </div>
            {nextMeeting && (
              <div className="hidden sm:flex items-center gap-3 bg-white/10 backdrop-blur rounded-xl px-4 py-3 border border-white/10">
                <div className="text-center shrink-0">
                  <div className="text-xs font-medium text-green-light uppercase">
                    {new Date(nextMeeting.meeting_date).toLocaleDateString("en-US", { month: "short" })}
                  </div>
                  <div className="text-2xl font-bold text-white leading-tight">
                    {new Date(nextMeeting.meeting_date).getDate()}
                  </div>
                </div>
                <div className="border-l border-white/15 pl-3 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{nextMeeting.title}</div>
                  <div className="text-xs text-white/50">
                    {nextMeeting.location || "Virtual"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 sm:px-6 max-w-[1200px] mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard
            icon={<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
            value={council?.member_count || 0}
            label="Members"
            color="bg-navy/8 text-navy"
          />
          <StatCard
            icon={<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>}
            value={threads.length > 0 ? threads[0].reply_count + threads.length : 0}
            label="Discussions"
            color="bg-green/10 text-green-dark"
          />
          <StatCard
            icon={<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>}
            value={meetings.length}
            label="Upcoming Meetings"
            color="bg-gold/10 text-gold"
          />
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Discussions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex items-center justify-between">
                <h2 className="font-semibold text-txt">Recent Discussions</h2>
                <Link to="/forum" className="text-sm text-navy font-medium hover:underline">View all</Link>
              </CardHeader>
              <CardBody className="p-0">
                {threads.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-center">
                    <div className="w-12 h-12 rounded-xl bg-navy-50 text-navy flex items-center justify-center mb-3">
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
                    </div>
                    <p className="text-sm text-txt3 mb-3">No discussions yet. Be the first to start one!</p>
                    <Link to="/forum/new" className="text-sm font-medium text-navy hover:underline">Start a Discussion</Link>
                  </div>
                ) : (
                  <div className="divide-y divide-border-light">
                    {threads.map((t) => (
                      <Link key={t.id} to={`/forum/${t.id}`} className="group flex items-start gap-3 px-5 py-3.5 hover:bg-surface-alt transition-colors">
                        <div className="w-8 h-8 rounded-full bg-navy/8 text-navy flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          {t.author.display_name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {t.pinned && <Badge color="gold">Pinned</Badge>}
                            <span className="font-medium text-sm text-txt group-hover:text-navy transition-colors truncate">{t.title}</span>
                          </div>
                          <div className="text-xs text-txt3 mt-0.5">
                            {t.author.display_name} &middot; {t.reply_count} {t.reply_count === 1 ? "reply" : "replies"}
                          </div>
                        </div>
                        <span className="text-xs text-txt3 shrink-0 mt-1">{fmtRelative(t.last_activity_at)}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">
            {/* Next Meeting (mobile - shown in hero on desktop) */}
            {nextMeeting && (
              <Card className="sm:hidden">
                <CardHeader><h2 className="font-semibold text-txt">Next Meeting</h2></CardHeader>
                <CardBody>
                  <div className="font-medium text-sm">{nextMeeting.title}</div>
                  <div className="text-sm text-txt2 mt-1">{fmtDateTime(nextMeeting.meeting_date)}</div>
                  {nextMeeting.location && <div className="text-sm text-txt3 mt-1">{nextMeeting.location}</div>}
                </CardBody>
              </Card>
            )}

            {/* Quick Actions */}
            <div>
              <h3 className="text-xs font-medium text-txt3 uppercase tracking-wider mb-3 px-1">Quick Actions</h3>
              <div className="flex flex-col gap-2">
                <QuickLinkCard
                  to="/forum/new"
                  icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>}
                  title="New Discussion"
                  desc="Start a conversation"
                />
                <QuickLinkCard
                  to="/documents"
                  icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>}
                  title="Documents"
                  desc="Browse meeting materials"
                />
                <QuickLinkCard
                  to="/members"
                  icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
                  title="Member Directory"
                  desc="Find council members"
                />
                <QuickLinkCard
                  to="/messages"
                  icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>}
                  title="Messages"
                  desc="Direct & group messages"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
