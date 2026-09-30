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
        <Link to="/admin" className="text-sm text-navy hover:underline">&larr; Back to Admin</Link>
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
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  days === d
                    ? "bg-navy text-white"
                    : "bg-surface-alt text-txt2 hover:bg-border-light"
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
        <Card><CardBody><p className="text-txt3">No data available.</p></CardBody></Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardBody className="text-center">
                <div className="text-3xl font-bold text-navy">{report.total_events}</div>
                <div className="text-sm text-txt2 mt-1">Total Events</div>
              </CardBody>
            </Card>
            {Object.entries(report.action_counts)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3)
              .map(([action, count]) => (
                <Card key={action}>
                  <CardBody className="text-center">
                    <div className="text-3xl font-bold text-navy">{count}</div>
                    <div className="text-sm text-txt2 mt-1 capitalize">{action.replace(/_/g, " ")}s</div>
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
                      <div key={action} className="flex items-center gap-2 bg-surface-alt rounded-lg px-3 py-2">
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
                <div className="p-5 text-sm text-txt3">No activity in this period.</div>
              ) : (
                report.recent.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 px-5 py-3">
                    <Badge color={ACTION_COLORS[entry.action] || "gray"}>
                      {entry.action.replace(/_/g, " ")}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      {entry.entity_type && (
                        <span className="text-xs text-txt3">
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
