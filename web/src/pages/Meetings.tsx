import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";
import { Card, CardBody, CardHeader, PageHeader, Spinner, Badge } from "@/components/ui";
import type { Meeting } from "@/lib/types";

export function MeetingsPage() {
  const { identity } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const councilId = identity?.council_id;

  useEffect(() => {
    if (!councilId) return;
    api<Meeting[]>(`/councils/${councilId}/meetings`)
      .then(setMeetings)
      .finally(() => setLoading(false));
  }, [councilId]);

  const now = new Date();
  const upcoming = meetings.filter((m) => new Date(m.meeting_date) >= now);
  const past = meetings.filter((m) => new Date(m.meeting_date) < now);

  return (
    <div>
      <PageHeader
        title="Meetings"
        description="Upcoming and past council meetings."
      />

      {loading ? (
        <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-txt">Upcoming Meetings</h2>
            </CardHeader>
            <CardBody className="p-0">
              {upcoming.length === 0 ? (
                <p className="p-5 text-sm text-txt3">No upcoming meetings scheduled.</p>
              ) : (
                <div className="divide-y divide-border-light">
                  {upcoming.map((m) => (
                    <div key={m.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-txt">{m.title}</span>
                            <Badge color="green">Upcoming</Badge>
                          </div>
                          <div className="text-sm text-txt2 mt-1">{fmtDateTime(m.meeting_date)}</div>
                          {m.location && <div className="text-sm text-txt3 mt-1">{m.location}</div>}
                          {m.description && <div className="text-sm text-txt3 mt-2">{m.description}</div>}
                        </div>
                        {m.meeting_link && (
                          <a href={m.meeting_link} target="_blank" rel="noreferrer"
                             className="text-sm text-navy font-medium hover:underline shrink-0">
                            Join
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {past.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-txt">Past Meetings</h2>
              </CardHeader>
              <CardBody className="p-0">
                <div className="divide-y divide-border-light">
                  {past.map((m) => (
                    <div key={m.id} className="px-5 py-4 opacity-75">
                      <div className="font-medium text-sm text-txt">{m.title}</div>
                      <div className="text-sm text-txt3 mt-1">{fmtDateTime(m.meeting_date)}</div>
                      {m.location && <div className="text-sm text-txt3">{m.location}</div>}
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
