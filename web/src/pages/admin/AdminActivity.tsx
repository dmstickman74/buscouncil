import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { fmtRelative } from "@/lib/format";
import { Card, CardBody, CardHeader, PageHeader, Spinner, Badge } from "@/components/ui";

interface ActivityReport {
  period_days: number;
  total_events: number;
  action_counts: Record<string, number>;
  recent: {
    id: number;
    user_id: number | null;
    action: string;
    entity_type: string | null;
    entity_id: number | null;
    created_at: string;
  }[];
}

const ACTION_COLORS: Record<string, "green" | "blue" | "gold" | "gray" | "navy" | "red"> = {
  login: "green",
  create_thread: "navy",
  create_post: "blue",
  upload_document: "gold",
  create_user: "green",
  add_member: "green",
  remove_member: "red",
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  login: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>,
  create_thread: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" /></svg>,
  create_post: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>,
  upload_document: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>,
  create_user: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>,
  add_member: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>,
  remove_member: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>,
};

const STAT_ICONS: Record<string, React.ReactNode> = {
  total: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" /></svg>,
};

export function AdminActivityPage() {
  const [report, setReport] = useState<ActivityReport | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api<ActivityReport>(`/admin/activity?days=${days}`)
      .then(setReport)
      .finally(() => setLoading(false));
  }, [days]);

  return (
    <div>
      <div className="mb-4">
        <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-navy hover:underline">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          Back to Admin
        </Link>
      </div>

      <PageHeader
        title="Activity Reports"
        description="Track engagement and usage across the portal."
        actions={
          <div className="flex gap-2">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  days === d
                    ? "bg-navy text-white shadow-sm"
                    : "bg-surface border border-border-light text-txt2 hover:border-navy/20 hover:text-navy"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        }
      />

      {loading ? (
        <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>
      ) : !report ? (
        <Card>
          <CardBody className="text-center py-14">
            <div className="w-14 h-14 rounded-2xl bg-navy-50 text-navy flex items-center justify-center mx-auto mb-4">
              {STAT_ICONS.total}
            </div>
            <p className="text-txt2 mb-1 font-medium">No data available</p>
            <p className="text-sm text-txt3">Activity will appear here once users start using the portal.</p>
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardBody className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-navy-50 text-navy flex items-center justify-center shrink-0">
                  {STAT_ICONS.total}
                </div>
                <div>
                  <div className="text-2xl font-bold text-navy">{report.total_events}</div>
                  <div className="text-xs text-txt2">Total Events</div>
                </div>
              </CardBody>
            </Card>
            {Object.entries(report.action_counts)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3)
              .map(([action, count]) => (
                <Card key={action}>
                  <CardBody className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      ACTION_COLORS[action] === "green" ? "bg-green/10 text-green-dark" :
                      ACTION_COLORS[action] === "blue" ? "bg-blue/10 text-blue" :
                      ACTION_COLORS[action] === "gold" ? "bg-gold/10 text-gold" :
                      ACTION_COLORS[action] === "navy" ? "bg-navy-50 text-navy" :
                      "bg-navy-50 text-navy"
                    }`}>
                      {ACTION_ICONS[action] || STAT_ICONS.total}
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-navy">{count}</div>
                      <div className="text-xs text-txt2 capitalize">{action.replace(/_/g, " ")}s</div>
                    </div>
                  </CardBody>
                </Card>
              ))}
          </div>

          {Object.keys(report.action_counts).length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <h2 className="font-semibold text-txt">Actions Breakdown</h2>
              </CardHeader>
              <CardBody>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(report.action_counts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([action, count]) => (
                      <div key={action} className="flex items-center gap-2 bg-surface-alt rounded-xl px-3 py-2">
                        <Badge color={ACTION_COLORS[action] || "gray"}>{count}</Badge>
                        <span className="text-sm text-txt capitalize">{action.replace(/_/g, " ")}</span>
                      </div>
                    ))}
                </div>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-txt">Recent Activity</h2>
            </CardHeader>
            <div className="divide-y divide-border-light">
              {report.recent.length === 0 ? (
                <div className="p-5 text-sm text-txt3 text-center">No activity in this period.</div>
              ) : (
                report.recent.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 px-5 py-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      ACTION_COLORS[entry.action] === "green" ? "bg-green/10 text-green-dark" :
                      ACTION_COLORS[entry.action] === "blue" ? "bg-blue/10 text-blue" :
                      ACTION_COLORS[entry.action] === "gold" ? "bg-gold/10 text-gold" :
                      ACTION_COLORS[entry.action] === "red" ? "bg-red/10 text-red" :
                      ACTION_COLORS[entry.action] === "navy" ? "bg-navy-50 text-navy" :
                      "bg-navy-50 text-navy"
                    }`}>
                      {ACTION_ICONS[entry.action] || STAT_ICONS.total}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-txt capitalize">{entry.action.replace(/_/g, " ")}</span>
                      {entry.entity_type && (
                        <span className="text-xs text-txt3 ml-2">
                          {entry.entity_type} {entry.entity_id && `#${entry.entity_id}`}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-txt3 shrink-0">
                      {fmtRelative(entry.created_at)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
